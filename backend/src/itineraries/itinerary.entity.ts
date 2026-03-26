import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('itineraries')
export class Itinerary {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 200 })
    title: string;

    @Column('text')
    description: string;

    @Column({ nullable: true })
    coverImage: string;

    @Column('simple-json', { nullable: true })
    days: { day: number; title: string; placeIds: string[]; notes: string }[];

    @Column('simple-array', { nullable: true })
    placeIds: string[];

    @Column({ default: 1 })
    duration: number; // number of days

    @Column({ default: 'easy' })
    difficulty: string; // easy | moderate | challenging

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'authorId' })
    author: User;

    @Column()
    authorId: string;

    @Column({ default: true })
    isPublic: boolean;

    @Column({ default: false })
    isPremium: boolean;

    @Column({ default: 0 })
    likeCount: number;

    @Column({ default: 0 })
    viewCount: number;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
