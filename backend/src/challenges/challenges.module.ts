import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';
import { Challenge } from './challenge.entity';
import { UserChallenge } from './user-challenge.entity';
import { UserStreak } from './streak.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Challenge, UserChallenge, UserStreak, User])],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
