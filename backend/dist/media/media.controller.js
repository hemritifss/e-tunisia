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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
];
function fileFilter(req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
    }
}
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const storage_service_1 = require("../storage/storage.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const common_2 = require("@nestjs/common");
const queues_service_1 = require("../queues/queues.service");
let MediaController = class MediaController {
    constructor(storageService, queuesService) {
        this.storageService = storageService;
        this.queuesService = queuesService;
    }
    async uploadFile(file, folder) {
        const result = await this.storageService.uploadFile(file.buffer, file.originalname, folder || 'uploads', file.mimetype);
        if (file.mimetype?.startsWith('image/')) {
            try {
                await this.queuesService.addImageJob('optimize', {
                    key: result.key,
                    bucket: result.bucket,
                    url: result.url,
                    mimeType: file.mimetype,
                });
            }
            catch { }
        }
        return {
            success: true,
            url: result.url,
            key: result.key,
            bucket: result.bucket,
            size: file.size,
        };
    }
    async uploadDataUrl(body) {
        const result = await this.storageService.uploadDataUrl(body.dataUrl, body.folder || 'uploads');
        if (body.dataUrl?.startsWith('data:image/')) {
            try {
                await this.queuesService.addImageJob('optimize', {
                    key: result.key,
                    bucket: result.bucket,
                    url: result.url,
                    mimeType: body.dataUrl.match(/^data:([^;,]+)/)?.[1],
                });
            }
            catch { }
        }
        return {
            success: true,
            url: result.url,
            key: result.key,
            bucket: result.bucket,
        };
    }
    async uploadFiles(files, folder) {
        const uploads = await Promise.all(files.map((file) => this.storageService.uploadFile(file.buffer, file.originalname, folder || 'uploads', file.mimetype)));
        for (let i = 0; i < uploads.length; i++) {
            const result = uploads[i];
            const file = files[i];
            if (file.mimetype?.startsWith('image/')) {
                try {
                    await this.queuesService.addImageJob('optimize', {
                        key: result.key,
                        bucket: result.bucket,
                        url: result.url,
                        mimeType: file.mimetype,
                    });
                }
                catch { }
            }
        }
        return uploads.map((result, index) => ({
            success: true,
            url: result.url,
            key: result.key,
            bucket: result.bucket,
            size: files[index].size,
        }));
    }
};
exports.MediaController = MediaController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, common_2.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                folder: { type: 'string', default: 'uploads' },
            },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 50 * 1024 * 1024 },
        fileFilter,
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('folder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Post)('from-data-url'),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, common_2.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                dataUrl: { type: 'string' },
                folder: { type: 'string', default: 'uploads' },
            },
            required: ['dataUrl'],
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "uploadDataUrl", null);
__decorate([
    (0, common_1.Post)('upload-multiple'),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_2.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
                folder: { type: 'string', default: 'uploads' },
            },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10, {
        limits: { fileSize: 50 * 1024 * 1024 },
        fileFilter,
    })),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)('folder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "uploadFiles", null);
exports.MediaController = MediaController = __decorate([
    (0, swagger_1.ApiTags)('media'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('media'),
    __metadata("design:paramtypes", [storage_service_1.StorageService,
        queues_service_1.QueuesService])
], MediaController);
//# sourceMappingURL=media.controller.js.map