import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStreak } from '../challenges/streak.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { RedisService } from '../redis/redis.service';
import { WeeklyDigestRunner } from './weekly-digest-runner';

/**
 * Lightweight in-process scheduler (no @nestjs/schedule dependency). Ticks hourly
 * and runs day/week jobs inside a Redis-guarded run-once so they fire at most once
 * per period even across restarts / (eventually) multiple instances.
 *
 * Retention pushes it drives (all budgeted to ≤2/day per user via PushService):
 *   • streak-about-to-expire — evening nudge to users whose streak breaks tonight.
 *   • weekly digest ("Win el weekend?") — hook lives here; content in DigestService.
 */
@Injectable()
export class ScheduledTasksService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScheduledTasksService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    @InjectRepository(UserStreak) private readonly streaks: Repository<UserStreak>,
    private readonly notifications: NotificationsService,
    private readonly redis: RedisService,
    @Optional() private readonly weekly?: WeeklyDigestRunner,
  ) {}

  onModuleInit() {
    // Kick once shortly after boot, then every hour.
    this.timer = setInterval(() => this.tick().catch((e) => this.logger.warn(e?.message)), 60 * 60 * 1000);
    setTimeout(() => this.tick().catch(() => { /* boot tick best-effort */ }), 30_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private dayKey(d: Date) { return d.toISOString().slice(0, 10); }
  private weekKey(d: Date) {
    // ISO-ish week bucket (year + week number) — good enough for once-a-week gating.
    const onejan = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getUTCDay() + 1) / 7);
    return `${d.getUTCFullYear()}-W${week}`;
  }

  private async tick() {
    const now = new Date();
    const hour = now.getUTCHours();
    const dow = now.getUTCDay(); // 0=Sun … 4=Thu

    // Streak reminders — evening in Tunisia (~UTC 18–20).
    if (hour >= 18 && hour <= 20) {
      await this.runOnce(`cron:streak:${this.dayKey(now)}`, () => this.runStreakReminders());
    }
    // Weekly digest — Thursday mid-morning (~UTC 09), the "Win el weekend?" anchor.
    if (dow === 4 && hour >= 9 && hour <= 11 && this.weekly) {
      await this.runOnce(`cron:digest:${this.weekKey(now)}`, () => this.weekly!.runWeeklyDigest());
    }
  }

  /** Redis-guarded so a job runs at most once per period. Falls open if Redis is down. */
  private async runOnce(key: string, fn: () => Promise<void>) {
    try {
      if (await this.redis.get(key)) return;
      await this.redis.setJson(key, 1, 26 * 3600);
    } catch { /* redis down — proceed (may re-run on restart, acceptable) */ }
    await fn();
  }

  /** Nudge users whose streak will break at midnight (active yesterday, not today). */
  async runStreakReminders() {
    const yesterday = this.dayKey(new Date(Date.now() - 86_400_000));
    const rows = await this.streaks
      .createQueryBuilder('s')
      .where('s.currentStreak >= 1')
      .andWhere('s.lastActiveDate = :d', { d: yesterday })
      .getMany()
      .catch(() => [] as UserStreak[]);

    let sent = 0;
    for (const s of rows) {
      await this.notifications.create(
        s.userId,
        '🔥 Keep your streak alive',
        `Your ${s.currentStreak}-day streak ends at midnight — a quick check-in keeps it going.`,
        NotificationType.SYSTEM,
        { url: '/', kind: 'streak-reminder' },
      ).then(() => { sent++; }).catch(() => { /* skip this user */ });
    }
    this.logger.log(`Streak reminders sent: ${sent}/${rows.length}`);
  }
}
