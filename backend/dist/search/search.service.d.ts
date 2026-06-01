import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Place } from '../places/place.entity';
import { Post } from '../posts/post.entity';
import { User } from '../users/user.entity';
export declare class SearchService implements OnModuleInit {
    private placesRepo;
    private postsRepo;
    private usersRepo;
    private client;
    private isReady;
    constructor(placesRepo: Repository<Place>, postsRepo: Repository<Post>, usersRepo: Repository<User>);
    onModuleInit(): Promise<void>;
    private ensureIndexes;
    indexPlace(place: Place): Promise<void>;
    indexPost(post: Post): Promise<void>;
    indexUser(user: User): Promise<void>;
    search(query: string, options?: {
        filters?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        places: any;
        posts: any;
        users: any;
        total: any;
    }>;
    private databaseFallbackSearch;
    reindexAll(): Promise<{
        message: string;
        places?: undefined;
        posts?: undefined;
        users?: undefined;
    } | {
        message: string;
        places: number;
        posts: number;
        users: number;
    }>;
}
