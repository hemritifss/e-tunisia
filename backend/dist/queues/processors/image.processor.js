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
var ImageProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const sharp_1 = require("sharp");
const storage_service_1 = require("../../storage/storage.service");
let ImageProcessor = ImageProcessor_1 = class ImageProcessor extends bullmq_1.WorkerHost {
    constructor(storageService) {
        super();
        this.storageService = storageService;
        this.logger = new common_1.Logger(ImageProcessor_1.name);
    }
    async process(job) {
        const { name, data, id } = job;
        this.logger.debug(`Processing image job ${id} (${name})`);
        try {
            switch (name) {
                case 'optimize': {
                    const d = data;
                    return await this.handleOptimize(d);
                }
                case 'generate_thumbnails': {
                    const d = data;
                    return await this.handleThumbnails(d);
                }
                default:
                    this.logger.warn(`Unknown image job type: ${name}`);
                    return { skipped: true };
            }
        }
        catch (error) {
            this.logger.error(`Image job ${id} failed: ${error.message}`);
            throw error;
        }
    }
    async handleOptimize(data) {
        if (!data.mimeType?.startsWith('image/')) {
            this.logger.debug(`Skipping non-image file: ${data.key}`);
            return { skipped: true, reason: 'not_an_image' };
        }
        if (data.mimeType === 'image/webp' || data.mimeType === 'image/svg+xml') {
            this.logger.debug(`Skipping already-optimized file: ${data.key}`);
            return { skipped: true, reason: 'already_optimized' };
        }
        try {
            const response = await fetch(data.url);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status}`);
            }
            const buffer = Buffer.from(await response.arrayBuffer());
            const webpBuffer = await (0, sharp_1.default)(buffer)
                .webp({ quality: 80, effort: 4 })
                .toBuffer();
            const webpKey = data.key.replace(/\.[^.]+$/, '.webp');
            await this.storageService.uploadFile(webpBuffer, webpKey.split('/').pop(), data.key.split('/')[0], 'image/webp');
            this.logger.log(`Created WebP variant for ${data.key} → ${webpKey}`);
            return { optimized: true, originalKey: data.key, webpKey };
        }
        catch (error) {
            this.logger.error(`Failed to optimize ${data.key}: ${error.message}`);
            throw error;
        }
    }
    async handleThumbnails(data) {
        if (!data.url.match(/\.(jpg|jpeg|png|webp)$/i)) {
            this.logger.debug(`Skipping thumbnail generation for non-image: ${data.key}`);
            return { skipped: true, reason: 'not_an_image' };
        }
        const sizes = data.sizes || [
            { name: 'thumb', width: 300, height: 300 },
            { name: 'medium', width: 800, height: 600 },
        ];
        try {
            const response = await fetch(data.url);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status}`);
            }
            const buffer = Buffer.from(await response.arrayBuffer());
            const results = [];
            for (const size of sizes) {
                const resizedBuffer = await (0, sharp_1.default)(buffer)
                    .resize(size.width, size.height, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toBuffer();
                const thumbKey = data.key.replace(/\.[^.]+$/, `_${size.name}.webp`);
                const folder = data.key.split('/')[0] || 'uploads';
                const result = await this.storageService.uploadFile(resizedBuffer, thumbKey.split('/').pop(), folder, 'image/webp');
                results.push({ name: size.name, key: thumbKey, url: result.url });
            }
            this.logger.log(`Generated ${results.length} thumbnails for ${data.key}`);
            return { thumbnails: results };
        }
        catch (error) {
            this.logger.error(`Failed to generate thumbnails for ${data.key}: ${error.message}`);
            throw error;
        }
    }
};
exports.ImageProcessor = ImageProcessor;
exports.ImageProcessor = ImageProcessor = ImageProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('images'),
    __metadata("design:paramtypes", [storage_service_1.StorageService])
], ImageProcessor);
//# sourceMappingURL=image.processor.js.map