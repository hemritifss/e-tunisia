import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Story } from './story.entity';
import { StoryReaction } from './story-reaction.entity';
import { StoryView } from './story-view.entity';
import { User } from '../users/user.entity';
import { StoriesService } from './stories.service';
import { StoriesController } from './stories.controller';
import { MessagesModule } from '../messages/messages.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Story, StoryReaction, StoryView, User]),
        // Story replies are delivered as DMs.
        forwardRef(() => MessagesModule),
    ],
    providers: [StoriesService],
    controllers: [StoriesController],
    exports: [StoriesService],
})
export class StoriesModule {}
