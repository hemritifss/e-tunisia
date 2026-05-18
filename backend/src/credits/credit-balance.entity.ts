import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

// One row per user — the running TND credit balance.
@Entity('credit_balances')
export class CreditBalance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    @Index({ unique: true })
    userId: string;

    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    balance: number;

    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    lifetimeIn: number;   // sum of all credits received (top-ups + donations received)

    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    lifetimeOut: number;  // sum of all credits sent (donations + withdrawals)

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
