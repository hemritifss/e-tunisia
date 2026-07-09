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
var ChallengesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const challenge_entity_1 = require("./challenge.entity");
const user_challenge_entity_1 = require("./user-challenge.entity");
const streak_entity_1 = require("./streak.entity");
const user_entity_1 = require("../users/user.entity");
const plan_catalog_1 = require("../billing/plan-catalog");
const redis_service_1 = require("../redis/redis.service");
let ChallengesService = ChallengesService_1 = class ChallengesService {
    constructor(challengeRepo, userChallengeRepo, streakRepo, userRepo, redisService) {
        this.challengeRepo = challengeRepo;
        this.userChallengeRepo = userChallengeRepo;
        this.streakRepo = streakRepo;
        this.userRepo = userRepo;
        this.redisService = redisService;
        this.logger = new common_1.Logger(ChallengesService_1.name);
    }
    monthKey(d = new Date()) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    freezesForPlan(plan) {
        if (plan === user_entity_1.UserPlan.BUSINESS)
            return Number(process.env.STREAK_FREEZES_BUSINESS || 3);
        if (plan === user_entity_1.UserPlan.PREMIUM)
            return Number(process.env.STREAK_FREEZES_PREMIUM || 1);
        return 0;
    }
    refillFreezes(streak, plan) {
        const mk = this.monthKey();
        if (streak.freezeMonth !== mk) {
            streak.freezeMonth = mk;
            streak.freezesRemaining = this.freezesForPlan(plan);
        }
    }
    async effectivePlanOf(userId) {
        const u = await this.userRepo.findOne({ where: { id: userId }, select: ['id', 'plan', 'subscriptionExpiresAt'] });
        return u ? (0, plan_catalog_1.effectivePlanFor)(u) : user_entity_1.UserPlan.FREE;
    }
    async generateDailyChallenges() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const existing = await this.challengeRepo.find({
            where: {
                type: challenge_entity_1.ChallengeType.DAILY,
                startDate: today,
            },
        });
        if (existing.length > 0)
            return existing;
        const dailyTemplates = [
            {
                title: 'Hidden Gem Hunter',
                description: 'Visit a place you\'ve never been to before today',
                category: 'explore',
                pointsReward: 50,
                xpReward: 25,
                requirements: { action: 'visit_new_place', targetCount: 1 },
            },
            {
                title: 'Sunrise Chaser',
                description: 'Upload a photo of a sunrise or sunset from any Tunisian location',
                category: 'photo',
                pointsReward: 75,
                xpReward: 30,
                requirements: { action: 'upload_photo', targetCount: 1 },
            },
            {
                title: 'Local Storyteller',
                description: 'Write a review for a place you visited today',
                category: 'review',
                pointsReward: 60,
                xpReward: 20,
                requirements: { action: 'write_review', targetCount: 1 },
            },
            {
                title: 'Social Butterfly',
                description: 'Share a post or tip with the community',
                category: 'social',
                pointsReward: 40,
                xpReward: 15,
                requirements: { action: 'share_post', targetCount: 1 },
            },
            {
                title: 'Governorate Explorer',
                description: 'Visit a place in a different governorate than yesterday',
                category: 'explore',
                pointsReward: 100,
                xpReward: 50,
                requirements: { action: 'visit_new_governorate', targetCount: 1 },
            },
            {
                title: 'Foodie Adventure',
                description: 'Visit a restaurant or food spot and share your experience',
                category: 'explore',
                pointsReward: 55,
                xpReward: 20,
                requirements: { action: 'visit_food_place', targetCount: 1 },
            },
        ];
        const selected = this.shuffleArray(dailyTemplates).slice(0, 3);
        const challenges = [];
        for (const template of selected) {
            const challenge = new challenge_entity_1.Challenge();
            challenge.title = template.title;
            challenge.description = template.description;
            challenge.category = template.category;
            challenge.pointsReward = template.pointsReward;
            challenge.xpReward = template.xpReward;
            challenge.requirements = template.requirements;
            challenge.type = challenge_entity_1.ChallengeType.DAILY;
            challenge.startDate = today;
            challenge.endDate = tomorrow;
            challenge.isActive = true;
            challenges.push(challenge);
        }
        return this.challengeRepo.save(challenges);
    }
    async getOrCreateUserChallenges(userId) {
        const dailyChallenges = await this.generateDailyChallenges();
        const userChallenges = [];
        for (const challenge of dailyChallenges) {
            let userChallenge = await this.userChallengeRepo.findOne({
                where: { userId, challengeId: challenge.id },
                relations: ['challenge'],
            });
            if (!userChallenge) {
                userChallenge = new user_challenge_entity_1.UserChallenge();
                userChallenge.userId = userId;
                userChallenge.challengeId = challenge.id;
                userChallenge.status = user_challenge_entity_1.UserChallengeStatus.IN_PROGRESS;
                userChallenge.progress = 0;
                userChallenge.target = challenge.requirements?.targetCount || 1;
                await this.userChallengeRepo.save(userChallenge);
            }
            userChallenges.push(userChallenge);
        }
        return userChallenges;
    }
    async updateChallengeProgress(userId, action, metadata) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const userChallenges = await this.userChallengeRepo
            .createQueryBuilder('uc')
            .innerJoinAndSelect('uc.challenge', 'challenge')
            .where('uc.userId = :userId', { userId })
            .andWhere('uc.status = :status', { status: user_challenge_entity_1.UserChallengeStatus.IN_PROGRESS })
            .andWhere('challenge.startDate <= :today', { today })
            .andWhere('challenge.endDate >= :today', { today })
            .getMany();
        for (const userChallenge of userChallenges) {
            if (userChallenge.challenge?.requirements?.action === action) {
                userChallenge.progress += 1;
                if (userChallenge.progress >= userChallenge.target) {
                    userChallenge.status = user_challenge_entity_1.UserChallengeStatus.COMPLETED;
                    userChallenge.completedAt = new Date();
                }
                await this.userChallengeRepo.save(userChallenge);
            }
        }
    }
    async claimChallengeReward(userId, userChallengeId) {
        const userChallenge = await this.userChallengeRepo.findOne({
            where: { id: userChallengeId, userId },
            relations: ['challenge'],
        });
        if (!userChallenge)
            throw new common_1.NotFoundException('Challenge not found');
        if (userChallenge.status === user_challenge_entity_1.UserChallengeStatus.CLAIMED) {
            throw new Error('Reward already claimed');
        }
        if (userChallenge.status !== user_challenge_entity_1.UserChallengeStatus.COMPLETED) {
            throw new Error('Challenge not completed yet');
        }
        userChallenge.status = user_challenge_entity_1.UserChallengeStatus.CLAIMED;
        userChallenge.claimedAt = new Date();
        await this.userChallengeRepo.save(userChallenge);
        return {
            pointsEarned: userChallenge.challenge?.pointsReward || 0,
            xpEarned: userChallenge.challenge?.xpReward || 0,
            badgeEarned: userChallenge.challenge?.badgeId,
        };
    }
    async getOrCreateStreak(userId) {
        let streak = await this.streakRepo.findOne({ where: { userId } });
        if (!streak) {
            streak = new streak_entity_1.UserStreak();
            streak.userId = userId;
            streak.currentStreak = 0;
            streak.longestStreak = 0;
            streak.streakHistory = [];
            await this.streakRepo.save(streak);
        }
        return streak;
    }
    async recordActivity(userId, action) {
        const streak = await this.getOrCreateStreak(userId);
        const plan = await this.effectivePlanOf(userId);
        this.refillFreezes(streak, plan);
        streak.__freezeUsed = false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastActive = streak.lastActiveDate
            ? new Date(streak.lastActiveDate)
            : null;
        if (lastActive) {
            lastActive.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 0) {
                streak.streakHistory = [
                    ...(streak.streakHistory || []),
                    {
                        date: today.toISOString().split('T')[0],
                        action,
                        pointsEarned: 10,
                    },
                ];
            }
            else if (diffDays === 1) {
                streak.currentStreak += 1;
                streak.longestStreak = Math.max(streak.currentStreak, streak.longestStreak);
                streak.totalDaysActive += 1;
                streak.lastActiveDate = today;
                streak.streakHistory = [
                    ...(streak.streakHistory || []),
                    {
                        date: today.toISOString().split('T')[0],
                        action,
                        pointsEarned: 10 + streak.currentStreak * 2,
                    },
                ];
            }
            else {
                if (diffDays === 2 && streak.freezesRemaining > 0) {
                    streak.freezesRemaining -= 1;
                    streak.__freezeUsed = true;
                    streak.currentStreak += 1;
                    streak.longestStreak = Math.max(streak.currentStreak, streak.longestStreak);
                    streak.totalDaysActive += 1;
                    streak.lastActiveDate = today;
                    streak.streakHistory = [
                        ...(streak.streakHistory || []),
                        {
                            date: today.toISOString().split('T')[0],
                            action: `${action} (freeze used)`,
                            pointsEarned: 10 + streak.currentStreak * 2,
                        },
                    ];
                }
                else {
                    streak.currentStreak = 1;
                    streak.totalDaysActive += 1;
                    streak.lastActiveDate = today;
                    streak.streakHistory = [
                        ...(streak.streakHistory || []),
                        {
                            date: today.toISOString().split('T')[0],
                            action,
                            pointsEarned: 10,
                        },
                    ];
                }
            }
        }
        else {
            streak.currentStreak = 1;
            streak.longestStreak = 1;
            streak.totalDaysActive = 1;
            streak.lastActiveDate = today;
            streak.streakHistory = [
                {
                    date: today.toISOString().split('T')[0],
                    action,
                    pointsEarned: 10,
                },
            ];
        }
        return this.streakRepo.save(streak);
    }
    async checkIn(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existing = await this.getOrCreateStreak(userId);
        if (existing.lastCheckInDate) {
            const last = new Date(existing.lastCheckInDate);
            last.setHours(0, 0, 0, 0);
            if (last.getTime() === today.getTime()) {
                return { alreadyCheckedIn: true, pointsEarned: 0, multiplier: 1, freezeUsed: false, streak: existing };
            }
        }
        const streak = await this.recordActivity(userId, 'daily-check-in');
        const freezeUsed = !!streak.__freezeUsed;
        const multiplier = streak.currentStreak >= 7 ? 2 : 1;
        const pointsEarned = 10 * multiplier;
        streak.lastCheckInDate = today;
        await this.streakRepo.save(streak);
        await this.userRepo.increment({ id: userId }, 'points', pointsEarned);
        return { alreadyCheckedIn: false, pointsEarned, multiplier, freezeUsed, streak };
    }
    async getLeaderboard(period = 'weekly', limit = 50) {
        const cacheKey = `leaderboard:${period}`;
        const cached = await this.redisService.getJson(cacheKey);
        if (cached)
            return cached;
        const leaderboard = Array.from({ length: limit }).map((_, i) => ({
            userId: `user-${i}`,
            fullName: [
                'Yasmine Khelil', 'Marco Rossi', 'Sarah Chen', 'David Park',
                'Amina Trabelsi', 'Emma Laurent', 'Omar Ben Ali', 'Lisa Müller',
                'Karim Hadj', 'Nadia Ferchichi',
            ][i % 10],
            avatar: `https://api.dicebear.com/9.x/thumbs/svg?seed=${i}`,
            points: Math.floor(5000 - i * 80 + Math.random() * 100),
            streak: Math.floor(Math.random() * 30) + 1,
        }));
        await this.redisService.setJson(cacheKey, leaderboard, 300);
        return leaderboard;
    }
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
};
exports.ChallengesService = ChallengesService;
exports.ChallengesService = ChallengesService = ChallengesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(challenge_entity_1.Challenge)),
    __param(1, (0, typeorm_1.InjectRepository)(user_challenge_entity_1.UserChallenge)),
    __param(2, (0, typeorm_1.InjectRepository)(streak_entity_1.UserStreak)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        redis_service_1.RedisService])
], ChallengesService);
//# sourceMappingURL=challenges.service.js.map