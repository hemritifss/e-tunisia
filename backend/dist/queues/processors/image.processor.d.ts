import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { StorageService } from '../../storage/storage.service';
interface OptimizeImageData {
    key: string;
    bucket: string;
    url: string;
    mimeType?: string;
}
interface GenerateThumbnailsData {
    key: string;
    bucket: string;
    url: string;
    sizes?: Array<{
        name: string;
        width: number;
        height: number;
    }>;
}
export declare class ImageProcessor extends WorkerHost {
    private storageService;
    private readonly logger;
    constructor(storageService: StorageService);
    process(job: Job<OptimizeImageData | GenerateThumbnailsData>): Promise<any>;
    private handleOptimize;
    private handleThumbnails;
}
export {};
