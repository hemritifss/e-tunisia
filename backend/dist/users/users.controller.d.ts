import type { Response } from 'express';
import { UsersService } from './users.service';
import { FollowsService } from './follows.service';
import { EndorsementsService } from './endorsements.service';
import { ActivityService } from './activity.service';
import { OgService } from '../og/og.service';
export declare class UsersController {
    private usersService;
    private followsService;
    private endorsementsService;
    private activityService;
    private ogService;
    constructor(usersService: UsersService, followsService: FollowsService, endorsementsService: EndorsementsService, activityService: ActivityService, ogService: OgService);
    private stripSecrets;
    getProfile(req: any): Promise<import("./user.entity").User>;
    passportAnalytics(req: any): Promise<{
        totalViews: number;
        viewsThisWeek: number;
        uniqueViewers: number;
        recentViewers: {
            handle: string;
            fullName: string;
            avatar: string;
            plan: "free" | "premium" | "business";
            role: import("./user.entity").UserRole;
            viewedAt: Date;
        }[];
        topCountries: {
            country: any;
            count: number;
        }[];
    }>;
    searchUsers(q: string, limit?: string): Promise<{
        id: any;
        handle: any;
        fullName: any;
        avatar: any;
        country: any;
        bio: any;
        points: any;
        role: any;
        plan: "free" | "premium" | "business";
        followersCount: any;
    }[]>;
    handleAvailable(h: string): Promise<{
        available: boolean;
        reason?: string;
    }>;
    byHandle(req: any, rawHandle: string): Promise<any>;
    endorsementTopics(): import("./endorsement-topics").EndorsementTopic[];
    leaderboardCities(limit?: string): Promise<{
        city: string;
        reviews: number;
    }[]>;
    leaderboardByCity(city: string, limit?: string): Promise<{
        rank: number;
        reviews: number;
        user: {
            id: any;
            handle: any;
            fullName: any;
            avatar: any;
            country: any;
            points: any;
            role: any;
            plan: "free" | "premium" | "business";
        };
    }[]>;
    endorse(req: any, handle: string, body: {
        topic: string;
    }): Promise<{
        endorsed: boolean;
        count: number;
    }>;
    unendorse(req: any, handle: string, body: {
        topic: string;
    }): Promise<{
        endorsed: boolean;
        count: number;
    }>;
    listEndorsements(handle: string): Promise<import("./endorsements.service").EndorsementGroup[]>;
    follow(req: any, handle: string): Promise<{
        following: boolean;
        followersCount: number;
    }>;
    unfollow(req: any, handle: string): Promise<{
        following: boolean;
        followersCount: number;
    }>;
    listFollowers(handle: string, limit?: string): Promise<{
        id: any;
        handle: any;
        fullName: any;
        avatar: any;
        country: any;
    }[]>;
    listFollowing(handle: string, limit?: string): Promise<{
        id: any;
        handle: any;
        fullName: any;
        avatar: any;
        country: any;
    }[]>;
    ogImage(rawHandle: string, res: Response): Promise<void>;
    seedDraft(req: any, body: {
        visitedCities?: string[];
        interests?: string[];
    }): Promise<{
        ok: boolean;
        visitedPlaceIds: number;
        interests: number;
    }>;
    applyLocalGuide(req: any): Promise<{
        ok: boolean;
        role: import("./user.entity").UserRole.CREATOR | import("./user.entity").UserRole.ADMIN;
        alreadyGuide: boolean;
        reason?: undefined;
        progress?: undefined;
    } | {
        ok: boolean;
        role: import("./user.entity").UserRole.USER | import("./user.entity").UserRole.SUPERADMIN;
        reason: string;
        progress: {
            points: number;
            pointsRequired: number;
            reviewsCount: number;
            reviewsRequired: number;
            tripsCount: number;
            tripsRequired: number;
        };
        alreadyGuide?: undefined;
    } | {
        ok: boolean;
        role: string;
        alreadyGuide?: undefined;
        reason?: undefined;
        progress?: undefined;
    }>;
    activityFeed(req: any, limit?: string): Promise<import("./activity.service").ActivityEntry[]>;
    globalActivityFeed(limit?: string): Promise<import("./activity.service").ActivityEntry[]>;
    activeTravelers(limit?: string): Promise<{
        userId: any;
        fullName: any;
        handle: any;
        avatar: any;
        placeId: any;
        placeName: any;
        city: any;
        lat: number;
        lng: number;
    }[]>;
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
