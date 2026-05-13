export declare class ChatRoom {
    id: string;
    name: string;
    description: string;
    coverImage: string;
    participantIds: string[];
    creatorId: string;
    type: 'direct' | 'group';
    lastMessage: {
        content: string;
        senderId: string;
        senderName: string;
        timestamp: Date;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
