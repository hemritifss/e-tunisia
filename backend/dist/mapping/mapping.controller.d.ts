import { MappingService } from './mapping.service';
declare class CreateEventDto {
    slug: string;
    title: string;
    subtitle?: string;
    startsAt: string;
    endsAt: string;
    prizes?: string;
    featured?: boolean;
}
export declare class MappingController {
    private readonly mapping;
    constructor(mapping: MappingService);
    standings(req: any): Promise<{
        event: {
            slug: string;
            title: string;
            subtitle: string;
            startsAt: Date;
            endsAt: Date;
            prizes: string;
        };
        status: import("./mapping.service").EventStatus;
        now: string;
        totals: {
            contributors: number;
            gems: number;
            governorates: number;
            points: number;
        };
        governorates: {
            rank: number;
            governorate: string;
            points: number;
            gems: number;
            contributors: number;
        }[];
        topContributors: {
            handle: any;
            fullName: any;
            avatar: any;
            governorate: string;
            points: number;
            rank: number;
        }[];
        me: {
            points: number;
            rank: number;
            governorate: string | null;
        };
    }>;
    bySlug(slug: string, req: any): Promise<{
        event: {
            slug: string;
            title: string;
            subtitle: string;
            startsAt: Date;
            endsAt: Date;
            prizes: string;
        };
        status: import("./mapping.service").EventStatus;
        now: string;
        totals: {
            contributors: number;
            gems: number;
            governorates: number;
            points: number;
        };
        governorates: {
            rank: number;
            governorate: string;
            points: number;
            gems: number;
            contributors: number;
        }[];
        topContributors: {
            handle: any;
            fullName: any;
            avatar: any;
            governorate: string;
            points: number;
            rank: number;
        }[];
        me: {
            points: number;
            rank: number;
            governorate: string | null;
        };
    }>;
    create(req: any, dto: CreateEventDto): Promise<import("./mapping-event.entity").MappingEvent>;
}
export {};
