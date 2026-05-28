import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import sharp from 'sharp';
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
  sizes?: Array<{ name: string; width: number; height: number }>;
}

@Processor('images')
export class ImageProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageProcessor.name);

  constructor(private storageService: StorageService) {
    super();
  }

  async process(job: Job<OptimizeImageData | GenerateThumbnailsData>): Promise<any> {
    const { name, data, id } = job;
    this.logger.debug(`Processing image job ${id} (${name})`);

    try {
      switch (name) {
        case 'optimize': {
          const d = data as OptimizeImageData;
          return await this.handleOptimize(d);
        }
        case 'generate_thumbnails': {
          const d = data as GenerateThumbnailsData;
          return await this.handleThumbnails(d);
        }
        default:
          this.logger.warn(`Unknown image job type: ${name}`);
          return { skipped: true };
      }
    } catch (error: any) {
      this.logger.error(`Image job ${id} failed: ${error.message}`);
      throw error;
    }
  }

  private async handleOptimize(data: OptimizeImageData): Promise<any> {
    // Skip non-image files
    if (!data.mimeType?.startsWith('image/')) {
      this.logger.debug(`Skipping non-image file: ${data.key}`);
      return { skipped: true, reason: 'not_an_image' };
    }

    // Skip already-optimized formats (WebP, SVG)
    if (data.mimeType === 'image/webp' || data.mimeType === 'image/svg+xml') {
      this.logger.debug(`Skipping already-optimized file: ${data.key}`);
      return { skipped: true, reason: 'already_optimized' };
    }

    try {
      // Fetch the original image
      const response = await fetch(data.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());

      // Create WebP variant
      const webpBuffer = await sharp(buffer)
        .webp({ quality: 80, effort: 4 })
        .toBuffer();

      const webpKey = data.key.replace(/\.[^.]+$/, '.webp');

      // Upload WebP variant
      await this.storageService.uploadFile(webpBuffer, webpKey.split('/').pop()!, data.key.split('/')[0], 'image/webp');

      this.logger.log(`Created WebP variant for ${data.key} → ${webpKey}`);
      return { optimized: true, originalKey: data.key, webpKey };
    } catch (error: any) {
      this.logger.error(`Failed to optimize ${data.key}: ${error.message}`);
      throw error;
    }
  }

  private async handleThumbnails(data: GenerateThumbnailsData): Promise<any> {
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

      const results: Array<{ name: string; key: string; url: string }> = [];

      for (const size of sizes) {
        const resizedBuffer = await sharp(buffer)
          .resize(size.width, size.height, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        const thumbKey = data.key.replace(/\.[^.]+$/, `_${size.name}.webp`);
        const folder = data.key.split('/')[0] || 'uploads';

        const result = await this.storageService.uploadFile(
          resizedBuffer,
          thumbKey.split('/').pop()!,
          folder,
          'image/webp',
        );

        results.push({ name: size.name, key: thumbKey, url: result.url });
      }

      this.logger.log(`Generated ${results.length} thumbnails for ${data.key}`);
      return { thumbnails: results };
    } catch (error: any) {
      this.logger.error(`Failed to generate thumbnails for ${data.key}: ${error.message}`);
      throw error;
    }
  }
}
