/**
 * Curated set of endorsement topics. Tunisia-specific — keep this list tight
 * and meaningful. Anything not in this set is rejected at the endpoint.
 *
 * Mirrored in web/src/react/components/endorsement-topics.ts for the UI.
 */
export interface EndorsementTopic {
    id: string;       // slug — what gets stored in Endorsement.topic
    label: string;    // user-facing
    emoji: string;
}

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

const ID_SET = new Set(ENDORSEMENT_TOPICS.map((t) => t.id));

export function isValidTopic(id: string): boolean {
    return typeof id === 'string' && ID_SET.has(id);
}
