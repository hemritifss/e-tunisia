import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { ChatRoom } from './chat-room.entity';
import { EventsGateway } from '../websocket/websocket.gateway';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRepository(ChatRoom)
    private roomRepo: Repository<ChatRoom>,
    @Optional()
    @Inject(forwardRef(() => EventsGateway))
    private gateway?: EventsGateway,
  ) {}

  async createRoom(
    creatorId: string,
    participantIds: string[],
    name?: string,
    type: 'direct' | 'group' = 'direct',
  ): Promise<ChatRoom> {
    const allParticipants = [...new Set([creatorId, ...participantIds])];

    // For DM, dedupe: find an existing direct room with exactly the same 2 participants.
    // participantIds is stored as comma-separated text — match via LIKE on both ids.
    if (type === 'direct' && allParticipants.length === 2) {
      const candidates = await this.roomRepo
        .createQueryBuilder('room')
        .where('room.type = :type', { type: 'direct' })
        .andWhere('room.participantIds LIKE :a', { a: `%${allParticipants[0]}%` })
        .andWhere('room.participantIds LIKE :b', { b: `%${allParticipants[1]}%` })
        .getMany();

      const existing = candidates.find(r =>
        Array.isArray(r.participantIds) &&
        r.participantIds.length === 2 &&
        allParticipants.every(id => r.participantIds.includes(id)),
      );
      if (existing) {
        if (!existing.isActive) {
          existing.isActive = true;
          await this.roomRepo.save(existing);
        }
        return existing;
      }
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

  async getRooms(userId: string): Promise<ChatRoom[]> {
    const rooms = await this.roomRepo
      .createQueryBuilder('room')
      .where('room.participantIds LIKE :u', { u: `%${userId}%` })
      .andWhere('room.isActive = true')
      .orderBy('room.updatedAt', 'DESC')
      .getMany();
    // Post-filter (participant id substrings could collide — verify exact membership)
    return rooms.filter(r => Array.isArray(r.participantIds) && r.participantIds.includes(userId));
  }

  async getRoom(roomId: string, userId: string): Promise<ChatRoom> {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (!room.participantIds.includes(userId)) {
      throw new ForbiddenException('Not a participant');
    }
    return room;
  }

  async getMessages(
    roomId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<Message[]> {
    await this.getRoom(roomId, userId); // Verify access

    return this.messageRepo.find({
      where: { roomId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async saveMessage(
    roomId: string,
    senderId: string,
    content: string,
    type: string = 'text',
    metadata?: Record<string, unknown>,
  ): Promise<Message> {
    const room = await this.getRoom(roomId, senderId);

    const message = this.messageRepo.create({
      roomId,
      senderId,
      content,
      type,
      metadata,
    });

    const saved = await this.messageRepo.save(message);

    // Update room's last message
    room.lastMessage = {
      content,
      senderId,
      senderName: '', // Would need to look up user name
      timestamp: new Date(),
    };
    await this.roomRepo.save(room);

    // Live broadcast to every participant's personal channel — both inbox + open thread tabs hear it.
    try {
      for (const uid of room.participantIds || []) {
        this.gateway?.broadcastToUser(uid, 'dm:new-message', {
          roomId,
          message: saved,
        });
      }
    } catch {}

    return saved;
  }

  async markAsRead(roomId: string, userId: string): Promise<void> {
    await this.messageRepo
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('roomId = :roomId', { roomId })
      .andWhere('senderId != :userId', { userId })
      .andWhere('isRead = false')
      .execute();
  }

  async getUnreadCount(userId: string): Promise<number> {
    const rooms = await this.getRooms(userId);
    const roomIds = rooms.map((r) => r.id);

    if (roomIds.length === 0) return 0;

    return this.messageRepo.count({
      where: {
        roomId: roomIds as any,
        senderId: userId,
        isRead: false,
      },
    });
  }
}
