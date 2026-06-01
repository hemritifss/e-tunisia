"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EventsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const redis_service_1 = require("../redis/redis.service");
let EventsGateway = EventsGateway_1 = class EventsGateway {
    constructor(jwtService, redisService) {
        this.jwtService = jwtService;
        this.redisService = redisService;
        this.logger = new common_1.Logger(EventsGateway_1.name);
        this.userSockets = new Map();
        this.messageRateLimits = new Map();
        this.MAX_MESSAGE_LENGTH = 2000;
        this.RATE_LIMIT_WINDOW_MS = 10000;
        this.RATE_LIMIT_MAX_MSGS = 20;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token || client.handshake.query.token;
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token);
            client.data.userId = payload.sub;
            client.data.user = payload;
            const sockets = this.userSockets.get(payload.sub) || [];
            const wasOffline = sockets.length === 0;
            sockets.push(client.id);
            this.userSockets.set(payload.sub, sockets);
            client.join(`user:${payload.sub}`);
            if (wasOffline) {
                this.server.emit('presence:update', {
                    userId: payload.sub,
                    online: true,
                    ts: new Date().toISOString(),
                });
            }
            this.logger.log(`Client connected: ${client.id}, user: ${payload.sub}`);
        }
        catch (error) {
            this.logger.warn(`Invalid token, disconnecting: ${client.id}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const userId = client.data.userId;
        if (userId) {
            const sockets = this.userSockets.get(userId) || [];
            const filtered = sockets.filter((id) => id !== client.id);
            if (filtered.length === 0) {
                this.userSockets.delete(userId);
                this.server.emit('presence:update', {
                    userId,
                    online: false,
                    ts: new Date().toISOString(),
                });
            }
            else {
                this.userSockets.set(userId, filtered);
            }
        }
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handlePresenceList() {
        return Array.from(this.userSockets.keys());
    }
    handleDmTyping(client, payload) {
        const senderId = client.data.userId;
        if (!senderId || !payload?.participantIds)
            return { error: 'Unauthorized' };
        for (const uid of payload.participantIds) {
            if (uid === senderId)
                continue;
            this.server.to(`user:${uid}`).emit('dm:typing', {
                roomId: payload.roomId,
                userId: senderId,
                isTyping: !!payload.isTyping,
            });
        }
        return { status: 'ok' };
    }
    handleFeedSubscribe(client) {
        client.join('feed:global');
        return { status: 'ok' };
    }
    handleFeedUnsubscribe(client) {
        client.leave('feed:global');
        return { status: 'ok' };
    }
    async handleVote(client, payload) {
        const userId = client.data.userId;
        if (!userId)
            return { error: 'Unauthorized' };
        this.server.to('feed:global').emit('vote:updated', {
            postId: payload.postId,
            userId,
            direction: payload.direction,
            timestamp: new Date().toISOString(),
        });
        return { status: 'ok' };
    }
    handleNotifSubscribe(client) {
        const userId = client.data.userId;
        if (userId) {
            client.join(`notifs:${userId}`);
        }
        return { status: 'ok' };
    }
    handleChatJoin(client, roomId) {
        client.join(`chat:${roomId}`);
        client.to(`chat:${roomId}`).emit('chat:user_joined', {
            userId: client.data.userId,
            timestamp: new Date().toISOString(),
        });
        return { status: 'ok', roomId };
    }
    handleChatLeave(client, roomId) {
        client.leave(`chat:${roomId}`);
        client.to(`chat:${roomId}`).emit('chat:user_left', {
            userId: client.data.userId,
            timestamp: new Date().toISOString(),
        });
        return { status: 'ok', roomId };
    }
    handleChatMessage(client, payload) {
        const userId = client.data.userId;
        const user = client.data.user;
        if (!userId)
            return { error: 'Unauthorized' };
        if (!this.checkRateLimit(userId)) {
            return { error: 'Rate limit exceeded. Please slow down.' };
        }
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
        this.redisService.client.lpush(`chat:${payload.roomId}:history`, JSON.stringify(message));
        this.redisService.client.ltrim(`chat:${payload.roomId}:history`, 0, 49);
        this.redisService.client.expire(`chat:${payload.roomId}:history`, 86400);
        this.redisService.setJson(`chat:${payload.roomId}:latest`, message, 86400);
        this.server.to(`chat:${payload.roomId}`).emit('chat:message', message);
        return { status: 'ok', message };
    }
    handleTyping(client, payload) {
        client.to(`chat:${payload.roomId}`).emit('chat:typing', {
            userId: client.data.userId,
            isTyping: payload.isTyping,
        });
    }
    handleStreamJoin(client, streamId) {
        client.join(`stream:${streamId}`);
        const room = this.server.sockets.adapter.rooms.get(`stream:${streamId}`);
        const viewerCount = room ? room.size : 0;
        this.server.to(`stream:${streamId}`).emit('stream:viewers', { viewerCount });
        return { status: 'ok', viewerCount };
    }
    handleStreamComment(client, payload) {
        const userId = client.data.userId;
        const user = client.data.user;
        if (!userId)
            return { error: 'Unauthorized' };
        if (!this.checkRateLimit(userId)) {
            return { error: 'Rate limit exceeded. Please slow down.' };
        }
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
    broadcastToUser(userId, event, data) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
    broadcastToFeed(event, data) {
        this.server.to('feed:global').emit(event, data);
    }
    broadcastNotification(userId, notification) {
        this.server.to(`notifs:${userId}`).emit('notification:new', notification);
    }
    getOnlineUsersCount() {
        return this.userSockets.size;
    }
    isUserOnline(userId) {
        return this.userSockets.has(userId);
    }
    broadcastReadReceipt(roomId, readerId, participantIds) {
        const payload = { roomId, readerId, ts: new Date().toISOString() };
        for (const uid of participantIds) {
            if (uid === readerId)
                continue;
            this.server.to(`user:${uid}`).emit('dm:read', payload);
        }
    }
    checkRateLimit(userId) {
        const now = Date.now();
        const windowStart = now - this.RATE_LIMIT_WINDOW_MS;
        const timestamps = this.messageRateLimits.get(userId) || [];
        const recent = timestamps.filter(ts => ts > windowStart);
        if (recent.length >= this.RATE_LIMIT_MAX_MSGS) {
            return false;
        }
        recent.push(now);
        this.messageRateLimits.set(userId, recent);
        if (recent.length === 1 && this.messageRateLimits.size > 10000) {
            this.gcRateLimits();
        }
        return true;
    }
    gcRateLimits() {
        const now = Date.now();
        const windowStart = now - this.RATE_LIMIT_WINDOW_MS;
        for (const [userId, timestamps] of this.messageRateLimits.entries()) {
            const recent = timestamps.filter(ts => ts > windowStart);
            if (recent.length === 0) {
                this.messageRateLimits.delete(userId);
            }
            else {
                this.messageRateLimits.set(userId, recent);
            }
        }
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('presence:list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handlePresenceList", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('dm:typing'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleDmTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('feed:subscribe'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleFeedSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('feed:unsubscribe'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleFeedUnsubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('vote'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "handleVote", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('notif:subscribe'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleNotifSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:join'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleChatJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:leave'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleChatLeave", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:message'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleChatMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:typing'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('stream:join'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleStreamJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('stream:comment'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleStreamComment", null);
exports.EventsGateway = EventsGateway = EventsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: (origin, callback) => {
                const allowedPatterns = (process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()) || [
                    'http://localhost:5173',
                    'http://localhost:3000',
                    'http://localhost:4173',
                ]).filter(Boolean);
                const originRegexes = allowedPatterns.map(pattern => {
                    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
                    return new RegExp(`^${escaped}$`);
                });
                if (!origin || originRegexes.some(r => r.test(origin))) {
                    callback(null, true);
                }
                else {
                    callback(new Error(`Not allowed by CORS: ${origin}`), false);
                }
            },
            credentials: true,
        },
        namespace: '/events',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        redis_service_1.RedisService])
], EventsGateway);
//# sourceMappingURL=websocket.gateway.js.map