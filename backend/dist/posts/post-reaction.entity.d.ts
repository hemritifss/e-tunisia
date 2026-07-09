export declare enum ReactionType {
    LIKE = "like",
    LOVE = "love",
    CELEBRATE = "celebrate",
    INSIGHTFUL = "insightful",
    LAUGH = "laugh",
    WOW = "wow",
    SUPPORT = "support"
}
export declare class PostReaction {
    id: string;
    postId: string;
    userId: string;
    type: ReactionType;
    createdAt: Date;
}
