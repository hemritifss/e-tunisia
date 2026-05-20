import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { CommentLike } from './comment-like.entity';
import { PostReaction } from './post-reaction.entity';
import { SavedPost } from './saved-post.entity';
import { User } from '../users/user.entity';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [TypeOrmModule.forFeature([Post, Comment, CommentLike, PostReaction, SavedPost, User]), NotificationsModule],
    controllers: [PostsController],
    providers: [PostsService],
    exports: [PostsService],
})
export class PostsModule {}
