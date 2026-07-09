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
    origin: (origin: string | undefined, callback: (err: Error | null, allow: boolean) => void) => {
      // Allow same-origin requests and configured production domains
      const allowedPatterns = (
        process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()) || [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:4173',
        ]
      ).filter(Boolean);
      const originRegexes = allowedPatterns.map(pattern => {
        const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
        return new RegExp(`^${escaped}$`);
      });
      if (!origin || originRegexes.some(r => r.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`), false);
      }
    },
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]
  private messageRateLimits: Map<string, number[]> = new Map(); // userId -> timestamps[]
  private readonly MAX_MESSAGE_LENGTH = 2000;
  private readonly RATE_LIMIT_WINDOW_MS = 10000; // 10 seconds
  private readonly RATE_LIMIT_MAX_MSGS = 20; // 20 messages per 10s

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
      const wasOffline = sockets.length === 0;
      sockets.push(client.id);
      this.userSockets.set(payload.sub, sockets);

      // Join user's personal room
      client.join(`user:${payload.sub}`);

      // Broadcast presence change only on first socket
      if (wasOffline) {
        this.server.emit('presence:update', {
          userId: payload.sub,
          online: true,
          ts: new Date().toISOString(),
        });
      }

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
        // Last socket gone → user offline
        this.server.emit('presence:update', {
          userId,
          online: false,
          ts: new Date().toISOString(),
        });
      } else {
        this.userSockets.set(userId, filtered);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ---- Presence ----
  @SubscribeMessage('presence:list')
  handlePresenceList() {
    // Return list of currently-online userIds for snapshot syncing.
    return Array.from(this.userSockets.keys());
  }

  // ---- DM typing indicator: relay between participants ----
  @SubscribeMessage('dm:typing')
  handleDmTyping(client: Socket, payload: { roomId: string; participantIds: string[]; isTyping: boolean }) {
    const senderId = client.data.userId;
    if (!senderId || !payload?.participantIds) return { error: 'Unauthorized' };
    for (const uid of payload.participantIds) {
      if (uid === senderId) continue;
      this.server.to(`user:${uid}`).emit('dm:typing', {
        roomId: payload.roomId,
        userId: senderId,
        isTyping: !!payload.isTyping,
      });
    }
    return { status: 'ok' };
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

    // Rate limiting
    if (!this.checkRateLimit(userId)) {
      return { error: 'Rate limit exceeded. Please slow down.' };
    }

    // Message size validation
    if (!payload.content || payload.content.length > this.MAX_MESSAGE_LENGTH) {
      return { error: `Message too long (max ${this.MAX_MESSAGE_LENGTH} chars)` };
    }

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      roomId: payload.roomId,
      senderId: userId,
      senderName: user?.fullName || 'Anonymous',
      senderAvatar: user?.avatar,
      content: payload.content.trim(),
      type: payload.type || 'text',
      timestamp: new Date().toISOString(),
    };

    // Store in Redis for history (keep last 50 messages)
    this.redisService.client.lpush(`chat:${payload.roomId}:history`, JSON.stringify(message));
    this.redisService.client.ltrim(`chat:${payload.roomId}:history`, 0, 49);
    this.redisService.client.expire(`chat:${payload.roomId}:history`, 86400);

    // Also store latest for quick lookup
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
    const userId = client.data.userId;
    const user = client.data.user;

    if (!userId) return { error: 'Unauthorized' };

    // Rate limiting
    if (!this.checkRateLimit(userId)) {
      return { error: 'Rate limit exceeded. Please slow down.' };
    }

    // Comment size validation
    if (!payload.comment || payload.comment.length > this.MAX_MESSAGE_LENGTH) {
      return { error: `Comment too long (max ${this.MAX_MESSAGE_LENGTH} chars)` };
    }

    this.server.to(`stream:${payload.streamId}`).emit('stream:comment', {
      id: `c_${Date.now()}`,
      userId,
      userName: user?.fullName || 'Anonymous',
      avatar: user?.avatar,
      comment: payload.comment.trim(),
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

  broadcastReadReceipt(roomId: string, readerId: string, participantIds: string[]) {
    const payload = { roomId, readerId, ts: new Date().toISOString() };
    for (const uid of participantIds) {
      if (uid === readerId) continue;
      this.server.to(`user:${uid}`).emit('dm:read', payload);
    }
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const windowStart = now - this.RATE_LIMIT_WINDOW_MS;
    const timestamps = this.messageRateLimits.get(userId) || [];
    // Filter to only keep timestamps within the current window
    const recent = timestamps.filter(ts => ts > windowStart);
    if (recent.length >= this.RATE_LIMIT_MAX_MSGS) {
      return false;
    }
    recent.push(now);
    this.messageRateLimits.set(userId, recent);
    // Cleanup old entries periodically (simple garbage collection)
    if (recent.length === 1 && this.messageRateLimits.size > 10000) {
      this.gcRateLimits();
    }
    return true;
  }

  private gcRateLimits(): void {
    const now = Date.now();
    const windowStart = now - this.RATE_LIMIT_WINDOW_MS;
    for (const [userId, timestamps] of this.messageRateLimits.entries()) {
      const recent = timestamps.filter(ts => ts > windowStart);
      if (recent.length === 0) {
        this.messageRateLimits.delete(userId);
      } else {
        this.messageRateLimits.set(userId, recent);
      }
    }
  }
}
