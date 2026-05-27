import type { LucideIcon } from 'lucide-react';
import {
    Waves,
    Sparkles,
    Landmark,
    UtensilsCrossed,
    Mountain,
    Library,
    Wind,
    Sunrise,
} from 'lucide-react';

/**
 * Each mood maps to a concrete set of Tunisian cities and an endorsement
 * topic. That's how a tap on "Desert" turns into a real discovery feed:
 * places in Tozeur/Matmata/Douz, trips that visit any of them, and
 * locals endorsed for "desert-trips".
 *
 * Icons: Lucide components (per MASTER.md §4 `no-emoji-icons`).
 * Tints: CSS variable references into tokens.css — never raw hex.
 */
export interface MoodDef {
    id: string;
    label: string;
    /** Lucide icon component used in the hero + tiles + other-moods pills. */
    Icon: LucideIcon;
    tagline: string;
    /** CSS variable expression; resolved via `--mood-tint` inline style. */
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
        id: 'beach', label: 'Beach', Icon: Waves,
        tagline: 'Mediterranean sunsets, white sand, lazy afternoons.',
        tint: 'var(--cyan)',
        cities: ['Hammamet', 'Djerba', 'Sidi Bou Said', 'Sousse', 'Mahdia'],
        endorsementTopic: 'beach-spots',
        searchQuery: 'beach',
    },
    desert: {
        id: 'desert', label: 'Desert', Icon: Sparkles,
        tagline: 'The Sahara is closer than you think — golden dunes, oases, silent skies.',
        tint: 'var(--terracotta)',
        cities: ['Tozeur', 'Matmata', 'Douz', 'Tataouine'],
        endorsementTopic: 'desert-trips',
        searchQuery: 'desert',
    },
    medina: {
        id: 'medina', label: 'Medina', Icon: Landmark,
        tagline: 'Ancient walls, mosaic doorways, bargaining in the souks.',
        tint: 'var(--sand)',
        cities: ['Tunis', 'Kairouan', 'Sfax', 'Sousse'],
        endorsementTopic: 'medina-tours',
        searchQuery: 'medina',
    },
    foodie: {
        id: 'foodie', label: 'Foodie', Icon: UtensilsCrossed,
        tagline: 'Couscous, brik, makrouk — eat like a Tunisian grandmother.',
        tint: 'var(--gold)',
        cities: ['Sfax', 'Tunis', 'Sousse', 'Mahdia'],
        endorsementTopic: 'food-culture',
        searchQuery: 'food',
    },
    adventure: {
        id: 'adventure', label: 'Adventure', Icon: Mountain,
        tagline: 'Atlas peaks, salt flats, dune buggies, sea kayaking.',
        tint: 'var(--olive)',
        cities: ['Tabarka', 'Ain Draham', 'Tozeur', 'Douz'],
        endorsementTopic: 'hidden-gems',
        searchQuery: 'adventure',
    },
    culture: {
        id: 'culture', label: 'Culture', Icon: Library,
        tagline: 'Roman ruins, Berber villages, museums you can lose a day in.',
        tint: 'var(--violet)',
        cities: ['Carthage', 'Dougga', 'El Jem', 'Kairouan'],
        endorsementTopic: 'local-history',
        searchQuery: 'culture',
    },
    relax: {
        id: 'relax', label: 'Relax', Icon: Wind,
        tagline: 'Hammams, blue doors, slow terraces, the kind of afternoon you call ahead about.',
        tint: 'var(--mediterranean-light)',
        cities: ['Sidi Bou Said', 'Djerba', 'Hammamet', 'Tabarka'],
        endorsementTopic: 'beach-spots',
        searchQuery: 'spa wellness',
    },
    spiritual: {
        id: 'spiritual', label: 'Spiritual & Slow', Icon: Sunrise,
        tagline: 'Kairouan at dawn, Sufi nights, desert silence — Tunisia at its quietest.',
        tint: 'var(--amber)',
        cities: ['Kairouan', 'Tozeur', 'Matmata', 'Mahdia'],
        endorsementTopic: 'local-history',
        searchQuery: 'mosque spiritual',
    },
};

/** Legacy slug → canonical slug. Keeps old bookmarks/share-URLs working. */
const SLUG_ALIASES: Record<string, string> = {
    food: 'foodie',
};

export const MOOD_LIST: MoodDef[] = Object.values(MOOD_DEFS);

export function moodFromHash(): MoodDef | null {
    const m = (window.location.hash || '').match(/^#\/mood\/([a-z-]+)/i);
    if (!m) return null;
    const raw = m[1].toLowerCase();
    const slug = SLUG_ALIASES[raw] || raw;
    return MOOD_DEFS[slug] || null;
}
