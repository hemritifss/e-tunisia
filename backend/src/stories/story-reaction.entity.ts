import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn, Index, Unique,
} from 'typeorm';

/** Quick emoji reactions on a story. One per viewer per story — reacting again replaces. */
@Entity('story_reactions')
@Unique(['storyId', 'userId'])
export class StoryReaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    storyId: string;

    @Column()
    @Index()
    userId: string;

    /** Constrained to STORY_REACTIONS — validated in the service, not by the DB. */
    @Column({ length: 16 })
    emoji: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

/** The quick-reaction tray, in display order. */
export const STORY_REACTIONS = ['❤️', '😂', '😮', '😢', '👏', '🔥'] as const;

export type StoryReactionEmoji = (typeof STORY_REACTIONS)[number];

export function isValidStoryReaction(emoji: string): emoji is StoryReactionEmoji {
    return (STORY_REACTIONS as readonly string[]).includes(emoji);
}
