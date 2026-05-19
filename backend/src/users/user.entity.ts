import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Review } from '../reviews/review.entity';

export enum UserRole {
    USER = 'user',
    CREATOR = 'creator',
    ADMIN = 'admin',
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
    role: UserRole;

    @Column('simple-array', { nullable: true })
    favoriteIds: string[];

    @Column('simple-array', { nullable: true })
    visitedPlaceIds: string[];

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: UserPlan.FREE })
    plan: UserPlan;

    @Column({ nullable: true })
    subscriptionExpiresAt: Date;

    @Column('simple-array', { nullable: true })
    badges: string[];

    @Column({ default: 0 })
    points: number;

    @OneToMany(() => Review, (review) => review.user)
    reviews: Review[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}