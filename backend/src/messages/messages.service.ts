import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { ChatRoom } from './chat-room.entity';
import { EventsGateway } from '../websocket/websocket.gateway';
import { SafetyService } from '../safety/safety.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRepository(ChatRoom)
    private roomRepo: Repository<ChatRoom>,
    private safety: SafetyService,
    @Optional()
    @Inject(forwardRef(() => EventsGateway))
    private gateway?: EventsGateway,
  ) {}

  /**
   * Throws when a direct conversation between `userId` and `otherIds` is
   * barred by a block in either direction. Group rooms are left alone —
   * blocking someone should not eject you from shared group chats.
   */
  private async assertNotBlocked(userId: string, otherIds: string[]): Promise<void> {
    const hidden = await this.safety.getHiddenUserIds(userId);
    if (otherIds.some((id) => hidden.has(id))) {
      throw new ForbiddenException('You cannot message this user');
    }
  }

  async createRoom(
    creatorId: string,
    participantIds: string[],
    name?: string,
    type: 'direct' | 'group' = 'direct',
  ): Promise<ChatRoom> {
    const allParticipants = [...new Set([creatorId, ...participantIds])];

    if (type === 'direct') {
      await this.assertNotBlocked(creatorId, allParticipants.filter((id) => id !== creatorId));
    }

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
    const mine = rooms.filter(r => Array.isArray(r.participantIds) && r.participantIds.includes(userId));

    // Hide direct conversations with anyone blocked in either direction.
    const hidden = await this.safety.getHiddenUserIds(userId);
    if (hidden.size === 0) return mine;
    return mine.filter(r =>
      r.type !== 'direct' ||
      !r.participantIds.some((id) => id !== userId && hidden.has(id)),
    );
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

  /**
   * Unsend your own message. Soft-delete: the row stays as a tombstone so the
   * thread keeps its shape and both sides converge on the same history.
   */
  async deleteMessage(messageId: string, userId: string): Promise<{ ok: true; id: string }> {
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only remove your own messages');
    }
    if (message.isDeleted) return { ok: true, id: messageId };

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = '';
    message.metadata = null;
    await this.messageRepo.save(message);

    const room = await this.roomRepo.findOne({ where: { id: message.roomId } });

    // If this was the room's preview, fall back to the newest surviving message
    // so the inbox doesn't keep quoting text that no longer exists.
    if (room) {
      const latest = await this.messageRepo.findOne({
        where: { roomId: message.roomId, isDeleted: false },
        order: { createdAt: 'DESC' },
      });
      room.lastMessage = latest
        ? { content: latest.content, senderId: latest.senderId, senderName: '', timestamp: latest.createdAt }
        : null;
      await this.roomRepo.save(room);

      for (const uid of room.participantIds || []) {
        try {
          this.gateway?.broadcastToUser(uid, 'dm:message-deleted', {
            roomId: message.roomId,
            messageId,
          });
        } catch { /* best-effort */ }
      }
    }

    return { ok: true, id: messageId };
  }

  async saveMessage(
    roomId: string,
    senderId: string,
    content: string,
    type: string = 'text',
    metadata?: Record<string, unknown>,
  ): Promise<Message> {
    const room = await this.getRoom(roomId, senderId);

    // A block placed after the room was created must still stop new messages.
    if (room.type === 'direct') {
      await this.assertNotBlocked(
        senderId,
        (room.participantIds || []).filter((id) => id !== senderId),
      );
    }

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

    // Live read receipt to other participants
    try {
      const room = await this.roomRepo.findOne({ where: { id: roomId } });
      if (room?.participantIds?.length) {
        this.gateway?.broadcastReadReceipt(roomId, userId, room.participantIds);
      }
    } catch {}
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
