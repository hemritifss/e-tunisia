import { Repository } from 'typeorm';
import { Story } from './story.entity';
import { StoryReaction } from './story-reaction.entity';
import { StoryView } from './story-view.entity';
import { User } from '../users/user.entity';
import { MessagesService } from '../messages/messages.service';
import { SafetyService } from '../safety/safety.service';
export declare class StoriesService {
    private repo;
    private reactionsRepo;
    private viewsRepo;
    private usersRepo;
    private messages;
    private safety;
    constructor(repo: Repository<Story>, reactionsRepo: Repository<StoryReaction>, viewsRepo: Repository<StoryView>, usersRepo: Repository<User>, messages: MessagesService, safety: SafetyService);
    create(authorId: string, data: {
        imageUrl: string;
        caption?: string;
    }): Promise<Story>;
    listActiveGrouped(viewerId?: string | null): Promise<any[]>;
    recordView(id: string, viewerId?: string | null): Promise<{
        ok: boolean;
        counted: boolean;
    }>;
    react(storyId: string, userId: string, emoji: string): Promise<{
        storyId: string;
        counts: Record<string, number>;
        total: number;
        myReaction: string;
    }>;
    unreact(storyId: string, userId: string): Promise<{
        storyId: string;
        counts: Record<string, number>;
        total: number;
        myReaction: string;
    }>;
    private reactionSummary;
    reply(storyId: string, senderId: string, text: string): Promise<{
        ok: boolean;
        roomId: string;
        messageId: string;
    }>;
    listViewers(storyId: string, requesterId: string): Promise<{
        total: number;
        viewers: {
            id: string;
            fullName: string;
            avatar: string;
            handle: string;
            reaction: string;
            viewedAt: Date;
        }[];
    }>;
    remove(id: string, requesterId: string): Promise<{
        deleted: boolean;
    }>;
    toggleHighlight(id: string, requesterId: string): Promise<{
        ok: boolean;
        isHighlight: boolean;
    }>;
    listHighlights(handle: string): Promise<{
        id: string;
        imageUrl: string;
        caption: string;
        createdAt: Date;
    }[]>;
}
