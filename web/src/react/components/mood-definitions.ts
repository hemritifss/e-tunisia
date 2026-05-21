/**
 * Each mood maps to a concrete set of Tunisian cities and an endorsement
 * topic. That's how a tap on "Desert" turns into a real discovery feed:
 * places in Tozeur/Matmata/Douz, trips that visit any of them, and
 * locals endorsed for "desert-trips".
 */
export interface MoodDef {
    id: string;
    label: string;
    emoji: string;
    tagline: string;
    /** Hex tint used by gradients and accents. */
    tint: string;
    /** Tunisian cities most strongly associated with this mood. */
    cities: string[];
    /** Endorsement topic id (must match endorsement-topics). */
    endorsementTopic: string;
    /** Search-engine fallback query when the API doesn't ship a mood filter. */
    searchQuery: string;
}

export const MOOD_DEFS: Record<string, MoodDef> = {
    beach: {
        id: 'beach', label: 'Beach', emoji: '🏖',
        tagline: 'Mediterranean sunsets, white sand, lazy afternoons.',
        tint: '#56cfe1',
        cities: ['Hammamet', 'Djerba', 'Sidi Bou Said', 'Sousse', 'Mahdia'],
        endorsementTopic: 'beach-spots',
        searchQuery: 'beach',
    },
    desert: {
        id: 'desert', label: 'Desert', emoji: '🐪',
        tagline: 'The Sahara is closer than you think — golden dunes, oases, silent skies.',
        tint: '#d4623a',
        cities: ['Tozeur', 'Matmata', 'Douz', 'Tataouine'],
        endorsementTopic: 'desert-trips',
        searchQuery: 'desert',
    },
    medina: {
        id: 'medina', label: 'Medina', emoji: '🕌',
        tagline: 'Ancient walls, mosaic doorways, bargaining in the souks.',
        tint: '#e4b07e',
        cities: ['Tunis', 'Kairouan', 'Sfax', 'Sousse'],
        endorsementTopic: 'medina-tours',
        searchQuery: 'medina',
    },
    food: {
        id: 'food', label: 'Food', emoji: '🍲',
        tagline: 'Couscous, brik, makrouk — eat like a Tunisian grandmother.',
        tint: '#f4c542',
        cities: ['Sfax', 'Tunis', 'Sousse', 'Mahdia'],
        endorsementTopic: 'food-culture',
        searchQuery: 'food',
    },
    adventure: {
        id: 'adventure', label: 'Adventure', emoji: '🏔',
        tagline: 'Atlas peaks, salt flats, dune buggies, sea kayaking.',
        tint: '#7a8c5a',
        cities: ['Tabarka', 'Ain Draham', 'Tozeur', 'Douz'],
        endorsementTopic: 'hidden-gems',
        searchQuery: 'adventure',
    },
    culture: {
        id: 'culture', label: 'Culture', emoji: '🎭',
        tagline: 'Roman ruins, Berber villages, museums you can lose a day in.',
        tint: '#a371f7',
        cities: ['Carthage', 'Dougga', 'El Jem', 'Kairouan'],
        endorsementTopic: 'local-history',
        searchQuery: 'culture',
    },
};

export const MOOD_LIST: MoodDef[] = Object.values(MOOD_DEFS);

export function moodFromHash(): MoodDef | null {
    const m = (window.location.hash || '').match(/^#\/mood\/([a-z-]+)/i);
    if (!m) return null;
    return MOOD_DEFS[m[1].toLowerCase()] || null;
}
