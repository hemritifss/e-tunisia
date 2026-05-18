import { Repository } from 'typeorm';
import { Block } from './block.entity';
import { Report, ReportReason, ReportTargetType } from './report.entity';
import { User } from '../users/user.entity';
export declare class SafetyService {
    private blocks;
    private reports;
    private users;
    constructor(blocks: Repository<Block>, reports: Repository<Report>, users: Repository<User>);
    block(blockerId: string, blockedId: string): Promise<Block>;
    unblock(blockerId: string, blockedId: string): Promise<{
        ok: boolean;
    }>;
    isBlocked(blockerId: string, blockedId: string): Promise<{
        isBlocked: boolean;
    }>;
    listBlocked(blockerId: string): Promise<{
        id: string;
        blockedAt: Date;
        user: {
            id: string;
            fullName: string;
            avatar: string;
            country: string;
        };
    }[]>;
    getHiddenUserIds(viewerId: string): Promise<Set<string>>;
    report(reporterId: string, body: {
        targetType: ReportTargetType;
        targetId: string;
        reason: ReportReason;
        details?: string;
        targetOwnerId?: string;
    }): Promise<Report>;
    listMyReports(reporterId: string): Promise<Report[]>;
}
