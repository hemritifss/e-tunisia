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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const message_entity_1 = require("./message.entity");
const chat_room_entity_1 = require("./chat-room.entity");
let MessagesService = class MessagesService {
    constructor(messageRepo, roomRepo) {
        this.messageRepo = messageRepo;
        this.roomRepo = roomRepo;
    }
    async createRoom(creatorId, participantIds, name, type = 'direct') {
        const allParticipants = [...new Set([creatorId, ...participantIds])];
        if (type === 'direct' && allParticipants.length === 2) {
            const existing = await this.roomRepo
                .createQueryBuilder('room')
                .where('room.type = :type', { type: 'direct' })
                .andWhere('room.participantIds @> :ids', { ids: JSON.stringify(allParticipants) })
                .andWhere('room.participantIds <@ :ids', { ids: JSON.stringify(allParticipants) })
                .getOne();
            if (existing)
                return existing;
        }
        const room = this.roomRepo.create({
            name: name || (type === 'direct' ? 'Direct Message' : 'Group Chat'),
            participantIds: allParticipants,
            creatorId,
            type,
            isActive: true,
        });
        return this.roomRepo.save(room);
    }
    async getRooms(userId) {
        return this.roomRepo
            .createQueryBuilder('room')
            .where(':userId = ANY(room.participantIds)', { userId })
            .andWhere('room.isActive = true')
            .orderBy('room.updatedAt', 'DESC')
            .getMany();
    }
    async getRoom(roomId, userId) {
        const room = await this.roomRepo.findOne({ where: { id: roomId } });
        if (!room)
            throw new common_1.NotFoundException('Room not found');
        if (!room.participantIds.includes(userId)) {
            throw new common_1.ForbiddenException('Not a participant');
        }
        return room;
    }
    async getMessages(roomId, userId, page = 1, limit = 50) {
        await this.getRoom(roomId, userId);
        return this.messageRepo.find({
            where: { roomId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
    }
    async saveMessage(roomId, senderId, content, type = 'text', metadata) {
        const room = await this.getRoom(roomId, senderId);
        const message = this.messageRepo.create({
            roomId,
            senderId,
            content,
            type,
            metadata,
        });
        const saved = await this.messageRepo.save(message);
        room.lastMessage = {
            content,
            senderId,
            senderName: '',
            timestamp: new Date(),
        };
        await this.roomRepo.save(room);
        return saved;
    }
    async markAsRead(roomId, userId) {
        await this.messageRepo
            .createQueryBuilder()
            .update(message_entity_1.Message)
            .set({ isRead: true })
            .where('roomId = :roomId', { roomId })
            .andWhere('senderId != :userId', { userId })
            .andWhere('isRead = false')
            .execute();
    }
    async getUnreadCount(userId) {
        const rooms = await this.getRooms(userId);
        const roomIds = rooms.map((r) => r.id);
        if (roomIds.length === 0)
            return 0;
        return this.messageRepo.count({
            where: {
                roomId: roomIds,
                senderId: userId,
                isRead: false,
            },
        });
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __param(1, (0, typeorm_1.InjectRepository)(chat_room_entity_1.ChatRoom)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], MessagesService);
//# sourceMappingURL=messages.service.js.map