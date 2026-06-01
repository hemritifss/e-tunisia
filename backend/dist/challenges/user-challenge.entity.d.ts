import { Challenge } from './challenge.entity';
export declare enum UserChallengeStatus {
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CLAIMED = "claimed",
    EXPIRED = "expired"
}
export declare class UserChallenge {
    id: string;
    userId: string;
    challengeId: string;
    challenge: Challenge;
    status: UserChallengeStatus;
    progress: number;
    target: number;
    progressDetails: Record<string, unknown>;
    completedAt: Date;
    claimedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
