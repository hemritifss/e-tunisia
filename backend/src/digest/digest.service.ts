import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { UserStreak } from '../challenges/streak.entity';
import { Place } from '../places/place.entity';
import { EmailService } from '../email/email.service';
import { PushService } from '../push/push.service';
import { WeeklyDigestRunner } from '../scheduled/scheduled-tasks.service';

interface DigestData {
  reactions: number;
  followers: number;
  streak: number;
}

/**
 * "Your Tunisia week" — the weekly re-engagement digest (roadmap 1.3).
 * Reactions received + new followers + streak status + one hidden gem, sent by
 * email (Resend via EmailService) and echoed as a budgeted push nudge. Registered
 * as the WeeklyDigestRunner the scheduler fires each Thursday.
 */
@Injectable()
export class DigestService implements WeeklyDigestRunner {
  private readonly logger = new Logger(DigestService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserStreak) private readonly streaks: Repository<UserStreak>,
    @InjectRepository(Place) private readonly places: Repository<Place>,
    private readonly email: EmailService,
    private readonly push: PushService,
  ) {}

  private appUrl(): string {
    return (process.env.FRONTEND_URL || 'https://etunisia.com').replace(/\/+$/, '');
  }

  private async buildData(userId: string): Promise<DigestData> {
    const [reactionRows, followerRows, streak] = await Promise.all([
      this.users.query(
        `SELECT count(*)::int AS n FROM post_reactions r
           JOIN posts p ON p.id = r."postId"
          WHERE p."authorId" = $1 AND r."createdAt" > now() - interval '7 days'`,
        [userId],
      ).catch(() => [{ n: 0 }]),
      this.users.query(
        `SELECT count(*)::int AS n FROM follows
          WHERE "followingId" = $1 AND "createdAt" > now() - interval '7 days'`,
        [userId],
      ).catch(() => [{ n: 0 }]),
      this.streaks.findOne({ where: { userId } }).catch(() => null),
    ]);
    return {
      reactions: reactionRows?.[0]?.n || 0,
      followers: followerRows?.[0]?.n || 0,
      streak: streak?.currentStreak || 0,
    };
  }

  /** One "hidden gem" for the week — a highly-rated place (shared across the run). */
  private async weeklyGem(): Promise<Place | null> {
    const pool = await this.places.find({
      where: { isActive: true } as any,
      order: { rating: 'DESC' as any },
      take: 20,
    }).catch(() => [] as Place[]);
    if (!pool.length) return null;
    const week = Math.floor(Date.now() / (7 * 86_400_000));
    return pool[week % pool.length];
  }

  private renderEmail(user: User, d: DigestData, gem: Place | null): string {
    const name = (user.fullName || '').split(' ')[0] || 'there';
    const app = this.appUrl();
    const stat = (n: number, label: string) =>
      `<td style="text-align:center;padding:8px 12px;">
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

  /** Build + send one user's digest (email + a budgeted push nudge). */
  async sendDigestTo(user: User, gem: Place | null): Promise<void> {
    if (!user.email) return;
    const data = await this.buildData(user.id);
    await this.email.send({
      to: user.email,
      subject: 'Your Tunisia week 🇹🇳',
      html: this.renderEmail(user, data, gem),
    });
    // Echo a short push nudge (respects the 2/day budget; no-ops without VAPID).
    this.push.sendToUserBudgeted(user.id, {
      title: 'Your Tunisia week is ready',
      body: `${data.reactions} reactions · ${data.followers} new followers · ${data.streak}-day streak`,
      url: '/',
    }).catch(() => { /* best-effort */ });
  }

  /** Manual trigger (admin/self test) — verifies the whole pipe with a real key. */
  async sendTestDigest(userId: string): Promise<{ sent: boolean }> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user?.email) return { sent: false };
    await this.sendDigestTo(user, await this.weeklyGem());
    return { sent: true };
  }

  /** Scheduler entry point — Thursday weekly run to recently-active users. */
  async runWeeklyDigest(): Promise<void> {
    const gem = await this.weeklyGem();
    // Audience: users with an email who were active in the last 21 days (a
    // re-engagement digest targets the semi-active, not the whole dormant base).
    const rows: Array<{ id: string }> = await this.users.query(
      `SELECT DISTINCT u.id FROM users u
         JOIN user_streaks s ON s."userId" = u.id
        WHERE u.email IS NOT NULL AND s."lastActiveDate" > now() - interval '21 days'
        LIMIT 1000`,
    ).catch(() => []);
    let sent = 0;
    for (const r of rows) {
      const user = await this.users.findOne({ where: { id: r.id } }).catch(() => null);
      if (!user) continue;
      await this.sendDigestTo(user, gem).then(() => { sent++; }).catch(() => { /* skip */ });
    }
    this.logger.log(`Weekly digest sent: ${sent}/${rows.length}`);
  }
}
