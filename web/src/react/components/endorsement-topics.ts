// Mirrors backend/src/users/endorsement-topics.ts — keep in sync.
export interface EndorsementTopic { id: string; label: string; emoji: string; }

export const ENDORSEMENT_TOPICS: EndorsementTopic[] = [
    { id: 'medina-tours',       label: 'Medina tours',          emoji: '🕌' },
    { id: 'desert-trips',       label: 'Desert trips',          emoji: '🐪' },
    { id: 'beach-spots',        label: 'Beach spots',           emoji: '🏖' },
    { id: 'food-culture',       label: 'Food & culture',        emoji: '🍲' },
    { id: 'street-photography', label: 'Street photography',    emoji: '📸' },
    { id: 'nightlife',          label: 'Nightlife',             emoji: '🌙' },
    { id: 'family-friendly',    label: 'Family-friendly',       emoji: '👨‍👩‍👧' },
    { id: 'budget-travel',      label: 'Budget travel',         emoji: '💰' },
    { id: 'luxury-stays',       label: 'Luxury stays',          emoji: '✨' },
    { id: 'local-history',      label: 'Local history',         emoji: '📜' },
    { id: 'craft-shopping',     label: 'Craft & shopping',      emoji: '🛍' },
    { id: 'hidden-gems',        label: 'Hidden gems',           emoji: '💎' },
];

export const TOPIC_BY_ID: Record<string, EndorsementTopic> = Object.fromEntries(
    ENDORSEMENT_TOPICS.map((t) => [t.id, t]),
);
