import { GamificationService } from './gamification.service';
export declare class GamificationController {
    private readonly gamificationService;
    constructor(gamificationService: GamificationService);
    getAllBadges(): Promise<import("./badge.entity").Badge[]>;
    getMyBadges(req: any): Promise<import("./user-badge.entity").UserBadge[]>;
    getMyPoints(req: any): Promise<{
        points: number;
        level: number;
        nextLevelPoints: number;
    }>;
    getMyRank(req: any): Promise<{
        rank: number;
    }>;
    getLeaderboard(limit?: number): Promise<import("../users/user.entity").User[]>;
    addPoints(req: any, body: {
        points: number;
        reason: string;
    }): Promise<{
        points: number;
        added: number;
        reason: string;
    }>;
}
