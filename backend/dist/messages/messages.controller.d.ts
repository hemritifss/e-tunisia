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
    sendMessage(userId: string, roomId: string, body: {
        content: string;
        type?: string;
        metadata?: Record<string, unknown>;
    }): Promise<import("./message.entity").Message>;
    markRead(userId: string, roomId: string): Promise<{
        ok: boolean;
    }>;
    openDirect(me: string, other: string): Promise<import("./chat-room.entity").ChatRoom>;
    deleteMessage(userId: string, messageId: string): Promise<{
        ok: true;
        id: string;
    }>;
}
