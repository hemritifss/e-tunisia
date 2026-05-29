import { SearchService } from './search.service';
export declare class SearchController {
    private searchService;
    constructor(searchService: SearchService);
    search(q: string, limit?: string, offset?: string): Promise<{
        places: any;
        posts: any;
        users: any;
        total: any;
    }>;
    reindex(): Promise<{
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
