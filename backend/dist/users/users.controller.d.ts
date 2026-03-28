import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<import("./user.entity").User>;
    updateProfile(req: any, body: Partial<any>): Promise<import("./user.entity").User>;
    toggleFavorite(req: any, placeId: string): Promise<string[]>;
    getFavorites(req: any): Promise<string[]>;
    toggleVisited(req: any, placeId: string): Promise<string[]>;
    getVisited(req: any): Promise<string[]>;
}
