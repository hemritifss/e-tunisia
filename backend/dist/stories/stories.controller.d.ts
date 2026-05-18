import { StoriesService } from './stories.service';
declare class CreateStoryDto {
    imageUrl: string;
    caption?: string;
}
export declare class StoriesController {
    private stories;
    constructor(stories: StoriesService);
    list(): Promise<any[]>;
    create(req: any, body: CreateStoryDto): Promise<import("./story.entity").Story>;
    view(id: string): Promise<{
        ok: boolean;
    }>;
    remove(req: any, id: string): Promise<{
        deleted: boolean;
    }>;
}
export {};
