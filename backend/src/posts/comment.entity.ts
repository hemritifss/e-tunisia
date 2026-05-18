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

    @CreateDateColumn()
    createdAt: Date;
}
