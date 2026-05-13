import { MessagesService } from './messages.service';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    createRoom(userId: string, body: {
        participantIds: string[];
        name?: string;
        type?: 'direct' | 'group';
    }): Promise<import("./chat-room.entity").ChatRoom>;
    getRooms(userId: string): Promise<import("./chat-room.entity").ChatRoom[]>;
    getRoom(userId: string, roomId: string): Promise<import("./chat-room.entity").ChatRoom>;
    getMessages(userId: string, roomId: string, page?: number, limit?: number): Promise<import("./message.entity").Message[]>;
    getUnreadCount(userId: string): Promise<number>;
}
