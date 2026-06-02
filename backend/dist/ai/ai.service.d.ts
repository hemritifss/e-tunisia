import { PlacesService } from '../places/places.service';
import { SearchService } from '../search/search.service';
import { BillingService } from '../billing/billing.service';
import { RedisService } from '../redis/redis.service';
import { UserPlan } from '../users/user.entity';
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
    }): Promise<{
        plan: UserPlan;
        premium: boolean;
    }>;
    generateItinerary(preferences: {
        duration: number;
        budget: number;
        travelers: number;
        interests: string[];
        startLocation?: string;
        travelStyle?: string;
    }, premium?: boolean): Promise<AIItinerary>;
    chatTravelPlanner(messages: ChatMessage[], premium?: boolean): Promise<{
        reply: string;
        suggestions?: string[];
        places?: GroundedPlace[];
    }>;
    assist(input: {
        text: string;
        action: AssistAction | string;
        targetLang?: string;
        tone?: string;
    }, premium?: boolean): Promise<{
        text: string;
        mock?: boolean;
    }>;
    generateCaption(input: {
        topic?: string;
        location?: string;
    }, premium?: boolean): Promise<{
        caption: string;
        mock?: boolean;
    }>;
    surpriseMe(premium?: boolean): Promise<{
        blurb: string;
        places: GroundedPlace[];
        mock?: boolean;
    }>;
    travelPersonality(profile: {
        interests?: string[];
        visitedCount?: number;
    }, premium?: boolean): Promise<{
        type: string;
        emoji: string;
        description: string;
        traits: string[];
        mock?: boolean;
    }>;
    private mockPersonality;
    greeting(userId: string, name?: string): Promise<{
        text: string;
        cached?: boolean;
    }>;
    private templatedGreeting;
    smartSearch(query: string, premium?: boolean): Promise<{
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
    }, premium?: boolean): Promise<Array<{
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
