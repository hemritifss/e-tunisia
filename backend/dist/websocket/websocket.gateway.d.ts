import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
export declare class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private redisService;
    server: Server;
    private readonly logger;
    private userSockets;
    private messageRateLimits;
    private readonly MAX_MESSAGE_LENGTH;
    private readonly RATE_LIMIT_WINDOW_MS;
    private readonly RATE_LIMIT_MAX_MSGS;
    constructor(jwtService: JwtService, redisService: RedisService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handlePresenceList(): string[];
    handleDmTyping(client: Socket, payload: {
        roomId: string;
        participantIds: string[];
        isTyping: boolean;
    }): {
        error: string;
        status?: undefined;
    } | {
        status: string;
        error?: undefined;
    };
    handleFeedSubscribe(client: Socket): {
        status: string;
    };
    handleFeedUnsubscribe(client: Socket): {
        status: string;
    };
    handleVote(client: Socket, payload: {
        postId: string;
        direction: 'up' | 'down';
    }): Promise<{
        error: string;
        status?: undefined;
    } | {
        status: string;
        error?: undefined;
    }>;
    handleNotifSubscribe(client: Socket): {
        status: string;
    };
    handleChatJoin(client: Socket, roomId: string): {
        status: string;
        roomId: string;
    };
    handleChatLeave(client: Socket, roomId: string): {
        status: string;
        roomId: string;
    };
    handleChatMessage(client: Socket, payload: {
        roomId: string;
        content: string;
        type?: string;
    }): {
        error: string;
        status?: undefined;
        message?: undefined;
    } | {
        status: string;
        message: {
            id: string;
            roomId: string;
            senderId: any;
            senderName: any;
            senderAvatar: any;
            content: string;
            type: string;
            timestamp: string;
        };
        error?: undefined;
    };
    handleTyping(client: Socket, payload: {
        roomId: string;
        isTyping: boolean;
    }): void;
    handleStreamJoin(client: Socket, streamId: string): {
        status: string;
        viewerCount: number;
    };
    handleStreamComment(client: Socket, payload: {
        streamId: string;
        comment: string;
    }): {
        error: string;
        status?: undefined;
    } | {
        status: string;
        error?: undefined;
    };
    broadcastToUser(userId: string, event: string, data: any): void;
    broadcastToFeed(event: string, data: any): void;
    broadcastNotification(userId: string, notification: any): void;
    getOnlineUsersCount(): number;
    isUserOnline(userId: string): boolean;
    broadcastReadReceipt(roomId: string, readerId: string, participantIds: string[]): void;
    private checkRateLimit;
    private gcRateLimits;
}
