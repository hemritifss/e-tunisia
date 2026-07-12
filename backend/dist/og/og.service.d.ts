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
}
