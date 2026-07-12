import { BeachesService } from './beaches.service';
declare class BeachReportDto {
    jellyfish: 'none' | 'few' | 'lots';
    water?: 'clear' | 'seaweed' | 'murky';
    crowd?: 'empty' | 'ok' | 'packed';
    note?: string;
}
export declare class BeachesController {
    private readonly beaches;
    constructor(beaches: BeachesService);
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
    report(req: any, placeId: string, dto: BeachReportDto): Promise<{
        id: string;
        awarded: boolean;
    }>;
}
export {};
