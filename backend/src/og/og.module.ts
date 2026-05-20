import { Module } from '@nestjs/common';
import { OgService } from './og.service';

@Module({
    providers: [OgService],
    exports: [OgService],
})
export class OgModule {}
