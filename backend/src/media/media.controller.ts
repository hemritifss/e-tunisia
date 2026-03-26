import {
    Controller, Post, UseInterceptors,
    UploadedFile, UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

@ApiTags('media')
@Controller('media')
export class MediaController {
    @Post('upload')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file', { storage }))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        return {
            url: `/uploads/${file.filename}`,
            filename: file.filename,
            size: file.size,
        };
    }

    @Post('upload-multiple')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FilesInterceptor('files', 10, { storage }))
    uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
        return files.map((file) => ({
            url: `/uploads/${file.filename}`,
            filename: file.filename,
            size: file.size,
        }));
    }
}