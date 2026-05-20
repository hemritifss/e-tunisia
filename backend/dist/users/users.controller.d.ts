import type { Response } from 'express';
import { UsersService } from './users.service';
import { OgService } from '../og/og.service';
export declare class UsersController {
    private usersService;
    private ogService;
    constructor(usersService: UsersService, ogService: OgService);
    getProfile(req: any): Promise<import("./user.entity").User>;
    handleAvailable(h: string): Promise<{
        available: boolean;
        reason?: string;
    }>;
    byHandle(rawHandle: string): Promise<any>;
    ogImage(rawHandle: string, res: Response): Promise<void>;
    seedDraft(req: any, body: {
        visitedCities?: string[];
        interests?: string[];
    }): Promise<{
        ok: boolean;
        visitedPlaceIds: number;
        interests: number;
    }>;
    updateProfile(req: any, body: Partial<any>): Promise<import("./user.entity").User>;
    toggleFavorite(req: any, placeId: string): Promise<string[]>;
    getFavorites(req: any): Promise<string[]>;
    toggleVisited(req: any, placeId: string): Promise<string[]>;
    getVisited(req: any): Promise<string[]>;
    findPublicById(id: string): Promise<{
        id: any;
        fullName: any;
        avatar: any;
        country: any;
        bio: any;
        website: any;
        role: any;
        points: any;
        level: any;
        badges: any;
        createdAt: any;
    }>;
    suggest(limit?: string): Promise<any[]>;
}
