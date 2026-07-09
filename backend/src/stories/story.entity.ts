import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

// 24-hour ephemeral image stories à la Facebook / Instagram.
@Entity('stories')
export class Story {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'authorId' })
    author: User;

    @Column()
    @Index()
    authorId: string;

    @Column('text')
    imageUrl: string;

    @Column({ length: 280, nullable: true })
    caption: string;

    @Column({ default: 0 })
    viewCount: number;

    @Column({ default: true })
    isActive: boolean;

    /** Pinned to the author's profile ("My Tunisia Journey") — persists past 24h expiry. */
    @Column({ default: false })
    @Index()
    isHighlight: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ type: 'timestamp' })
    @Index()
    expiresAt: Date;
}
