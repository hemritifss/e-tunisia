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
exports.SafetyService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const block_entity_1 = require("./block.entity");
const report_entity_1 = require("./report.entity");
const user_entity_1 = require("../users/user.entity");
let SafetyService = class SafetyService {
    constructor(blocks, reports, users) {
        this.blocks = blocks;
        this.reports = reports;
        this.users = users;
    }
    async block(blockerId, blockedId) {
        if (blockerId === blockedId)
            throw new common_1.BadRequestException('Cannot block yourself');
        const target = await this.users.findOne({ where: { id: blockedId } });
        if (!target)
            throw new common_1.NotFoundException('User not found');
        try {
            return await this.blocks.save(this.blocks.create({ blockerId, blockedId }));
        }
        catch (e) {
            if (e?.code === '23505') {
                return this.blocks.findOne({ where: { blockerId, blockedId } });
            }
            throw e;
        }
    }
    async unblock(blockerId, blockedId) {
        await this.blocks.delete({ blockerId, blockedId });
        return { ok: true };
    }
    async isBlocked(blockerId, blockedId) {
        const found = await this.blocks.findOne({ where: { blockerId, blockedId } });
        return { isBlocked: !!found };
    }
    async listBlocked(blockerId) {
        const rows = await this.blocks.find({
            where: { blockerId },
            order: { createdAt: 'DESC' },
        });
        if (rows.length === 0)
            return [];
        const ids = rows.map(r => r.blockedId);
        const users = await this.users.find({ where: { id: (0, typeorm_2.In)(ids) } });
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
    async getHiddenUserIds(viewerId) {
        if (!viewerId)
            return new Set();
        const [iBlock, blocksMe] = await Promise.all([
            this.blocks.find({ where: { blockerId: viewerId }, select: { blockedId: true } }),
            this.blocks.find({ where: { blockedId: viewerId }, select: { blockerId: true } }),
        ]);
        const s = new Set();
        for (const b of iBlock)
            s.add(b.blockedId);
        for (const b of blocksMe)
            s.add(b.blockerId);
        return s;
    }
    async report(reporterId, body) {
        if (!body.targetType || !body.targetId) {
            throw new common_1.BadRequestException('targetType and targetId required');
        }
        return this.reports.save(this.reports.create({
            reporterId,
            targetType: body.targetType,
            targetId: body.targetId,
            reason: body.reason || report_entity_1.ReportReason.OTHER,
            details: body.details?.slice(0, 600),
            targetOwnerId: body.targetOwnerId || null,
            status: report_entity_1.ReportStatus.OPEN,
        }));
    }
    async listMyReports(reporterId) {
        return this.reports.find({
            where: { reporterId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }
};
exports.SafetyService = SafetyService;
exports.SafetyService = SafetyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(block_entity_1.Block)),
    __param(1, (0, typeorm_1.InjectRepository)(report_entity_1.Report)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SafetyService);
//# sourceMappingURL=safety.service.js.map