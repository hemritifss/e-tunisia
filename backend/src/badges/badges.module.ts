import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Post } from '../posts/post.entity';
import { BadgesService } from './badges.service';

@Module({
    imports: [TypeOrmModule.forFeature([User, Post])],
    providers: [BadgesService],
    exports: [BadgesService],
})
export class BadgesModule {}
