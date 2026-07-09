import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_streaks')
export class UserStreak {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ default: 0 })
  longestStreak: number;

  @Column({ type: 'date', nullable: true })
  lastActiveDate: Date;

  @Column({ type: 'simple-json', nullable: true })
  streakHistory: Array<{
    date: string;
    action: string;
    pointsEarned: number;
  }>;

  @Column({ default: 0 })
  totalDaysActive: number;

  /** Pro/Business streak-freeze allowance — refilled monthly, consumed to survive a missed day. */
  @Column({ default: 0 })
  freezesRemaining: number;

  /** Month (YYYY-MM) the freeze allowance was last refilled. */
  @Column({ nullable: true })
  freezeMonth: string;

  /** Last daily check-in (date) — drives check-in idempotency + points. */
  @Column({ type: 'date', nullable: true })
  lastCheckInDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
