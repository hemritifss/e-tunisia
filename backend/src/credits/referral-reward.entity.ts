import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * One row per referred signup. The referrer's reward is held `pending` until the
 * referee shows real intent (first top-up) — this is the anti-farming gate, since
 * a throwaway account's own welcome credit is non-extractable (no cash-out exists).
 * `refereeId` is unique → a user can only ever be "referred" once.
 */
@Entity('referral_rewards')
export class ReferralReward {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ unique: true })
    refereeId: string;

    @Index()
    @Column()
    referrerId: string;

    @Column({ default: 'pending' })
    status: 'pending' | 'released';

    /** Reward credited to the referrer on release (0 if a cap was hit). */
    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    amount: number;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true })
    releasedAt: Date;
}
