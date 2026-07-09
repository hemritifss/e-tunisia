import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { StorageModule } from '../storage/storage.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [StorageModule, QueuesModule],
  controllers: [MediaController],
})
export class MediaModule {}
