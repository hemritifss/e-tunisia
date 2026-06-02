import { AIService } from './ai.service';
export declare class AIController {
    private readonly aiService;
    constructor(aiService: AIService);
    generateItinerary(userId: string | null, req: any, preferences: {
        duration: number;
        budget: number;
        travelers: number;
        interests: string[];
        startLocation?: string;
        travelStyle?: string;
    }): Promise<import("./ai.service").AIItinerary>;
    chatPlanner(userId: string | null, req: any, { messages }: {
        messages: Array<{
            role: 'user' | 'assistant';
            content: string;
        }>;
    }): Promise<{
        reply: string;
        suggestions?: string[];
        places?: import("./ai.service").GroundedPlace[];
    }>;
    assist(userId: string | null, req: any, body: {
        text: string;
        action: string;
        targetLang?: string;
        tone?: string;
    }): Promise<{
        text: string;
        mock?: boolean;
    }>;
    smartSearch(userId: string | null, req: any, body: {
        query: string;
    }): Promise<{
        places: any[];
        posts: any[];
        users: any[];
        interpreted: {
            summary?: string;
            city?: string;
            category?: string;
            minRating?: number;
            keywords?: string;
        } | null;
        mock?: boolean;
    }>;
    autoTag(userId: string | null, req: any, body: {
        title?: string;
        body?: string;
    }): Promise<{
        category?: string;
        tags: string[];
        location?: string;
    }>;
    caption(userId: string | null, req: any, body: {
        topic?: string;
        location?: string;
    }): Promise<{
        caption: string;
        mock?: boolean;
    }>;
    surprise(userId: string | null, req: any): Promise<{
        blurb: string;
        places: import("./ai.service").GroundedPlace[];
        mock?: boolean;
    }>;
    personality(user: any, req: any): Promise<{
        type: string;
        emoji: string;
        description: string;
        traits: string[];
        mock?: boolean;
    }>;
    greeting(user: any): Promise<{
        text: string;
        cached?: boolean;
    }>;
    getSuggestions(user: any, req: any, interests?: string): Promise<{
        placeId: string;
        reason: string;
        score: number;
        place: any;
    }[]>;
}
