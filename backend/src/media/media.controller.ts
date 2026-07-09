import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
];

function fileFilter(req: any, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
  }
}
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { QueuesService } from '../queues/queues.service';

@ApiTags('media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(
    private readonly storageService: StorageService,
    private readonly queuesService: QueuesService,
  ) {}

  @Post('upload')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 uploads per minute
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', default: 'uploads' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    fileFilter,
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    const result = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      folder || 'uploads',
      file.mimetype,
    );

    // Queue image optimization for background processing
    if (file.mimetype?.startsWith('image/')) {
      try {
        await this.queuesService.addImageJob('optimize', {
          key: result.key,
          bucket: result.bucket,
          url: result.url,
          mimeType: file.mimetype,
        });
      } catch { /* optimization failure is non-critical */ }
    }

    return {
      success: true,
      url: result.url,
      key: result.key,
      bucket: result.bucket,
      size: file.size,
    };
  }

  /**
   * JSON-body alternative for existing flows that already produce data URLs
   * (FileReader → base64). Avoids forcing every page to switch to multipart.
   */
  @Post('from-data-url')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 data URL uploads per minute
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        dataUrl: { type: 'string' },
        folder: { type: 'string', default: 'uploads' },
      },
      required: ['dataUrl'],
    },
  })
  async uploadDataUrl(@Body() body: { dataUrl: string; folder?: string }) {
    const result = await this.storageService.uploadDataUrl(body.dataUrl, body.folder || 'uploads');
    // Queue image optimization for background processing
    if (body.dataUrl?.startsWith('data:image/')) {
      try {
        await this.queuesService.addImageJob('optimize', {
          key: result.key,
          bucket: result.bucket,
          url: result.url,
          mimeType: body.dataUrl.match(/^data:([^;,]+)/)?.[1],
        });
      } catch { /* optimization failure is non-critical */ }
    }

    return {
      success: true,
      url: result.url,
      key: result.key,
      bucket: result.bucket,
    };
  }

  @Post('upload-multiple')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 batch uploads per minute
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
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
  })
  @UseInterceptors(FilesInterceptor('files', 10, {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
    fileFilter,
  }))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
  ) {
    const uploads = await Promise.all(
      files.map((file) =>
        this.storageService.uploadFile(
          file.buffer,
          file.originalname,
          folder || 'uploads',
          file.mimetype,
        ),
      ),
    );

    // Queue image optimization for each uploaded image
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
        } catch { /* optimization failure is non-critical */ }
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
}
