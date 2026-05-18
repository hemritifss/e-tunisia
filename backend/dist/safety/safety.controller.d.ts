import { SafetyService } from './safety.service';
import { ReportReason, ReportTargetType } from './report.entity';
declare class ReportDto {
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    details?: string;
    targetOwnerId?: string;
}
export declare class SafetyController {
    private safety;
    constructor(safety: SafetyService);
    block(req: any, userId: string): Promise<import("./block.entity").Block>;
    unblock(req: any, userId: string): Promise<{
        ok: boolean;
    }>;
    isBlocked(req: any, userId: string): Promise<{
        isBlocked: boolean;
    }>;
    listBlocks(req: any): Promise<{
        id: string;
        blockedAt: Date;
        user: {
            id: string;
            fullName: string;
            avatar: string;
            country: string;
        };
    }[]>;
    report(req: any, body: ReportDto): Promise<import("./report.entity").Report>;
    listMyReports(req: any): Promise<import("./report.entity").Report[]>;
}
export {};
