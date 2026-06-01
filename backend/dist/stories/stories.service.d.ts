import { Repository } from 'typeorm';
import { Story } from './story.entity';
export declare class StoriesService {
    private repo;
    constructor(repo: Repository<Story>);
    create(authorId: string, data: {
        imageUrl: string;
        caption?: string;
    }): Promise<Story>;
    listActiveGrouped(): Promise<any[]>;
    recordView(id: string): Promise<{
        ok: boolean;
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
