import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Block } from './block.entity';
import { Report, ReportReason, ReportStatus, ReportTargetType } from './report.entity';
import { User } from '../users/user.entity';

@Injectable()
export class SafetyService {
    constructor(
        @InjectRepository(Block) private blocks: Repository<Block>,
        @InjectRepository(Report) private reports: Repository<Report>,
        @InjectRepository(User) private users: Repository<User>,
    ) {}

    // ───── Blocks ─────
    async block(blockerId: string, blockedId: string) {
        if (blockerId === blockedId) throw new BadRequestException('Cannot block yourself');
        const target = await this.users.findOne({ where: { id: blockedId } });
        if (!target) throw new NotFoundException('User not found');
        try {
            return await this.blocks.save(this.blocks.create({ blockerId, blockedId }));
        } catch (e: any) {
            // already-blocked unique constraint conflict → treat as success
            if (e?.code === '23505') {
                return this.blocks.findOne({ where: { blockerId, blockedId } });
            }
            throw e;
        }
    }

    async unblock(blockerId: string, blockedId: string) {
        await this.blocks.delete({ blockerId, blockedId });
        return { ok: true };
    }

    async isBlocked(blockerId: string, blockedId: string) {
        const found = await this.blocks.findOne({ where: { blockerId, blockedId } });
        return { isBlocked: !!found };
    }

    async listBlocked(blockerId: string) {
        const rows = await this.blocks.find({
            where: { blockerId },
            order: { createdAt: 'DESC' },
        });
        if (rows.length === 0) return [];
        const ids = rows.map(r => r.blockedId);
        const users = await this.users.find({ where: { id: In(ids) } });
        const byId = new Map(users.map(u => [u.id, u]));
        return rows.map(b => {
            const u = byId.get(b.blockedId);
            return {
                id: b.id,
                blockedAt: b.createdAt,
                user: u ? {
                    id: u.id,
                    fullName: u.fullName,
                    avatar: u.avatar || null,
                    country: u.country || null,
                } : { id: b.blockedId, fullName: 'Unknown user', avatar: null, country: null },
            };
        });
    }

    /**
     * Return the set of user-ids hidden for this viewer
     * (both: people you block + people who block you).
     */
    async getHiddenUserIds(viewerId: string): Promise<Set<string>> {
        if (!viewerId) return new Set();
        const [iBlock, blocksMe] = await Promise.all([
            this.blocks.find({ where: { blockerId: viewerId }, select: { blockedId: true } }),
            this.blocks.find({ where: { blockedId: viewerId }, select: { blockerId: true } }),
        ]);
        const s = new Set<string>();
        for (const b of iBlock) s.add((b as any).blockedId);
        for (const b of blocksMe) s.add((b as any).blockerId);
        return s;
    }

    // ───── Reports ─────
    async report(reporterId: string, body: {
        targetType: ReportTargetType;
        targetId: string;
        reason: ReportReason;
        details?: string;
        targetOwnerId?: string;
    }) {
        if (!body.targetType || !body.targetId) {
            throw new BadRequestException('targetType and targetId required');
        }
        return this.reports.save(this.reports.create({
            reporterId,
            targetType: body.targetType,
            targetId: body.targetId,
            reason: body.reason || ReportReason.OTHER,
            details: body.details?.slice(0, 600),
            targetOwnerId: body.targetOwnerId || null,
            status: ReportStatus.OPEN,
        }));
    }

    async listMyReports(reporterId: string) {
        return this.reports.find({
            where: { reporterId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }
}
