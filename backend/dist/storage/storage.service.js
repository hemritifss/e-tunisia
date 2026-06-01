"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const path_1 = require("path");
const uuid_1 = require("uuid");
let StorageService = StorageService_1 = class StorageService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(StorageService_1.name);
        this.endpoint = this.configService.get('S3_ENDPOINT') || 'http://localhost:9000';
        this.bucket = this.configService.get('S3_BUCKET') || 'etunisia';
        const region = this.configService.get('S3_REGION') || 'us-east-1';
        const accessKey = this.configService.get('S3_ACCESS_KEY') || 'minioadmin';
        const secretKey = this.configService.get('S3_SECRET_KEY') || 'minioadmin';
        const forcePathStyle = this.configService.get('S3_FORCE_PATH_STYLE') === 'true';
        this.publicBase = (this.configService.get('S3_PUBLIC_URL') || '/uploads').replace(/\/+$/, '');
        this.s3Client = new client_s3_1.S3Client({
            region,
            endpoint: this.endpoint,
            forcePathStyle,
            credentials: {
                accessKeyId: accessKey,
                secretAccessKey: secretKey,
            },
        });
    }
    async onModuleInit() {
        try {
            await this.s3Client.send(new client_s3_1.HeadBucketCommand({ Bucket: this.bucket }));
        }
        catch {
            try {
                await this.s3Client.send(new client_s3_1.CreateBucketCommand({ Bucket: this.bucket }));
                this.logger.log(`Created bucket "${this.bucket}"`);
            }
            catch (e) {
                this.logger.warn(`Could not create bucket "${this.bucket}": ${e?.message}`);
            }
        }
        try {
            const policy = {
                Version: '2012-10-17',
                Statement: [{
                        Effect: 'Allow',
                        Principal: { AWS: ['*'] },
                        Action: ['s3:GetObject'],
                        Resource: [`arn:aws:s3:::${this.bucket}/*`],
                    }],
            };
            await this.s3Client.send(new client_s3_1.PutBucketPolicyCommand({
                Bucket: this.bucket,
                Policy: JSON.stringify(policy),
            }));
            this.logger.log(`Bucket "${this.bucket}" is publicly readable`);
        }
        catch (e) {
            this.logger.warn(`Could not set bucket policy: ${e?.message}`);
        }
    }
    publicUrl(key) {
        return `${this.publicBase}/${key}`;
    }
    internalUrl(key) {
        return `${this.endpoint.replace(/\/+$/, '')}/${this.bucket}/${key}`;
    }
    async uploadFile(buffer, originalName, folder = 'uploads', mimeType) {
        const extension = (0, path_1.extname)(originalName).toLowerCase();
        const key = `${folder}/${(0, uuid_1.v4)()}${extension}`;
        try {
            await this.s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: buffer,
                ContentType: mimeType || this.getMimeType(extension),
            }));
            const url = this.publicUrl(key);
            this.logger.log(`File uploaded: ${key}`);
            return { url, key, bucket: this.bucket };
        }
        catch (error) {
            this.logger.error(`Failed to upload file: ${error.message}`);
            throw error;
        }
    }
    async uploadDataUrl(dataUrl, folder = 'uploads') {
        if (!dataUrl || !dataUrl.startsWith('data:')) {
            throw new Error('Not a data URL');
        }
        const match = dataUrl.match(/^data:([^;,]+)(?:;([^,]+))?,(.+)$/);
        if (!match)
            throw new Error('Malformed data URL');
        const mime = match[1] || 'application/octet-stream';
        const isBase64 = (match[2] || '').includes('base64');
        const rawData = match[3];
        const buffer = isBase64
            ? Buffer.from(rawData, 'base64')
            : Buffer.from(decodeURIComponent(rawData), 'utf8');
        if (buffer.length > 12 * 1024 * 1024) {
            throw new Error('File too large (max 12MB)');
        }
        const ext = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'image/svg+xml': '.svg',
            'video/mp4': '.mp4',
            'video/webm': '.webm',
        }[mime] || '.bin';
        return this.uploadFile(buffer, `file${ext}`, folder, mime);
    }
    async deleteFile(key) {
        try {
            await this.s3Client.send(new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            }));
            this.logger.log(`File deleted: ${key}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete file: ${error.message}`);
            throw error;
        }
    }
    async getPresignedUrl(key, expiresIn = 3600) {
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            return await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
        }
        catch (error) {
            this.logger.error(`Failed to generate presigned URL: ${error.message}`);
            throw error;
        }
    }
    getMimeType(extension) {
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.pdf': 'application/pdf',
        };
        return mimeTypes[extension] || 'application/octet-stream';
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map