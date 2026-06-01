import { StorageService } from '../storage/storage.service';
import { QueuesService } from '../queues/queues.service';
export declare class MediaController {
    private readonly storageService;
    private readonly queuesService;
    constructor(storageService: StorageService, queuesService: QueuesService);
    uploadFile(file: Express.Multer.File, folder?: string): Promise<{
        success: boolean;
        url: string;
        key: string;
        bucket: string;
        size: number;
    }>;
    uploadDataUrl(body: {
        dataUrl: string;
        folder?: string;
    }): Promise<{
        success: boolean;
        url: string;
        key: string;
        bucket: string;
    }>;
    uploadFiles(files: Express.Multer.File[], folder?: string): Promise<{
        success: boolean;
        url: string;
        key: string;
        bucket: string;
        size: number;
    }[]>;
}
