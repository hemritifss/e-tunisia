import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openai: any = null;

  constructor(
    private configService: ConfigService,
    private placesService: PlacesService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      try {
        // Dynamic import to avoid dependency issues
        const OpenAI = require('openai');
        this.openai = new OpenAI({ apiKey });
        this.logger.log('OpenAI initialized');
      } catch {
        this.logger.warn('OpenAI package not installed, running in mock mode');
      }
    } else {
      this.logger.warn('OPENAI_API_KEY not set, running in mock mode');
    }
  }

  async generateItinerary(
    preferences: {
      duration: number;
      budget: number;
      travelers: number;
      interests: string[];
      startLocation?: string;
      travelStyle?: string;
    },
  ): Promise<AIItinerary> {
    const placesResponse = await this.placesService.findAll({} as any);
    const places = placesResponse.data || [];
    const featuredPlaces = places.filter((p) => p.isFeatured || p.rating >= 4.0);

    if (!this.openai) {
      return this.generateMockItinerary(preferences, featuredPlaces);
    }

    const prompt = this.buildItineraryPrompt(preferences, featuredPlaces);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert Tunisian travel planner. Create detailed, authentic itineraries featuring hidden gems and local experiences. Return ONLY valid JSON matching the requested format.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const content = completion.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid JSON response');
    } catch (error) {
      this.logger.error('AI itinerary generation failed:', error.message);
      return this.generateMockItinerary(preferences, featuredPlaces);
    }
  }

  async chatTravelPlanner(
    messages: ChatMessage[],
  ): Promise<{ reply: string; suggestions?: string[] }> {
    if (!this.openai) {
      return this.generateMockChatResponse(messages);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are e-Tunisia's AI travel concierge. You know every hidden gem, local restaurant, and secret beach in Tunisia. Be enthusiastic, use local knowledge, and suggest specific places. Keep responses concise (max 3 paragraphs).`,
          },
          ...messages.slice(-6), // Keep last 6 messages for context
        ],
        temperature: 0.8,
        max_tokens: 1000,
      });

      const reply = completion.choices[0].message.content;
      return { reply, suggestions: this.extractSuggestions(reply) };
    } catch (error) {
      this.logger.error('AI chat failed:', error.message);
      return this.generateMockChatResponse(messages);
    }
  }

  async suggestPlaces(
    userProfile: {
      visitedPlaceIds: string[];
      favoriteIds: string[];
      interests: string[];
    },
  ): Promise<Array<{ placeId: string; reason: string; score: number }>> {
    const placesResponse2 = await this.placesService.findAll({} as any);
    const allPlaces = placesResponse2.data || [];

    // Simple recommendation algorithm (collaborative filtering placeholder)
    const suggestions = allPlaces
      .filter((p) => !userProfile.visitedPlaceIds.includes(p.id))
      .map((place) => {
        let score = place.rating * 20; // Base score from rating

        // Boost for matching tags with interests
        const matchingTags =
          place.tags?.filter((tag) =>
            userProfile.interests.some((i) =>
              tag.toLowerCase().includes(i.toLowerCase()),
            ),
          ) || [];
        score += matchingTags.length * 15;

        // Boost for featured places
        if (place.isFeatured) score += 10;
        if (place.isBoosted) score += 5;

        // Penalize if already favorited
        if (userProfile.favoriteIds.includes(place.id)) score -= 30;

        return {
          placeId: place.id,
          reason: this.generateReason(place, matchingTags),
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return suggestions;
  }

  private buildItineraryPrompt(
    prefs: any,
    places: any[],
  ): string {
    const placeList = places
      .map(
        (p) =>
          `- ${p.name} (${p.city}): ${p.description?.slice(0, 100)}... Rating: ${p.rating}/5`,
      )
      .join('\n');

    return `Create a ${prefs.duration}-day Tunisia itinerary for ${prefs.travelers} travelers with a budget of ${prefs.budget} TND.

Interests: ${prefs.interests?.join(', ') || 'culture, food, nature'}
Travel style: ${prefs.travelStyle || 'balanced'}
Start from: ${prefs.startLocation || 'Tunis'}

Available places:\n${placeList}

Return JSON with this exact structure:
{
  "title": "...",
  "description": "...",
  "duration": ${prefs.duration},
  "totalEstimatedCost": number,
  "currency": "TND",
  "tags": ["..."],
  "days": [
    {
      "day": 1,
      "title": "...",
      "description": "...",
      "places": [{"id": "...", "name": "...", "description": "...", "duration": "2 hours", "price": 0}],
      "meals": ["breakfast at...", "lunch at..."],
      "transport": "...",
      "estimatedCost": 0
    }
  ],
  "tips": ["..."],
  "bestFor": ["..."]
}`;
  }

  private generateMockItinerary(
    prefs: any,
    places: any[],
  ): AIItinerary {
    const days: ItineraryDay[] = [];
    const dayPlaces = [
      ['Sidi Bou Said', 'Carthage Ruins'],
      ['Medina of Tunis', 'Bardo Museum'],
      ['Sousse Medina', 'Port El Kantaoui'],
      ['El Jem Amphitheater', 'Sfax Medina'],
      ['Douz Sahara', 'Chott el Djerid'],
      ['Djerba Island', 'Houmt Souk'],
      ['Tozeur Oasis', 'Chebika Mountain'],
      ['Tabarka Beach', 'Kroumerie Mountains'],
    ];

    for (let i = 0; i < prefs.duration; i++) {
      const placeNames = dayPlaces[i % dayPlaces.length];
      const dayPlacesData = placeNames.map((name) => {
        const place = places.find(
          (p) => p.name.toLowerCase().includes(name.toLowerCase()),
        );
        return {
          id: place?.id || `mock-${i}`,
          name: name,
          description: `Explore the beauty of ${name} with local guides.`,
          duration: '2-3 hours',
          price: Math.floor(Math.random() * 50) + 20,
          image: place?.images?.[0],
        };
      });

      days.push({
        day: i + 1,
        title: `Day ${i + 1}: ${placeNames.join(' & ')}`,
        description: `Discover the hidden gems of ${placeNames[0]} and experience authentic Tunisian culture.`,
        places: dayPlacesData,
        meals: [
          'Traditional Tunisian breakfast with bambalouni',
          `Lunch at a local restaurant in ${placeNames[0]}`,
          'Fresh seafood dinner by the coast',
        ],
        transport: i === 0 ? 'Airport pickup + private car' : 'Private car with driver',
        estimatedCost: Math.floor(prefs.budget / prefs.duration),
      });
    }

    return {
      title: `${prefs.duration}-Day Hidden Tunisia Adventure`,
      description: `An unforgettable journey through Tunisia's most authentic experiences, curated for ${prefs.travelers} travelers seeking ${prefs.interests?.join(', ') || 'culture and adventure'}.`,
      duration: prefs.duration,
      totalEstimatedCost: prefs.budget,
      currency: 'TND',
      tags: prefs.interests || ['culture', 'adventure', 'food'],
      days,
      tips: [
        'Best time to visit: March-May or September-November',
        'Carry cash for small vendors and tips',
        'Learn basic Arabic greetings - locals love it!',
        'Try the local dates from Kebili - they\'re the best in the world',
        'Sunscreen is essential even in winter',
      ],
      bestFor: prefs.interests || ['couples', 'families', 'solo travelers'],
    };
  }

  private generateMockChatResponse(
    messages: ChatMessage[],
  ): { reply: string; suggestions: string[] } {
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

    if (lastMessage.includes('beach')) {
      return {
        reply: `Tunisia has incredible beaches! My top hidden gem picks:\n\n🏖️ **Tabarka** - Crystal clear water, fewer tourists than Hammamet\n🏖️ **Raf Raf** - Local secret with amazing cliff views\n🏖️ **Sidi Bou Said beach** - Combine with the blue village visit\n\nFor the best experience, visit weekdays before 11am. The water is warmest in September!`,
        suggestions: ['Best time to visit Tabarka?', 'Hidden beaches near Tunis?', 'Beach restaurants to try?'],
      };
    }

    if (lastMessage.includes('food') || lastMessage.includes('eat')) {
      return {
        reply: `You're in for a treat! Tunisian food is incredible:\n\n🍽️ **Must-try dishes:**\n- Brik (crispy tuna pastry)\n- Couscous with lamb on Fridays\n- Lablabi (chickpea soup) - street food king\n- Tunisian "pizza" -完全不同 from Italian!\n\n🍋 **Hidden spot:** Chez Slah in the Medina for the best brik in Tunis.`,
        suggestions: ['Best restaurants in Tunis?', 'Food tours available?', 'Vegetarian options?'],
      };
    }

    return {
      reply: `I'd love to help plan your Tunisia adventure! 🇹🇳\n\nWhether you're looking for hidden beaches, ancient ruins, Sahara desert experiences, or the best local food - I've got insider knowledge on everything.\n\nWhat kind of traveler are you? Adventure seeker, culture lover, foodie, or beach bum?`,
      suggestions: ['Plan a 5-day trip', 'Best hidden gems?', 'Budget travel tips?', 'Sahara desert tours?'],
    };
  }

  private generateReason(place: any, matchingTags: string[]): string {
    if (matchingTags.length > 0) {
      return `Matches your interest in ${matchingTags[0]}`;
    }
    if (place.rating >= 4.5) return 'Top-rated by travelers';
    if (place.isFeatured) return 'Editor\'s pick';
    return 'Popular with locals';
  }

  private extractSuggestions(reply: string): string[] {
    // Simple extraction - in production use more sophisticated NLP
    const commonQuestions = [
      'How do I get there?',
      'Best time to visit?',
      'How much does it cost?',
      'Where should I stay?',
      'Local tips?',
    ];
    return commonQuestions.slice(0, 3);
  }
}
