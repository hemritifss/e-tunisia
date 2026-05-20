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
const swagger_1 = require("@nestjs/swagger");
const storage_service_1 = require("../storage/storage.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const common_2 = require("@nestjs/common");
let MediaController = class MediaController {
    constructor(storageService) {
        this.storageService = storageService;
    }
    async uploadFile(file, folder) {
        const result = await this.storageService.uploadFile(file.buffer, file.originalname, folder || 'uploads', file.mimetype);
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
        return {
            success: true,
            url: result.url,
            key: result.key,
            bucket: result.bucket,
        };
    }
    async uploadFiles(files, folder) {
        const uploads = await Promise.all(files.map((file) => this.storageService.uploadFile(file.buffer, file.originalname, folder || 'uploads', file.mimetype)));
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
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('folder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Post)('from-data-url'),
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
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10)),
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
    __metadata("design:paramtypes", [storage_service_1.StorageService])
], MediaController);
//# sourceMappingURL=media.controller.js.map