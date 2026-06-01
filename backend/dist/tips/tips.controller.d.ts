import { TipsService } from './tips.service';
export declare class TipsController {
    private tipsService;
    constructor(tipsService: TipsService);
    findAll(category?: string): Promise<import("./tip.entity").Tip[]>;
    findOne(id: string): Promise<import("./tip.entity").Tip>;
    create(req: any, body: {
        title: string;
        content: string;
        category?: string;
        coverImage?: string;
    }): Promise<import("./tip.entity").Tip>;
    like(id: string): Promise<import("./tip.entity").Tip>;
}
