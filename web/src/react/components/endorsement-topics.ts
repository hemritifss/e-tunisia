// Mirrors backend/src/users/endorsement-topics.ts — keep in sync.
//
// `icon` is the Lucide icon name (without prefix) used by UI surfaces that
// conform to MASTER.md §4 `no-emoji-icons`. `emoji` is kept for backwards
// compatibility with older surfaces that haven't been migrated yet; new code
// should use `icon`.
export interface EndorsementTopic {
    id: string;
    label: string;
    /** Legacy emoji — do not use in new code. Prefer `icon`. */
    emoji: string;
    /** Lucide icon name (kebab-case). */
    icon: string;
}

export const ENDORSEMENT_TOPICS: EndorsementTopic[] = [
    { id: 'medina-tours',       label: 'Medina tours',       emoji: '🕌',      icon: 'landmark' },
    { id: 'desert-trips',       label: 'Desert trips',       emoji: '🐪',      icon: 'sparkles' },
    { id: 'beach-spots',        label: 'Beach spots',        emoji: '🏖',      icon: 'waves' },
    { id: 'food-culture',       label: 'Food & culture',     emoji: '🍲',      icon: 'utensils-crossed' },
    { id: 'street-photography', label: 'Street photography', emoji: '📸',      icon: 'camera' },
    { id: 'nightlife',          label: 'Nightlife',          emoji: '🌙',      icon: 'moon' },
    { id: 'family-friendly',    label: 'Family-friendly',    emoji: '👨‍👩‍👧',     icon: 'users' },
    { id: 'budget-travel',      label: 'Budget travel',      emoji: '💰',      icon: 'piggy-bank' },
    { id: 'luxury-stays',       label: 'Luxury stays',       emoji: '✨',      icon: 'crown' },
    { id: 'local-history',      label: 'Local history',      emoji: '📜',      icon: 'scroll-text' },
    { id: 'craft-shopping',     label: 'Craft & shopping',   emoji: '🛍',      icon: 'shopping-bag' },
    { id: 'hidden-gems',        label: 'Hidden gems',        emoji: '💎',      icon: 'gem' },
];

export const TOPIC_BY_ID: Record<string, EndorsementTopic> = Object.fromEntries(
    ENDORSEMENT_TOPICS.map((t) => [t.id, t]),
);
