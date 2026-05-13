import { StorageService } from '../storage/storage.service';
export declare class MediaController {
    private readonly storageService;
    constructor(storageService: StorageService);
    uploadFile(file: Express.Multer.File, folder?: string): Promise<{
        success: boolean;
        url: string;
        key: string;
        bucket: string;
        size: number;
    }>;
    uploadFiles(files: Express.Multer.File[], folder?: string): Promise<{
        success: boolean;
        url: string;
        key: string;
        bucket: string;
        size: number;
    }[]>;
}
