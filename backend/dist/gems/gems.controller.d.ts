import { GemsService } from './gems.service';
declare class SubmitGemDto {
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    images?: string[];
    city?: string;
    governorate?: string;
    categoryId?: string;
}
export declare class GemsController {
    private readonly gems;
    constructor(gems: GemsService);
    submit(req: any, dto: SubmitGemDto): Promise<{
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
    confirm(req: any, placeId: string): Promise<{
        confirmations: number;
        wentLive: boolean;
        approved: boolean;
    }>;
    completeness(): Promise<{
        governorate: string;
        count: number;
        target: number;
        pct: number;
        missing: number;
    }[]>;
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
    status(req: any, placeId: string): Promise<{
        confirmations: number;
        confirmedByMe: boolean;
        pending: boolean;
        needed: number;
        isMine: boolean;
    }>;
}
export {};
