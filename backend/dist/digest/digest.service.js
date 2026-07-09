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
var DigestService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigestService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const streak_entity_1 = require("../challenges/streak.entity");
const place_entity_1 = require("../places/place.entity");
const email_service_1 = require("../email/email.service");
const push_service_1 = require("../push/push.service");
let DigestService = DigestService_1 = class DigestService {
    constructor(users, streaks, places, email, push) {
        this.users = users;
        this.streaks = streaks;
        this.places = places;
        this.email = email;
        this.push = push;
        this.logger = new common_1.Logger(DigestService_1.name);
    }
    appUrl() {
        return (process.env.FRONTEND_URL || 'https://etunisia.com').replace(/\/+$/, '');
    }
    async buildData(userId) {
        const [reactionRows, followerRows, streak] = await Promise.all([
            this.users.query(`SELECT count(*)::int AS n FROM post_reactions r
           JOIN posts p ON p.id = r."postId"
          WHERE p."authorId" = $1 AND r."createdAt" > now() - interval '7 days'`, [userId]).catch(() => [{ n: 0 }]),
            this.users.query(`SELECT count(*)::int AS n FROM follows
          WHERE "followingId" = $1 AND "createdAt" > now() - interval '7 days'`, [userId]).catch(() => [{ n: 0 }]),
            this.streaks.findOne({ where: { userId } }).catch(() => null),
        ]);
        return {
            reactions: reactionRows?.[0]?.n || 0,
            followers: followerRows?.[0]?.n || 0,
            streak: streak?.currentStreak || 0,
        };
    }
    async weeklyGem() {
        const pool = await this.places.find({
            where: { isActive: true },
            order: { rating: 'DESC' },
            take: 20,
        }).catch(() => []);
        if (!pool.length)
            return null;
        const week = Math.floor(Date.now() / (7 * 86_400_000));
        return pool[week % pool.length];
    }
    renderEmail(user, d, gem) {
        const name = (user.fullName || '').split(' ')[0] || 'there';
        const app = this.appUrl();
        const stat = (n, label) => `<td style="text-align:center;padding:8px 12px;">
         <div style="font-size:26px;font-weight:700;color:#1a1a1a;">${n}</div>
         <div style="font-size:12px;color:#888;">${label}</div>
       </td>`;
        const gemBlock = gem ? `
      <div style="background:#f9fafb;border-radius:10px;padding:16px;margin:16px 0;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#b45c3f;font-weight:700;">Hidden gem of the week</div>
        <div style="font-size:18px;font-weight:700;color:#1a1a1a;margin-top:4px;">${gem.name}</div>
        <div style="font-size:13px;color:#666;">${[gem.city, gem.governorate].filter(Boolean).join(', ')}</div>
        <a href="${app}/place/${gem.id}" style="display:inline-block;margin-top:10px;color:#3d6c9e;text-decoration:none;font-weight:600;">Discover it →</a>
      </div>` : '';
        return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Your Tunisia week</title></head>
<body style="font-family:system-ui,sans-serif;background:#f4f4f4;padding:40px 20px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <h2 style="color:#1a1a1a;margin-top:0;">Your Tunisia week, ${name} 🇹🇳</h2>
    <p style="color:#555;line-height:1.6;">Here's what happened while you were away:</p>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 4px;"><tr>
      ${stat(d.reactions, 'reactions received')}
      ${stat(d.followers, 'new followers')}
      ${stat(d.streak, 'day streak')}
    </tr></table>
    ${gemBlock}
    <a href="${app}/" style="display:inline-block;background:#b45c3f;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin:16px 0;">Open e-Tunisia</a>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="color:#aaa;font-size:12px;">You're getting this weekly recap because you're active on e-Tunisia. Reply STOP to opt out.</p>
  </div>
</body></html>`;
    }
    async sendDigestTo(user, gem) {
        if (!user.email)
            return;
        const data = await this.buildData(user.id);
        await this.email.send({
            to: user.email,
            subject: 'Your Tunisia week 🇹🇳',
            html: this.renderEmail(user, data, gem),
        });
        this.push.sendToUserBudgeted(user.id, {
            title: 'Your Tunisia week is ready',
            body: `${data.reactions} reactions · ${data.followers} new followers · ${data.streak}-day streak`,
            url: '/',
        }).catch(() => { });
    }
    async sendTestDigest(userId) {
        const user = await this.users.findOne({ where: { id: userId } });
        if (!user?.email)
            return { sent: false };
        await this.sendDigestTo(user, await this.weeklyGem());
        return { sent: true };
    }
    async runWeeklyDigest() {
        const gem = await this.weeklyGem();
        const rows = await this.users.query(`SELECT DISTINCT u.id FROM users u
         JOIN user_streaks s ON s."userId" = u.id
        WHERE u.email IS NOT NULL AND s."lastActiveDate" > now() - interval '21 days'
        LIMIT 1000`).catch(() => []);
        let sent = 0;
        for (const r of rows) {
            const user = await this.users.findOne({ where: { id: r.id } }).catch(() => null);
            if (!user)
                continue;
            await this.sendDigestTo(user, gem).then(() => { sent++; }).catch(() => { });
        }
        this.logger.log(`Weekly digest sent: ${sent}/${rows.length}`);
    }
};
exports.DigestService = DigestService;
exports.DigestService = DigestService = DigestService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(streak_entity_1.UserStreak)),
    __param(2, (0, typeorm_1.InjectRepository)(place_entity_1.Place)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        email_service_1.EmailService,
        push_service_1.PushService])
], DigestService);
//# sourceMappingURL=digest.service.js.map