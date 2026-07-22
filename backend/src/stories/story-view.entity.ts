import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, Index, Unique,
} from 'typeorm';

/**
 * One row per viewer per story — powers the author's "seen by" list and makes
 * viewCount idempotent (the old counter incremented on every re-open, and was
 * writable by anonymous callers).
 */
@Entity('story_views')
@Unique(['storyId', 'viewerId'])
export class StoryView {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    storyId: string;

    @Column()
    @Index()
    viewerId: string;

    @CreateDateColumn()
    createdAt: Date;
}
