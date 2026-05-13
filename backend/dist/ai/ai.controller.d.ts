import { AIService } from './ai.service';
export declare class AIController {
    private readonly aiService;
    constructor(aiService: AIService);
    generateItinerary(userId: string, preferences: {
        duration: number;
        budget: number;
        travelers: number;
        interests: string[];
        startLocation?: string;
        travelStyle?: string;
    }): Promise<import("./ai.service").AIItinerary>;
    chatPlanner({ messages }: {
        messages: Array<{
            role: 'user' | 'assistant';
            content: string;
        }>;
    }): Promise<{
        reply: string;
        suggestions?: string[];
    }>;
    getSuggestions(user: any, interests?: string): Promise<{
        placeId: string;
        reason: string;
        score: number;
    }[]>;
}
