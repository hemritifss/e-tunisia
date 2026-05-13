export declare enum ActivityType {
    VISITED_PLACE = "visited_place",
    WROTE_REVIEW = "wrote_review",
    SHARED_POST = "shared_post",
    ADDED_FAVORITE = "added_favorite",
    EARNED_BADGE = "earned_badge",
    COMPLETED_CHALLENGE = "completed_challenge",
    FOLLOWED_USER = "followed_user",
    BOOKED_EXPERIENCE = "booked_experience"
}
export declare class Activity {
    id: string;
    userId: string;
    type: ActivityType;
    data: {
        placeId?: string;
        placeName?: string;
        placeImage?: string;
        reviewId?: string;
        postId?: string;
        badgeName?: string;
        badgeIcon?: string;
        targetUserId?: string;
        targetUserName?: string;
        bookingId?: string;
        challengeTitle?: string;
    };
    isPublic: boolean;
    createdAt: Date;
}
