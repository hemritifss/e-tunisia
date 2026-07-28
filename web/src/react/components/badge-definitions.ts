// Badge definitions — mirrors backend/src/badges/definitions.ts.
//
// `icon` is the Lucide icon name (kebab-case) for surfaces conforming to
// MASTER.md §4 `no-emoji-icons`. `emoji` is kept for back-compat with legacy
// surfaces; new code uses `icon` + `tint`.

export interface BadgeDisplay {
    id: string;
    label: string;
    description: string;
    /** Legacy emoji — kept for back-compat. New code uses `icon`. */
    emoji: string;
    /** Lucide icon name (kebab-case). */
    icon: string;
    /** Brand-token tint (CSS variable expression). */
    tint: string;
}

export const BADGES: Record<string, BadgeDisplay> = {
    new_explorer:    { id: 'new_explorer',    label: 'New Explorer',    description: 'Welcome to Tunisia.',              emoji: '🌟', icon: 'star',       tint: 'var(--warning)' },
    first_steps:     { id: 'first_steps',     label: 'First Steps',     description: 'Marked your first place visited.', emoji: '👣', icon: 'footprints', tint: 'var(--mediterranean)' },
    trip_planner:    { id: 'trip_planner',    label: 'Trip Planner',    description: 'Created your first trip plan.',   emoji: '🧭', icon: 'compass',    tint: 'var(--violet)' },
    reviewer:        { id: 'reviewer',        label: 'Reviewer',        description: 'Left your first review.',         emoji: '⭐', icon: 'star',       tint: 'var(--warning)' },
    saver:           { id: 'saver',           label: 'Saver',           description: 'Saved your first place or post.', emoji: '🔖', icon: 'bookmark',   tint: 'var(--olive)' },
    medina_walker:   { id: 'medina_walker',   label: 'Medina Walker',   description: 'Visited a medina city.',          emoji: '🕌', icon: 'landmark',   tint: 'var(--sand)' },
    desert_explorer: { id: 'desert_explorer', label: 'Desert Explorer', description: 'Reached the Tunisian Sahara.',    emoji: '🐪', icon: 'sun',        tint: 'var(--terracotta)' },
    beach_lover:     { id: 'beach_lover',     label: 'Beach Lover',     description: 'Toes on the Mediterranean.',      emoji: '🏖', icon: 'waves',      tint: 'var(--cyan)' },
};

export const BADGE_DISPLAY_ORDER = [
    'new_explorer', 'first_steps', 'trip_planner', 'reviewer',
    'saver', 'medina_walker', 'desert_explorer', 'beach_lover',
];
