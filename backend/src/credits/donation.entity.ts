import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum DonationTarget {
    USER = 'user',
    PLATFORM = 'platform',
}

@Entity('donations')
export class Donation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'fromUserId' })
    fromUser: User;

    @Column()
    @Index()
    fromUserId: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'toUserId' })
    toUser: User;

    /** Null when target = PLATFORM. */
    @Column({ nullable: true })
    @Index()
    toUserId: string;

    @Column({ type: 'simple-enum', enum: DonationTarget, default: DonationTarget.USER })
    target: DonationTarget;

    @Column('decimal', { precision: 12, scale: 2 })
    grossAmount: number;

    @Column('decimal', { precision: 12, scale: 2 })
    platformFee: number;

    @Column('decimal', { precision: 12, scale: 2 })
    netAmount: number;

    @Column({ length: 280, nullable: true })
    message: string;

    @Column({ default: false })
    isAnonymous: boolean;

    /** Set when this donation was sent as a virtual gift (catalog id, e.g. "rose"). */
    @Column({ nullable: true })
    giftType: string;

    @CreateDateColumn()
    createdAt: Date;
}
