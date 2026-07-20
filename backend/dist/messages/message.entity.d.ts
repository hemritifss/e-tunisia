export declare class Message {
    id: string;
    roomId: string;
    senderId: string;
    content: string;
    type: string;
    metadata: Record<string, unknown>;
    isRead: boolean;
    isDeleted: boolean;
    deletedAt: Date | null;
    createdAt: Date;
}
