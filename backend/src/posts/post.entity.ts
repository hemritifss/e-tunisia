import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('posts')
export class Post {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 240 })
    title: string;

    @Column('text')
    body: string;

    @Column({ nullable: true })
    @Index()
    category: string;

    /**
     * Post variant. Default null = a normal user post. 'achievement' = an
     * auto-generated celebratory card (badge/level earned) that others can react
     * to — turns private dopamine into social proof, right in the feed.
     */
    @Column({ nullable: true })
    kind: string | null;

    /** Structured payload for non-plain kinds (e.g. achievement badge details). */
    @Column({ type: 'simple-json', nullable: true })
    meta: Record<string, any> | null;

    @Column({ nullable: true })
    location: string;

    @Column({ nullable: true })
    @Index()
    placeId: string;

    @Column('simple-array', { nullable: true })
    images: string[];

    @Column({ nullable: true })
    videoUrl: string | null;

    @Column('simple-array', { nullable: true })
    tags: string[];

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'authorId' })
    author: User;

    @Column()
    @Index()
    authorId: string;

    @Column({ default: 0 })
    upvotes: number;

    @Column({ default: 0 })
    downvotes: number;

    @Column({ default: 0 })
    commentCount: number;

    @Column({ default: 0 })
    viewCount: number;

    @Column({ default: 0 })
    repostCount: number;

    @Column({ default: false })
    isPinned: boolean;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
