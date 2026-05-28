import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './booking.entity';
import { InventoryItem } from '../inventory/inventory.entity';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, InventoryItem]), QueuesModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
