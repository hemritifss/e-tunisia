import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, Index, Unique,
} from 'typeorm';

@Entity('comment_likes')
@Unique(['commentId', 'userId'])
export class CommentLike {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    commentId: string;

    @Column()
    @Index()
    userId: string;

    @CreateDateColumn()
    createdAt: Date;
}
