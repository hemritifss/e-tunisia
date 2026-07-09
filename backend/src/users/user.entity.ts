import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Review } from '../reviews/review.entity';

export enum UserRole {
    USER = 'user',
    CREATOR = 'creator',
    ADMIN = 'admin',
    SUPERADMIN = 'superadmin',
}

export enum UserPlan {
    FREE = 'free',
    PREMIUM = 'premium',
    BUSINESS = 'business',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100 })
    fullName: string;

    @Column({ unique: true })
    email: string;

    @Column({ length: 30, unique: true, nullable: true })
    handle: string | null;

    @Column()
    @Exclude()
    password: string;

    @Column({ nullable: true })
    avatar: string;

    @Column({ nullable: true, length: 20 })
    phone: string;

    @Column({ nullable: true })
    country: string;

    @Column({ nullable: true, length: 320 })
    bio: string;

    @Column({ nullable: true, length: 200 })
    website: string;

    @Column('simple-array', { nullable: true })
    interests: string[];

    @Column({ default: false })
    onboardingComplete: boolean;

    @Column({ default: UserRole.USER })
    @Index()
    role: UserRole;

    @Column({ default: UserPlan.FREE })
    @Index()
    plan: UserPlan;

    @Column('simple-array', { nullable: true })
    favoriteIds: string[];

    @Column('simple-array', { nullable: true })
    visitedPlaceIds: string[];

    /**
     * Founders' program: the first 1000 real accounts get a permanent numbered
     * passport (№0001–№1000). Assigned once at registration, never reused.
     */
    @Column({ type: 'int', nullable: true })
    @Index({ unique: true, where: '"founderNumber" IS NOT NULL' })
    founderNumber: number | null;

    @Column({ default: true })
    @Index()
    isActive: boolean;

    @Column({ nullable: true })
    subscriptionExpiresAt: Date;

    @Column({ nullable: true })
    stripeCustomerId: string | null;

    /** Pro perk: chosen passport hero theme (sahara | mediterranean | medina). */
    @Column({ nullable: true })
    passportTheme: string | null;

    /** Referral: the user id of whoever referred this account (set once at registration). */
    @Column({ nullable: true })
    referredBy: string | null;

    @Column('simple-array', { nullable: true })
    badges: string[];

    @Column({ default: 0 })
    points: number;

    @Column({ type: 'int', default: 0 })
    followersCount: number;

    @Column({ type: 'int', default: 0 })
    followingCount: number;

    @Column({ nullable: true, unique: true })
    @Exclude()
    passwordResetToken: string | null;

    @Column({ nullable: true })
    @Exclude()
    passwordResetExpires: Date | null;

    /** Incremented on password change to invalidate all existing JWTs. */
    @Column({ default: 0 })
    @Exclude()
    tokenVersion: number;

    @OneToMany(() => Review, (review) => review.user)
    reviews: Review[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}