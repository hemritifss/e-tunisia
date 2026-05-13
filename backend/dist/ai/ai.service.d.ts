import { ConfigService } from '@nestjs/config';
import { PlacesService } from '../places/places.service';
export interface ItineraryDay {
    day: number;
    title: string;
    description: string;
    places: Array<{
        id: string;
        name: string;
        description: string;
        duration: string;
        price?: number;
        image?: string;
    }>;
    meals: string[];
    transport: string;
    estimatedCost: number;
}
export interface AIItinerary {
    title: string;
    description: string;
    duration: number;
    totalEstimatedCost: number;
    currency: string;
    tags: string[];
    days: ItineraryDay[];
    tips: string[];
    bestFor: string[];
}
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}
export declare class AIService {
    private configService;
    private placesService;
    private readonly logger;
    private openai;
    constructor(configService: ConfigService, placesService: PlacesService);
    generateItinerary(preferences: {
        duration: number;
        budget: number;
        travelers: number;
        interests: string[];
        startLocation?: string;
        travelStyle?: string;
    }): Promise<AIItinerary>;
    chatTravelPlanner(messages: ChatMessage[]): Promise<{
        reply: string;
        suggestions?: string[];
    }>;
    suggestPlaces(userProfile: {
        visitedPlaceIds: string[];
        favoriteIds: string[];
        interests: string[];
    }): Promise<Array<{
        placeId: string;
        reason: string;
        score: number;
    }>>;
    private buildItineraryPrompt;
    private generateMockItinerary;
    private generateMockChatResponse;
    private generateReason;
    private extractSuggestions;
}
