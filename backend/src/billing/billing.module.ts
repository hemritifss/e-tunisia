import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { PaymentsModule } from '../payments/payments.module';

@Module({
    imports: [TypeOrmModule.forFeature([User, Subscription]), PaymentsModule],
    providers: [BillingService],
    controllers: [BillingController],
    exports: [BillingService],
})
export class BillingModule {}
