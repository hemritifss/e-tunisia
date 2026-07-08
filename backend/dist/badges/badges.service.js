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
var BadgesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadgesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const post_entity_1 = require("../posts/post.entity");
const badge_definitions_1 = require("./badge-definitions");
const BADGE_BY_ID = Object.fromEntries(badge_definitions_1.BADGE_DEFINITIONS.map((d) => [d.id, d]));
let BadgesService = BadgesService_1 = class BadgesService {
    constructor(usersRepo, postsRepo) {
        this.usersRepo = usersRepo;
        this.postsRepo = postsRepo;
        this.logger = new common_1.Logger(BadgesService_1.name);
    }
    async awardIfEligible(userId, event, payload = {}) {
        if (!userId)
            return [];
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user)
            return [];
        const current = Array.isArray(user.badges) ? user.badges : [];
        const awarded = [];
        let extraPoints = 0;
        for (const def of badge_definitions_1.BADGE_DEFINITIONS) {
            if (def.eligible(event, payload, current.concat(awarded))) {
                awarded.push(def.id);
                extraPoints += def.points;
            }
        }
        if (awarded.length === 0)
            return [];
        user.badges = current.concat(awarded);
        user.points = (user.points || 0) + extraPoints;
        await this.usersRepo.save(user);
        this.publishAchievementPost(user, awarded, extraPoints).catch((e) => this.logger.warn(`Achievement post failed for ${userId}: ${e?.message}`));
        return awarded;
    }
    async publishAchievementPost(user, badgeIds, points) {
        const defs = badgeIds.map((id) => BADGE_BY_ID[id]).filter(Boolean);
        if (defs.length === 0)
            return;
        const names = defs.map((d) => d.label);
        const title = defs.length === 1
            ? `Earned the “${names[0]}” badge`
            : `Earned ${defs.length} new badges`;
        const body = defs.map((d) => `🏅 ${d.label} — ${d.description}`).join('\n');
        await this.postsRepo.save(this.postsRepo.create({
            kind: 'achievement',
            category: 'achievement',
            title,
            body,
            authorId: user.id,
            meta: {
                type: 'badge',
                points,
                badges: defs.map((d) => ({ id: d.id, label: d.label, description: d.description, points: d.points })),
            },
        }));
    }
};
exports.BadgesService = BadgesService;
exports.BadgesService = BadgesService = BadgesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], BadgesService);
//# sourceMappingURL=badges.service.js.map