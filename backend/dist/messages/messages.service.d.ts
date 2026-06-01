import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { ChatRoom } from './chat-room.entity';
import { EventsGateway } from '../websocket/websocket.gateway';
export declare class MessagesService {
    private messageRepo;
    private roomRepo;
    private gateway?;
    constructor(messageRepo: Repository<Message>, roomRepo: Repository<ChatRoom>, gateway?: EventsGateway);
    createRoom(creatorId: string, participantIds: string[], name?: string, type?: 'direct' | 'group'): Promise<ChatRoom>;
    getRooms(userId: string): Promise<ChatRoom[]>;
    getRoom(roomId: string, userId: string): Promise<ChatRoom>;
    getMessages(roomId: string, userId: string, page?: number, limit?: number): Promise<Message[]>;
    saveMessage(roomId: string, senderId: string, content: string, type?: string, metadata?: Record<string, unknown>): Promise<Message>;
    markAsRead(roomId: string, userId: string): Promise<void>;
    getUnreadCount(userId: string): Promise<number>;
}
