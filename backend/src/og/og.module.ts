import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OgService } from './og.service';
import { OgController } from './og.controller';
import { User } from '../users/user.entity';
import { Place } from '../places/place.entity';
import { Post } from '../posts/post.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Place, Post])],
    controllers: [OgController],
    providers: [OgService],
    exports: [OgService],
})
export class OgModule {}
