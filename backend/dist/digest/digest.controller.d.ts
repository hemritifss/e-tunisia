import { DigestService } from './digest.service';
export declare class DigestController {
    private readonly digest;
    constructor(digest: DigestService);
    test(req: any): Promise<{
        sent: boolean;
    }>;
}
