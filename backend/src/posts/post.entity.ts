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
