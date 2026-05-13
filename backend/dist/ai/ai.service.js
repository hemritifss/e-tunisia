"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const places_service_1 = require("../places/places.service");
let AIService = AIService_1 = class AIService {
    constructor(configService, placesService) {
        this.configService = configService;
        this.placesService = placesService;
        this.logger = new common_1.Logger(AIService_1.name);
        this.openai = null;
        const apiKey = this.configService.get('OPENAI_API_KEY');
        if (apiKey) {
            try {
                const OpenAI = require('openai');
                this.openai = new OpenAI({ apiKey });
                this.logger.log('OpenAI initialized');
            }
            catch {
                this.logger.warn('OpenAI package not installed, running in mock mode');
            }
        }
        else {
            this.logger.warn('OPENAI_API_KEY not set, running in mock mode');
        }
    }
    async generateItinerary(preferences) {
        const placesResponse = await this.placesService.findAll({});
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
                        content: 'You are an expert Tunisian travel planner. Create detailed, authentic itineraries featuring hidden gems and local experiences. Return ONLY valid JSON matching the requested format.',
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
        }
        catch (error) {
            this.logger.error('AI itinerary generation failed:', error.message);
            return this.generateMockItinerary(preferences, featuredPlaces);
        }
    }
    async chatTravelPlanner(messages) {
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
                    ...messages.slice(-6),
                ],
                temperature: 0.8,
                max_tokens: 1000,
            });
            const reply = completion.choices[0].message.content;
            return { reply, suggestions: this.extractSuggestions(reply) };
        }
        catch (error) {
            this.logger.error('AI chat failed:', error.message);
            return this.generateMockChatResponse(messages);
        }
    }
    async suggestPlaces(userProfile) {
        const placesResponse2 = await this.placesService.findAll({});
        const allPlaces = placesResponse2.data || [];
        const suggestions = allPlaces
            .filter((p) => !userProfile.visitedPlaceIds.includes(p.id))
            .map((place) => {
            let score = place.rating * 20;
            const matchingTags = place.tags?.filter((tag) => userProfile.interests.some((i) => tag.toLowerCase().includes(i.toLowerCase()))) || [];
            score += matchingTags.length * 15;
            if (place.isFeatured)
                score += 10;
            if (place.isBoosted)
                score += 5;
            if (userProfile.favoriteIds.includes(place.id))
                score -= 30;
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
    buildItineraryPrompt(prefs, places) {
        const placeList = places
            .map((p) => `- ${p.name} (${p.city}): ${p.description?.slice(0, 100)}... Rating: ${p.rating}/5`)
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
    generateMockItinerary(prefs, places) {
        const days = [];
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
                const place = places.find((p) => p.name.toLowerCase().includes(name.toLowerCase()));
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
    generateMockChatResponse(messages) {
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
    generateReason(place, matchingTags) {
        if (matchingTags.length > 0) {
            return `Matches your interest in ${matchingTags[0]}`;
        }
        if (place.rating >= 4.5)
            return 'Top-rated by travelers';
        if (place.isFeatured)
            return 'Editor\'s pick';
        return 'Popular with locals';
    }
    extractSuggestions(reply) {
        const commonQuestions = [
            'How do I get there?',
            'Best time to visit?',
            'How much does it cost?',
            'Where should I stay?',
            'Local tips?',
        ];
        return commonQuestions.slice(0, 3);
    }
};
exports.AIService = AIService;
exports.AIService = AIService = AIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        places_service_1.PlacesService])
], AIService);
//# sourceMappingURL=ai.service.js.map