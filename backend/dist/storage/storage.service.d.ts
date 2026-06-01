import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface UploadedFile {
    url: string;
    key: string;
    bucket: string;
}
export declare class StorageService implements OnModuleInit {
    private configService;
    private readonly logger;
    private readonly s3Client;
    private readonly bucket;
    private readonly endpoint;
    private readonly publicBase;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    publicUrl(key: string): string;
    internalUrl(key: string): string;
    uploadFile(buffer: Buffer, originalName: string, folder?: string, mimeType?: string): Promise<UploadedFile>;
    uploadDataUrl(dataUrl: string, folder?: string): Promise<UploadedFile>;
    deleteFile(key: string): Promise<void>;
    getPresignedUrl(key: string, expiresIn?: number): Promise<string>;
    private getMimeType;
}
