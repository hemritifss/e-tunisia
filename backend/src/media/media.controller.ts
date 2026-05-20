import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@ApiTags('media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
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
  @UseInterceptors(FileInterceptor('file'))
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
    return {
      success: true,
      url: result.url,
      key: result.key,
      bucket: result.bucket,
    };
  }

  @Post('upload-multiple')
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
  @UseInterceptors(FilesInterceptor('files', 10))
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

    return uploads.map((result, index) => ({
      success: true,
      url: result.url,
      key: result.key,
      bucket: result.bucket,
      size: files[index].size,
    }));
  }
}
