import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, Index, Unique,
} from 'typeorm';

export enum ReactionType {
    LIKE = 'like',        // 👍 fallback / default
    LOVE = 'love',        // ❤️
    CELEBRATE = 'celebrate', // 🎉
    INSIGHTFUL = 'insightful', // 💡
    LAUGH = 'laugh',      // 😂
    WOW = 'wow',          // 😮
    SUPPORT = 'support',  // 🤝
}

@Entity('post_reactions')
@Unique(['postId', 'userId'])
export class PostReaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    postId: string;

    @Column()
    @Index()
    userId: string;

    @Column({ type: 'simple-enum', enum: ReactionType })
    type: ReactionType;

    @CreateDateColumn()
    createdAt: Date;
}
