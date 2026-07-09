import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('post_comments')
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    postId: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'authorId' })
    author: User;

    @Column()
    @Index()
    authorId: string;

    @Column('text')
    body: string;

    @Column({ default: 0 })
    upvotes: number;

    /** Parent comment id for one-level threading (LinkedIn-style replies). */
    @Column({ nullable: true })
    @Index()
    parentId: string | null;

    @Column({ default: 0 })
    likeCount: number;

    @Column({ default: 0 })
    replyCount: number;

    @CreateDateColumn()
    createdAt: Date;
}
