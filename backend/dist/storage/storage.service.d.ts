import { ConfigService } from '@nestjs/config';
export interface UploadedFile {
    url: string;
    key: string;
    bucket: string;
}
export declare class StorageService {
    private configService;
    private readonly logger;
    private readonly s3Client;
    private readonly bucket;
    private readonly endpoint;
    constructor(configService: ConfigService);
    uploadFile(buffer: Buffer, originalName: string, folder?: string, mimeType?: string): Promise<UploadedFile>;
    deleteFile(key: string): Promise<void>;
    getPresignedUrl(key: string, expiresIn?: number): Promise<string>;
    private getMimeType;
}
