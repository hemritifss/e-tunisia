import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum SubStatus { ACTIVE = 'active', EXPIRED = 'expired', CANCELLED = 'cancelled' }

@Entity('subscriptions')
export class Subscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column({ default: 'free' })
    plan: string; // free | premium | business

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    amount: number;

    @Column({ default: 'TND' })
    currency: string;

    @Column({ default: 'cash' })
    paymentMethod: string; // cash | bank | card

    @Column({ nullable: true })
    paymentReference: string;

    @Column({ default: SubStatus.ACTIVE })
    status: SubStatus;

    @Column({ nullable: true })
    startsAt: Date;

    @Column({ nullable: true })
    expiresAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}
