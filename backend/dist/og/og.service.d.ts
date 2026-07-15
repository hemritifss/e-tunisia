import { OnModuleInit } from '@nestjs/common';
import { PassportDto } from '../users/dto/passport.dto';
export interface QuizArchetype {
    city: string;
    tagline: string;
    traits: string[];
    gradient: string;
}
export declare const QUIZ_ARCHETYPES: Record<string, QuizArchetype>;
export declare class OgService implements OnModuleInit {
    private readonly logger;
    private regular;
    private bold;
    private fraunces;
    private caveat;
    private kufi;
    onModuleInit(): Promise<void>;
    private loadFont;
    private fetchBinary;
    isReady(): boolean;
    renderPassportCard(p: PassportDto): Promise<Buffer>;
    renderCityQuizCard(a: QuizArchetype): Promise<Buffer>;
    renderWrappedCard(w: {
        fullName: string;
        periodLabel: string;
        personalityLabel: string;
        stats: {
            checkIns: number;
            citiesCount: number;
            governoratesCount: number;
            reviews: number;
        };
    }): Promise<Buffer>;
    renderMappingCard(m: {
        title: string;
        statusLabel: string;
        leaders: Array<{
            governorate: string;
            points: number;
        }>;
        totals: {
            contributors: number;
            gems: number;
        };
    }): Promise<Buffer>;
    private fetchImageDataUri;
    private fetchImage;
    private buildPostcard;
    private rasterize;
    renderPlacePostcard(p: {
        id: string;
        name: string;
        city?: string;
        governorate?: string;
        rating?: number;
        reviewCount?: number;
        imageUrl?: string | null;
    }): Promise<Buffer>;
    renderPostPostcard(p: {
        id: string;
        title?: string;
        body?: string;
        location?: string;
        authorName?: string;
        authorHandle?: string;
        imageUrl?: string | null;
    }): Promise<Buffer>;
    renderTripPostcard(t: {
        slug: string;
        title: string;
        days: number;
        stops: Array<{
            placeCity?: string;
            placeCover?: string;
        }>;
    }): Promise<Buffer>;
}
