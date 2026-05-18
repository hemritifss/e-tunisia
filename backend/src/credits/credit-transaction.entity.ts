import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum CreditTxKind {
    DEPOSIT = 'deposit',           // bought credits (top-up)
    WITHDRAWAL = 'withdrawal',     // cashed out
    DONATION_OUT = 'donation_out', // user sent a donation
    DONATION_IN = 'donation_in',   // user received a donation
    PLATFORM_FEE = 'platform_fee', // commission going to platform account
    REFUND = 'refund',
}

@Entity('credit_transactions')
export class CreditTransaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    @Index()
    userId: string;

    @Column({ type: 'simple-enum', enum: CreditTxKind })
    @Index()
    kind: CreditTxKind;

    /** Positive for credit-in, negative for credit-out. */
    @Column('decimal', { precision: 12, scale: 2 })
    amount: number;

    /** Counterparty (e.g. the donation recipient or sender). Null for top-ups. */
    @Column({ nullable: true })
    @Index()
    counterpartyId: string;

    @Column({ length: 280, nullable: true })
    note: string;

    /** Snapshot of running balance AFTER this tx — useful for auditing. */
    @Column('decimal', { precision: 12, scale: 2 })
    balanceAfter: number;

    /** Optional link back to the originating donation row. */
    @Column({ nullable: true })
    @Index()
    donationId: string;

    @CreateDateColumn()
    createdAt: Date;
}
