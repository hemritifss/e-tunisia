import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { CommentLike } from './comment-like.entity';
import { PostReaction } from './post-reaction.entity';
import { SavedPost } from './saved-post.entity';
import { Repost } from './repost.entity';
import { User } from '../users/user.entity';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { BadgesModule } from '../badges/badges.module';
import { BillingModule } from '../billing/billing.module';

@Module({
    imports: [TypeOrmModule.forFeature([Post, Comment, CommentLike, PostReaction, SavedPost, Repost, User]), NotificationsModule, BadgesModule, BillingModule],
    controllers: [PostsController],
    providers: [PostsService],
    exports: [PostsService],
})
export class PostsModule {}
