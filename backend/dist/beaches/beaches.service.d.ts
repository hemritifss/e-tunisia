import { Repository } from 'typeorm';
import { Place } from '../places/place.entity';
import { User } from '../users/user.entity';
import { BeachReport } from './beach-report.entity';
import { GamificationService } from '../gamification/gamification.service';
export interface BeachReportInput {
    jellyfish: 'none' | 'few' | 'lots';
    water?: 'clear' | 'seaweed' | 'murky';
    crowd?: 'empty' | 'ok' | 'packed';
    note?: string;
}
export declare class BeachesService {
    private readonly places;
    private readonly users;
    private readonly reports;
    private readonly gamification;
    constructor(places: Repository<Place>, users: Repository<User>, reports: Repository<BeachReport>, gamification: GamificationService);
    private fold;
    private isBeach;
    list(governorate?: string): Promise<{
        placeId: string;
        name: string;
        slug: string;
        city: string;
        governorate: string;
        coverImage: string;
        latitude: number;
        longitude: number;
        jellyfish: string;
        water: string;
        crowd: string;
        note: string;
        reportedAt: Date;
        reportsToday: number;
    }[]>;
    beach(placeId: string): Promise<{
        place: {
            id: string;
            name: string;
            slug: string;
            city: string;
            governorate: string;
        };
        current: {
            jellyfish: string;
            water: string;
            crowd: string;
            note: string;
            at: Date;
        };
        reportsToday: number;
        timeline: {
            jellyfish: string;
            water: string;
            crowd: string;
            note: string;
            at: Date;
        }[];
    }>;
    report(userId: string, placeId: string, input: BeachReportInput): Promise<{
        id: string;
        awarded: boolean;
    }>;
}
