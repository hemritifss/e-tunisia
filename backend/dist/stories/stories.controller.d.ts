import { StoriesService } from './stories.service';
declare class CreateStoryDto {
    imageUrl: string;
    caption?: string;
}
declare class ReactStoryDto {
    emoji: string;
}
declare class ReplyStoryDto {
    text: string;
}
export declare class StoriesController {
    private stories;
    constructor(stories: StoriesService);
    list(req: any): Promise<any[]>;
    create(req: any, body: CreateStoryDto): Promise<import("./story.entity").Story>;
    view(req: any, id: string): Promise<{
        ok: boolean;
        counted: boolean;
    }>;
    react(req: any, id: string, body: ReactStoryDto): Promise<{
        storyId: string;
        counts: Record<string, number>;
        total: number;
        myReaction: string;
    }>;
    unreact(req: any, id: string): Promise<{
        storyId: string;
        counts: Record<string, number>;
        total: number;
        myReaction: string;
    }>;
    reply(req: any, id: string, body: ReplyStoryDto): Promise<{
        ok: boolean;
        roomId: string;
        messageId: string;
    }>;
    viewers(req: any, id: string): Promise<{
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
    highlights(handle: string): Promise<{
        id: string;
        imageUrl: string;
        caption: string;
        createdAt: Date;
    }[]>;
    highlight(req: any, id: string): Promise<{
        ok: boolean;
        isHighlight: boolean;
    }>;
    remove(req: any, id: string): Promise<{
        deleted: boolean;
    }>;
}
export {};
