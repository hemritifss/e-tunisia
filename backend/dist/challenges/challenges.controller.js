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
exports.ChallengesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const challenges_service_1 = require("./challenges.service");
let ChallengesController = class ChallengesController {
    constructor(challengesService) {
        this.challengesService = challengesService;
    }
    async getDailyChallenges(userId) {
        const challenges = await this.challengesService.generateDailyChallenges();
        const userChallenges = await this.challengesService.getOrCreateUserChallenges(userId);
        return challenges.map((challenge) => {
            const userChallenge = userChallenges.find((uc) => uc.challengeId === challenge.id);
            return {
                ...challenge,
                userProgress: userChallenge
                    ? {
                        status: userChallenge.status,
                        progress: userChallenge.progress,
                        target: userChallenge.target,
                        completedAt: userChallenge.completedAt,
                    }
                    : null,
            };
        });
    }
    async getMyChallenges(userId) {
        return this.challengesService.getOrCreateUserChallenges(userId);
    }
    async claimReward(userId, userChallengeId) {
        return this.challengesService.claimChallengeReward(userId, userChallengeId);
    }
    async getStreak(userId) {
        return this.challengesService.getOrCreateStreak(userId);
    }
    async recordActivity(userId, action) {
        return this.challengesService.recordActivity(userId, action);
    }
    async getLeaderboard(period = 'weekly', limit = 50) {
        return this.challengesService.getLeaderboard(period, limit);
    }
};
exports.ChallengesController = ChallengesController;
__decorate([
    (0, common_1.Get)('daily'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get today\'s daily challenges with user progress' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChallengesController.prototype, "getDailyChallenges", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get my active challenges' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChallengesController.prototype, "getMyChallenges", null);
__decorate([
    (0, common_1.Post)(':id/claim'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Claim challenge reward' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChallengesController.prototype, "claimReward", null);
__decorate([
    (0, common_1.Get)('streak'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get my streak' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChallengesController.prototype, "getStreak", null);
__decorate([
    (0, common_1.Post)('activity'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Record activity (for streaks)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)('action')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChallengesController.prototype, "recordActivity", null);
__decorate([
    (0, common_1.Get)('leaderboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get challenge leaderboard' }),
    __param(0, (0, common_1.Query)('period')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], ChallengesController.prototype, "getLeaderboard", null);
exports.ChallengesController = ChallengesController = __decorate([
    (0, swagger_1.ApiTags)('challenges'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('challenges'),
    __metadata("design:paramtypes", [challenges_service_1.ChallengesService])
], ChallengesController);
//# sourceMappingURL=challenges.controller.js.map