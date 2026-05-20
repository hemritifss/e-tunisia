import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './user.entity';
import { Follow } from './follow.entity';
import { UsersService } from './users.service';

@Injectable()
export class FollowsService {
    constructor(
        @InjectRepository(Follow) private followsRepo: Repository<Follow>,
        @InjectRepository(User) private usersRepo: Repository<User>,
        @Inject(forwardRef(() => UsersService)) private users: UsersService,
        private dataSource: DataSource,
    ) {}

    /**
     * Idempotent follow. Returns the resulting state: { following: true, followersCount }.
     * Increments followed.followersCount + follower.followingCount atomically.
     */
    async follow(followerId: string, followedHandle: string) {
        const followed = await this.users.findByHandle(followedHandle);
        if (!followed) throw new NotFoundException('User not found');
        if (followed.id === followerId) {
            throw new BadRequestException("Can't follow yourself");
        }

        const existing = await this.followsRepo.findOne({
            where: { followerId, followedId: followed.id },
        });
        if (existing) {
            return { following: true, followersCount: followed.followersCount };
        }

        await this.dataSource.transaction(async (tx) => {
            await tx.getRepository(Follow).save(
                tx.getRepository(Follow).create({ followerId, followedId: followed.id }),
            );
            await tx.getRepository(User).increment({ id: followed.id }, 'followersCount', 1);
            await tx.getRepository(User).increment({ id: followerId }, 'followingCount', 1);
        });

        await this.users.invalidatePassportCache(followed.id);
        await this.users.invalidatePassportCache(followerId);

        const fresh = await this.usersRepo.findOne({ where: { id: followed.id }, select: ['followersCount'] });
        return { following: true, followersCount: fresh?.followersCount ?? followed.followersCount + 1 };
    }

    /** Idempotent unfollow. Returns { following: false, followersCount }. */
    async unfollow(followerId: string, followedHandle: string) {
        const followed = await this.users.findByHandle(followedHandle);
        if (!followed) throw new NotFoundException('User not found');

        const existing = await this.followsRepo.findOne({
            where: { followerId, followedId: followed.id },
        });
        if (!existing) {
            return { following: false, followersCount: followed.followersCount };
        }

        await this.dataSource.transaction(async (tx) => {
            await tx.getRepository(Follow).delete({ followerId, followedId: followed.id });
            // Guard against drifting below zero in case counters ever go out of sync.
            await tx.getRepository(User)
                .createQueryBuilder()
                .update(User)
                .set({ followersCount: () => 'GREATEST("followersCount" - 1, 0)' })
                .where('id = :id', { id: followed.id })
                .execute()
                .catch(async () => {
                    // SQLite / MySQL fallback (no GREATEST in same dialect-safe form):
                    await tx.getRepository(User).decrement({ id: followed.id }, 'followersCount', 1);
                });
            await tx.getRepository(User)
                .createQueryBuilder()
                .update(User)
                .set({ followingCount: () => 'GREATEST("followingCount" - 1, 0)' })
                .where('id = :id', { id: followerId })
                .execute()
                .catch(async () => {
                    await tx.getRepository(User).decrement({ id: followerId }, 'followingCount', 1);
                });
        });

        await this.users.invalidatePassportCache(followed.id);
        await this.users.invalidatePassportCache(followerId);

        const fresh = await this.usersRepo.findOne({ where: { id: followed.id }, select: ['followersCount'] });
        return { following: false, followersCount: fresh?.followersCount ?? Math.max(0, followed.followersCount - 1) };
    }

    /** Is `viewerId` currently following the user behind `handle`? */
    async isFollowing(viewerId: string | null, handle: string): Promise<boolean> {
        if (!viewerId) return false;
        const followed = await this.users.findByHandle(handle);
        if (!followed || followed.id === viewerId) return false;
        const row = await this.followsRepo.findOne({
            where: { followerId: viewerId, followedId: followed.id },
            select: ['id'],
        });
        return !!row;
    }

    /** Most recent followers of `handle`. Public. */
    async listFollowers(handle: string, limit = 50) {
        const followed = await this.users.findByHandle(handle);
        if (!followed) return [];
        const rows = await this.followsRepo.find({
            where: { followedId: followed.id },
            order: { createdAt: 'DESC' },
            take: Math.min(100, Math.max(1, limit)),
        });
        if (!rows.length) return [];
        const followerIds = rows.map((r) => r.followerId);
        const users = await this.usersRepo.find({
            where: followerIds.map((id) => ({ id })),
            select: ['id', 'handle', 'fullName', 'avatar', 'country'] as any,
        });
        const byId = new Map(users.map((u) => [u.id, u]));
        return rows
            .map((r) => byId.get(r.followerId))
            .filter(Boolean)
            .map((u: any) => ({
                id: u.id,
                handle: u.handle,
                fullName: u.fullName,
                avatar: u.avatar || null,
                country: u.country || null,
            }));
    }

    /** Most recent users that `handle` follows. Public. */
    async listFollowing(handle: string, limit = 50) {
        const follower = await this.users.findByHandle(handle);
        if (!follower) return [];
        const rows = await this.followsRepo.find({
            where: { followerId: follower.id },
            order: { createdAt: 'DESC' },
            take: Math.min(100, Math.max(1, limit)),
        });
        if (!rows.length) return [];
        const ids = rows.map((r) => r.followedId);
        const users = await this.usersRepo.find({
            where: ids.map((id) => ({ id })),
            select: ['id', 'handle', 'fullName', 'avatar', 'country'] as any,
        });
        const byId = new Map(users.map((u) => [u.id, u]));
        return rows
            .map((r) => byId.get(r.followedId))
            .filter(Boolean)
            .map((u: any) => ({
                id: u.id,
                handle: u.handle,
                fullName: u.fullName,
                avatar: u.avatar || null,
                country: u.country || null,
            }));
    }
}
