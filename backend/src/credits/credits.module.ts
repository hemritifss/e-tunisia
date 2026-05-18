import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditBalance } from './credit-balance.entity';
import { CreditTransaction } from './credit-transaction.entity';
import { Donation } from './donation.entity';
import { User } from '../users/user.entity';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([CreditBalance, CreditTransaction, Donation, User]),
        NotificationsModule,
    ],
    controllers: [CreditsController],
    providers: [CreditsService],
    exports: [CreditsService],
})
export class CreditsModule {}
