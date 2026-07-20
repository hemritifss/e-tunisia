export declare class StoryReaction {
    id: string;
    storyId: string;
    userId: string;
    emoji: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const STORY_REACTIONS: readonly ["❤️", "😂", "😮", "😢", "👏", "🔥"];
export type StoryReactionEmoji = (typeof STORY_REACTIONS)[number];
export declare function isValidStoryReaction(emoji: string): emoji is StoryReactionEmoji;
