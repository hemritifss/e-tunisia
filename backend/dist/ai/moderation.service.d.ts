import { ReportReason } from '../safety/report.entity';
import { LlmService } from './llm.service';
export type ModerationAction = 'allow' | 'flag' | 'block';
export interface ModerationVerdict {
    action: ModerationAction;
    reason: ReportReason | null;
    explanation: string;
}
export declare class ModerationService {
    private readonly llm;
    private readonly logger;
    constructor(llm: LlmService);
    moderateText(text: string): Promise<ModerationVerdict>;
    private parseVerdict;
    private toReason;
    private heuristic;
}
