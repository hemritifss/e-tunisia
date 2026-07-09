import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { FlouciService } from './flouci.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, FlouciService],
  exports: [PaymentsService, FlouciService],
})
export class PaymentsModule {}
