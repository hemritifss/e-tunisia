// Badge definitions — mirrors backend/src/badges/definitions.ts.
//
// `icon` is the Lucide icon name (kebab-case) for surfaces conforming to
// MASTER.md §4 `no-emoji-icons`. `emoji` + `accent` are kept for back-compat
// with legacy surfaces; new code uses `icon` + `tint`.

export interface BadgeDisplay {
    id: string;
    label: string;
    description: string;
    /** Legacy emoji — kept for back-compat. New code uses `icon`. */
    emoji: string;
    /** Lucide icon name (kebab-case). */
    icon: string;
    /** Legacy hex accent — kept for surfaces not yet migrated. */
    accent: string;
    /** Brand-token tint (CSS variable expression). */
    tint: string;
}

export const BADGES: Record<string, BadgeDisplay> = {
    new_explorer:    { id: 'new_explorer',    label: 'New Explorer',    description: 'Welcome to Tunisia.',              emoji: '🌟', icon: 'star',       accent: '#f4c542', tint: 'var(--warning)' },
    first_steps:     { id: 'first_steps',     label: 'First Steps',     description: 'Marked your first place visited.', emoji: '👣', icon: 'footprints', accent: '#79c0ff', tint: 'var(--mediterranean)' },
    trip_planner:    { id: 'trip_planner',    label: 'Trip Planner',    description: 'Created your first trip plan.',   emoji: '🧭', icon: 'compass',    accent: '#a371f7', tint: 'var(--violet)' },
    reviewer:        { id: 'reviewer',        label: 'Reviewer',        description: 'Left your first review.',         emoji: '⭐', icon: 'star',       accent: '#ffd166', tint: 'var(--warning)' },
    saver:           { id: 'saver',           label: 'Saver',           description: 'Saved your first place or post.', emoji: '🔖', icon: 'bookmark',   accent: '#56d364', tint: 'var(--olive)' },
    medina_walker:   { id: 'medina_walker',   label: 'Medina Walker',   description: 'Visited a medina city.',          emoji: '🕌', icon: 'landmark',   accent: '#e4b07e', tint: 'var(--sand)' },
    desert_explorer: { id: 'desert_explorer', label: 'Desert Explorer', description: 'Reached the Tunisian Sahara.',    emoji: '🐪', icon: 'sun',        accent: '#d4623a', tint: 'var(--terracotta)' },
    beach_lover:     { id: 'beach_lover',     label: 'Beach Lover',     description: 'Toes on the Mediterranean.',      emoji: '🏖', icon: 'waves',      accent: '#56cfe1', tint: 'var(--cyan)' },
};

export const BADGE_DISPLAY_ORDER = [
    'new_explorer', 'first_steps', 'trip_planner', 'reviewer',
    'saver', 'medina_walker', 'desert_explorer', 'beach_lover',
];
