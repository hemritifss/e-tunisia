import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, Index, Unique,
} from 'typeorm';

@Entity('saved_posts')
@Unique(['postId', 'userId'])
export class SavedPost {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    postId: string;

    @Column()
    @Index()
    userId: string;

    @CreateDateColumn()
    createdAt: Date;
}
