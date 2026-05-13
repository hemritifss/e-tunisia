import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Follow } from './follow.entity';
import { Activity, ActivityType } from './activity.entity';
import { User } from '../users/user.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(Follow)
    private followRepo: Repository<Follow>,
    @InjectRepository(Activity)
    private activityRepo: Repository<Activity>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private redisService: RedisService,
  ) {}

  // ---- Follow System ----
  async follow(followerId: string, followingId: string): Promise<Follow> {
    if (followerId === followingId) {
      throw new ConflictException('Cannot follow yourself');
    }

    const exists = await this.followRepo.findOne({
      where: { followerId, followingId },
    });

    if (exists) {
      throw new ConflictException('Already following this user');
    }

    const follow = this.followRepo.create({ followerId, followingId });
    const saved = await this.followRepo.save(follow);

    // Create activity
    await this.createActivity(followerId, ActivityType.FOLLOWED_USER, {
      targetUserId: followingId,
    });

    // Update follower/following counts in Redis
    await this.redisService.increment(`user:${followingId}:followers`);
    await this.redisService.increment(`user:${followerId}:following`);

    return saved;
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    const follow = await this.followRepo.findOne({
      where: { followerId, followingId },
    });

    if (!follow) throw new NotFoundException('Not following this user');

    await this.followRepo.remove(follow);

    await this.redisService.del(`user:${followingId}:followers`);
    await this.redisService.del(`user:${followerId}:following`);
  }

  async getFollowers(userId: string): Promise<User[]> {
    const follows = await this.followRepo.find({
      where: { followingId: userId },
    });

    const followerIds = follows.map((f) => f.followerId);
    if (followerIds.length === 0) return [];

    return this.userRepo.find({
      where: { id: In(followerIds) },
      select: ['id', 'fullName', 'avatar', 'points'],
    });
  }

  async getFollowing(userId: string): Promise<User[]> {
    const follows = await this.followRepo.find({
      where: { followerId: userId },
    });

    const followingIds = follows.map((f) => f.followingId);
    if (followingIds.length === 0) return [];

    return this.userRepo.find({
      where: { id: In(followingIds) },
      select: ['id', 'fullName', 'avatar', 'points'],
    });
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.followRepo.findOne({
      where: { followerId, followingId },
    });
    return !!follow;
  }

  async getFollowCounts(userId: string): Promise<{
    followers: number;
    following: number;
  }> {
    const [followers, following] = await Promise.all([
      this.followRepo.count({ where: { followingId: userId } }),
      this.followRepo.count({ where: { followerId: userId } }),
    ]);

    return { followers, following };
  }

  // ---- Activity Feed ----
  async createActivity(
    userId: string,
    type: ActivityType,
    data: any,
  ): Promise<Activity> {
    const activity = this.activityRepo.create({
      userId,
      type,
      data,
      isPublic: true,
    });

    const saved = await this.activityRepo.save(activity);

    // Cache in Redis for feed
    await this.redisService.setJson(
      `activity:${saved.id}`,
      saved,
      86400,
    );

    return saved;
  }

  async getActivityFeed(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Activity[]; hasMore: boolean }> {
    // Get users that the current user follows
    const follows = await this.followRepo.find({
      where: { followerId: userId },
    });

    const followingIds = follows.map((f) => f.followingId);
    followingIds.push(userId); // Include own activity

    const [activities, total] = await this.activityRepo.findAndCount({
      where: {
        userId: In(followingIds),
        isPublic: true,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: activities,
      hasMore: page * limit < total,
    };
  }

  async getUserActivity(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<Activity[]> {
    return this.activityRepo.find({
      where: { userId, isPublic: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  // ---- Travel Buddy Matching ----
  async findTravelBuddies(
    userId: string,
    preferences: {
      dates?: string;
      interests?: string[];
      location?: string;
    },
  ): Promise<any[]> {
    // Simple matching algorithm - in production use more sophisticated ML
    const currentUser = await this.userRepo.findOne({ where: { id: userId } });
    if (!currentUser) return [];

    // Find users with similar interests (mock logic)
    const potentialBuddies = await this.userRepo.find({
      where: { isActive: true },
      select: ['id', 'fullName', 'avatar', 'country', 'points'],
      take: 20,
    });

    return potentialBuddies
      .filter((u) => u.id !== userId)
      .map((u) => ({
        ...u,
        matchScore: Math.floor(Math.random() * 40) + 60, // 60-100 match score
        commonInterests: ['culture', 'food', 'photography'].slice(
          0,
          Math.floor(Math.random() * 3) + 1,
        ),
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  }
}
