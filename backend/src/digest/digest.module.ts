import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { UserStreak } from '../challenges/streak.entity';
import { Place } from '../places/place.entity';
import { EmailModule } from '../email/email.module';
import { PushModule } from '../push/push.module';
import { DigestService } from './digest.service';
import { DigestController } from './digest.controller';
import { WeeklyDigestRunner } from '../scheduled/scheduled-tasks.service';

/**
 * Weekly "Your Tunisia week" digest (email + budgeted push). Registered as the
 * WeeklyDigestRunner so the scheduler fires it, and exposes a self-test endpoint.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, UserStreak, Place]), EmailModule, PushModule],
  controllers: [DigestController],
  providers: [
    DigestService,
    { provide: WeeklyDigestRunner, useExisting: DigestService },
  ],
  exports: [DigestService, WeeklyDigestRunner],
})
export class DigestModule {}
