import { PlacesService } from '../places/places.service';
import { SearchService } from '../search/search.service';
import { BillingService } from '../billing/billing.service';
import { RedisService } from '../redis/redis.service';
import { LlmService } from './llm.service';
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
export interface GroundedPlace {
    id: string;
    name: string;
    city: string | null;
    category: string | null;
    rating: number | null;
    description: string;
    url: string;
}
export type AssistAction = 'improve' | 'translate' | 'shorten' | 'expand';
export declare class AIService {
    private readonly placesService;
    private readonly searchService;
    private readonly llm;
    private readonly billing;
    private readonly redis;
    private readonly logger;
    constructor(placesService: PlacesService, searchService: SearchService, llm: LlmService, billing: BillingService, redis: RedisService);
    assertQuotaAndCount(identity: {
        userId?: string | null;
        ip?: string;
    }): Promise<void>;
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
        places?: GroundedPlace[];
    }>;
    assist(input: {
        text: string;
        action: AssistAction | string;
        targetLang?: string;
        tone?: string;
    }): Promise<{
        text: string;
        mock?: boolean;
    }>;
    generateCaption(input: {
        topic?: string;
        location?: string;
    }): Promise<{
        caption: string;
        mock?: boolean;
    }>;
    smartSearch(query: string): Promise<{
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
    autoTag(input: {
        title?: string;
        body?: string;
    }): Promise<{
        category?: string;
        tags: string[];
        location?: string;
    }>;
    private heuristicTags;
    suggestPlaces(userProfile: {
        visitedPlaceIds: string[];
        favoriteIds: string[];
        interests: string[];
    }): Promise<Array<{
        placeId: string;
        reason: string;
        score: number;
        place: any;
    }>>;
    private buildItineraryPrompt;
    private generateMockItinerary;
    private generateMockChatResponse;
    private generateReason;
    private extractSuggestions;
}
