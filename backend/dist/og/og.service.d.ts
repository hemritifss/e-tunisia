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
}
