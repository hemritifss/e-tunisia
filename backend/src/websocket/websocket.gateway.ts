import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]

  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.query.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token as string);
      client.data.userId = payload.sub;
      client.data.user = payload;

      // Track user's sockets
      const sockets = this.userSockets.get(payload.sub) || [];
      sockets.push(client.id);
      this.userSockets.set(payload.sub, sockets);

      // Join user's personal room
      client.join(`user:${payload.sub}`);

      this.logger.log(`Client connected: ${client.id}, user: ${payload.sub}`);
    } catch (error) {
      this.logger.warn(`Invalid token, disconnecting: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId) || [];
      const filtered = sockets.filter((id) => id !== client.id);
      if (filtered.length === 0) {
        this.userSockets.delete(userId);
      } else {
        this.userSockets.set(userId, filtered);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ---- Feed Events ----
  @SubscribeMessage('feed:subscribe')
  handleFeedSubscribe(client: Socket) {
    client.join('feed:global');
    return { status: 'ok' };
  }

  @SubscribeMessage('feed:unsubscribe')
  handleFeedUnsubscribe(client: Socket) {
    client.leave('feed:global');
    return { status: 'ok' };
  }

  // ---- Vote Events ----
  @SubscribeMessage('vote')
  async handleVote(
    client: Socket,
    payload: { postId: string; direction: 'up' | 'down' },
  ) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Unauthorized' };

    // Broadcast vote to all feed subscribers
    this.server.to('feed:global').emit('vote:updated', {
      postId: payload.postId,
      userId,
      direction: payload.direction,
      timestamp: new Date().toISOString(),
    });

    return { status: 'ok' };
  }

  // ---- Notification Events ----
  @SubscribeMessage('notif:subscribe')
  handleNotifSubscribe(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      client.join(`notifs:${userId}`);
    }
    return { status: 'ok' };
  }

  // ---- Chat Events ----
  @SubscribeMessage('chat:join')
  handleChatJoin(client: Socket, roomId: string) {
    client.join(`chat:${roomId}`);
    client.to(`chat:${roomId}`).emit('chat:user_joined', {
      userId: client.data.userId,
      timestamp: new Date().toISOString(),
    });
    return { status: 'ok', roomId };
  }

  @SubscribeMessage('chat:leave')
  handleChatLeave(client: Socket, roomId: string) {
    client.leave(`chat:${roomId}`);
    client.to(`chat:${roomId}`).emit('chat:user_left', {
      userId: client.data.userId,
      timestamp: new Date().toISOString(),
    });
    return { status: 'ok', roomId };
  }

  @SubscribeMessage('chat:message')
  handleChatMessage(
    client: Socket,
    payload: { roomId: string; content: string; type?: string },
  ) {
    const userId = client.data.userId;
    const user = client.data.user;

    if (!userId) return { error: 'Unauthorized' };

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      roomId: payload.roomId,
      senderId: userId,
      senderName: user?.fullName || 'Anonymous',
      senderAvatar: user?.avatar,
      content: payload.content,
      type: payload.type || 'text',
      timestamp: new Date().toISOString(),
    };

    // Store in Redis for history
    this.redisService.setJson(
      `chat:${payload.roomId}:latest`,
      message,
      86400, // 24 hours
    );

    // Broadcast to room
    this.server.to(`chat:${payload.roomId}`).emit('chat:message', message);

    return { status: 'ok', message };
  }

  @SubscribeMessage('chat:typing')
  handleTyping(client: Socket, payload: { roomId: string; isTyping: boolean }) {
    client.to(`chat:${payload.roomId}`).emit('chat:typing', {
      userId: client.data.userId,
      isTyping: payload.isTyping,
    });
  }

  // ---- Live Stream Events ----
  @SubscribeMessage('stream:join')
  handleStreamJoin(client: Socket, streamId: string) {
    client.join(`stream:${streamId}`);
    // Update viewer count
    const room = this.server.sockets.adapter.rooms.get(`stream:${streamId}`);
    const viewerCount = room ? room.size : 0;
    this.server.to(`stream:${streamId}`).emit('stream:viewers', { viewerCount });
    return { status: 'ok', viewerCount };
  }

  @SubscribeMessage('stream:comment')
  handleStreamComment(
    client: Socket,
    payload: { streamId: string; comment: string },
  ) {
    const user = client.data.user;
    this.server.to(`stream:${payload.streamId}`).emit('stream:comment', {
      id: `c_${Date.now()}`,
      userId: client.data.userId,
      userName: user?.fullName || 'Anonymous',
      avatar: user?.avatar,
      comment: payload.comment,
      timestamp: new Date().toISOString(),
    });
    return { status: 'ok' };
  }

  // ---- Public API for other services ----
  broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  broadcastToFeed(event: string, data: any) {
    this.server.to('feed:global').emit(event, data);
  }

  broadcastNotification(userId: string, notification: any) {
    this.server.to(`notifs:${userId}`).emit('notification:new', notification);
  }

  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}
