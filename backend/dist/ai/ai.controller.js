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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const optional_jwt_auth_guard_1 = require("../auth/guards/optional-jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const ai_service_1 = require("./ai.service");
let AIController = class AIController {
    constructor(aiService) {
        this.aiService = aiService;
    }
    async generateItinerary(userId, req, preferences) {
        const { premium } = await this.aiService.assertQuotaAndCount({ userId, ip: req.ip });
        return this.aiService.generateItinerary(preferences, premium);
    }
    async chatPlanner(userId, req, { messages }) {
        const { premium } = await this.aiService.assertQuotaAndCount({ userId, ip: req.ip });
        return this.aiService.chatTravelPlanner(messages, premium);
    }
    async assist(userId, req, body) {
        const { premium } = await this.aiService.assertQuotaAndCount({ userId, ip: req.ip });
        return this.aiService.assist(body, premium);
    }
    async smartSearch(userId, req, body) {
        const { premium } = await this.aiService.assertQuotaAndCount({ userId, ip: req.ip });
        return this.aiService.smartSearch(body?.query || '', premium);
    }
    async autoTag(userId, req, body) {
        await this.aiService.assertQuotaAndCount({ userId, ip: req.ip });
        return this.aiService.autoTag(body || {});
    }
    async caption(userId, req, body) {
        const { premium } = await this.aiService.assertQuotaAndCount({ userId, ip: req.ip });
        return this.aiService.generateCaption(body || {}, premium);
    }
    async surprise(userId, req) {
        const { premium } = await this.aiService.assertQuotaAndCount({ userId, ip: req.ip });
        return this.aiService.surpriseMe(premium);
    }
    async personality(user, req) {
        const { premium } = await this.aiService.assertQuotaAndCount({ userId: user.id, ip: req.ip });
        return this.aiService.travelPersonality({ interests: user.interests || [], visitedCount: (user.visitedPlaceIds || []).length }, premium);
    }
    async greeting(user) {
        return this.aiService.greeting(user.id, user.fullName);
    }
    async getSuggestions(user, req, interests) {
        const { premium } = await this.aiService.assertQuotaAndCount({ userId: user.id, ip: req.ip });
        return this.aiService.suggestPlaces({
            visitedPlaceIds: user.visitedPlaceIds || [],
            favoriteIds: user.favoriteIds || [],
            interests: interests ? interests.split(',') : ['culture', 'food', 'nature'],
        }, premium);
    }
};
exports.AIController = AIController;
__decorate([
    (0, common_1.Post)('itinerary'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Generate AI-powered itinerary' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "generateItinerary", null);
__decorate([
    (0, common_1.Post)('chat'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Chat with the grounded AI travel concierge' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "chatPlanner", null);
__decorate([
    (0, common_1.Post)('assist'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'AI compose assist — improve / translate / shorten / expand text' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "assist", null);
__decorate([
    (0, common_1.Post)('search'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Natural-language search — parses the query into place filters' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "smartSearch", null);
__decorate([
    (0, common_1.Post)('autotag'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Suggest a category, tags and location for a post' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "autoTag", null);
__decorate([
    (0, common_1.Post)('caption'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a reel caption + hashtags' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "caption", null);
__decorate([
    (0, common_1.Post)('surprise'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'One-tap spontaneous day plan' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "surprise", null);
__decorate([
    (0, common_1.Get)('personality'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Fun, shareable travel personality' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "personality", null);
__decorate([
    (0, common_1.Get)('greeting'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Short personalized home greeting (cached daily)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "greeting", null);
__decorate([
    (0, common_1.Get)('suggestions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get personalized place suggestions' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('interests')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "getSuggestions", null);
exports.AIController = AIController = __decorate([
    (0, swagger_1.ApiTags)('ai'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_service_1.AIService])
], AIController);
//# sourceMappingURL=ai.controller.js.map