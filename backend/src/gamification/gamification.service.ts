import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from './badge.entity';
import { UserBadge } from './user-badge.entity';
import { User } from '../users/user.entity';

@Injectable()
export class GamificationService {
    constructor(
        @InjectRepository(Badge)
        private badgesRepo: Repository<Badge>,
        @InjectRepository(UserBadge)
        private userBadgesRepo: Repository<UserBadge>,
        @InjectRepository(User)
        private usersRepo: Repository<User>,
    ) {}

    async getAllBadges() {
        return this.badgesRepo.find({ order: { sortOrder: 'ASC' } });
    }

    async getUserBadges(userId: string) {
        return this.userBadgesRepo.find({
            where: { userId },
            relations: ['badge'],
            order: { earnedAt: 'DESC' },
        });
    }

    async getUserPoints(userId: string) {
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        return {
            points: user?.points || 0,
            level: this.calculateLevel(user?.points || 0),
            nextLevelPoints: this.nextLevelThreshold(user?.points || 0),
        };
    }

    async addPoints(userId: string, points: number, reason: string) {
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user) return;
        user.points = (user.points || 0) + points;
        await this.usersRepo.save(user);

        // Check if user earned any new badges
        await this.checkBadges(userId);

        return { points: user.points, added: points, reason };
    }

    async getLeaderboard(limit = 20) {
        return this.usersRepo.find({
            select: ['id', 'fullName', 'avatar', 'points'],
            order: { points: 'DESC' },
            take: limit,
        });
    }

    async getUserRank(userId: string) {
        const result = await this.usersRepo
            .createQueryBuilder('u')
            .select('COUNT(*) + 1', 'rank')
            .where('u.points > (SELECT points FROM users WHERE id = :userId)', { userId })
            .getRawOne();
        return { rank: parseInt(result?.rank || '1') };
    }

    private calculateLevel(points: number): number {
        if (points < 100) return 1;
        if (points < 300) return 2;
        if (points < 600) return 3;
        if (points < 1000) return 4;
        if (points < 1500) return 5;
        if (points < 2500) return 6;
        if (points < 4000) return 7;
        if (points < 6000) return 8;
        if (points < 9000) return 9;
        return 10;
    }

    private nextLevelThreshold(points: number): number {
        const thresholds = [100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000, 99999];
        return thresholds.find(t => t > points) || 99999;
    }

    private async checkBadges(userId: string) {
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user) return;

        const allBadges = await this.badgesRepo.find();
        const earnedBadgeIds = (await this.userBadgesRepo.find({ where: { userId } }))
            .map(ub => ub.badgeId);

        for (const badge of allBadges) {
            if (earnedBadgeIds.includes(badge.id)) continue;
            if (badge.pointsRequired > 0 && (user.points || 0) >= badge.pointsRequired) {
                await this.userBadgesRepo.save(this.userBadgesRepo.create({
                    userId,
                    badgeId: badge.id,
                }));
            }
        }
    }

    async seed() {
        const count = await this.badgesRepo.count();
        if (count > 0) return;

        const badges = [
            { name: 'First Steps', description: 'Welcome to e-Tunisia! Create your account.', icon: '👋', category: 'explorer', pointsRequired: 0, requirement: 'Create an account', sortOrder: 1 },
            { name: 'Explorer', description: 'View 5 different places.', icon: '🧭', category: 'explorer', pointsRequired: 50, requirement: 'View 5 places', sortOrder: 2 },
            { name: 'Adventurer', description: 'Visit 10 real places.', icon: '🏔️', category: 'explorer', pointsRequired: 200, requirement: 'Check in at 10 places', sortOrder: 3 },
            { name: 'Tunisia Expert', description: 'Explore all regions of Tunisia.', icon: '🇹🇳', category: 'explorer', pointsRequired: 1000, requirement: 'Visit all 24 governorates', sortOrder: 4 },
            { name: 'Foodie', description: 'Visit 5 gastronomy spots.', icon: '🍽️', category: 'foodie', pointsRequired: 100, requirement: 'Visit 5 food spots', sortOrder: 5 },
            { name: 'Gourmet Master', description: 'Visit 15 restaurants and food spots.', icon: '👨‍🍳', category: 'foodie', pointsRequired: 500, requirement: 'Visit 15 food spots', sortOrder: 6 },
            { name: 'Social Butterfly', description: 'Write 5 reviews.', icon: '💬', category: 'social', pointsRequired: 150, requirement: 'Write 5 reviews', sortOrder: 7 },
            { name: 'Influencer', description: 'Get 50 likes on your tips.', icon: '⭐', category: 'social', pointsRequired: 400, requirement: '50 likes on tips', sortOrder: 8 },
            { name: 'Community Leader', description: 'Share 10 tips with the community.', icon: '🏅', category: 'contributor', pointsRequired: 300, requirement: 'Post 10 tips', sortOrder: 9 },
            { name: 'Event Organizer', description: 'Attend 5 events.', icon: '🎪', category: 'contributor', pointsRequired: 250, requirement: 'Attend 5 events', sortOrder: 10 },
            { name: 'Premium Pioneer', description: 'Subscribe to Premium.', icon: '💎', category: 'premium', pointsRequired: 0, requirement: 'Subscribe to Premium', sortOrder: 11 },
            { name: 'Cartographer', description: 'Use the map to discover 20 places.', icon: '🗺️', category: 'explorer', pointsRequired: 600, requirement: 'Use map 20 times', sortOrder: 12 },
        ];

        for (const b of badges) {
            await this.badgesRepo.save(this.badgesRepo.create(b));
        }
    }
}
