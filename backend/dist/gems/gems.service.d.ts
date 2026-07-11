import { Repository } from 'typeorm';
import { Place } from '../places/place.entity';
import { Category } from '../categories/category.entity';
import { User } from '../users/user.entity';
import { PlaceConfirmation } from './place-confirmation.entity';
import { LlmService } from '../ai/llm.service';
import { GamificationService } from '../gamification/gamification.service';
import { BadgesService } from '../badges/badges.service';
export interface SubmitGemInput {
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    images?: string[];
    city?: string;
    governorate?: string;
    categoryId?: string;
}
export declare class GemsService {
    private readonly places;
    private readonly categories;
    private readonly users;
    private readonly confirmations;
    private readonly llm;
    private readonly gamification;
    private readonly badges;
    private readonly logger;
    constructor(places: Repository<Place>, categories: Repository<Category>, users: Repository<User>, confirmations: Repository<PlaceConfirmation>, llm: LlmService, gamification: GamificationService, badges: BadgesService);
    private normName;
    private nearestTown;
    private findDuplicate;
    private enrich;
    submit(userId: string, input: SubmitGemInput): Promise<{
        duplicate: true;
        place: {
            id: string;
            name: string;
            slug: string;
            city: string;
            governorate?: undefined;
        };
        needsConfirmations?: undefined;
    } | {
        duplicate: false;
        place: {
            id: string;
            name: string;
            slug: string;
            city: string;
            governorate: string;
        };
        needsConfirmations: number;
    }>;
    confirm(placeId: string, userId: string): Promise<{
        confirmations: number;
        wentLive: boolean;
        approved: boolean;
    }>;
    status(placeId: string, userId?: string): Promise<{
        confirmations: number;
        confirmedByMe: boolean;
        pending: boolean;
        needed: number;
        isMine: boolean;
    }>;
    private foldKey;
    ambassadors(): Promise<{
        month: string;
        ambassadors: {
            governorate: string;
            gems: number;
            user: any;
        }[];
        topHunters: {
            gems: number;
            user: {
                id: string;
                handle: any;
                fullName: string;
                avatar: any;
            };
        }[];
    }>;
    completeness(): Promise<{
        governorate: string;
        count: number;
        target: number;
        pct: number;
        missing: number;
    }[]>;
}
