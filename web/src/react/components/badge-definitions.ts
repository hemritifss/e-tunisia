export interface BadgeDisplay {
    id: string;
    label: string;
    description: string;
    emoji: string;
    accent: string;
}

export const BADGES: Record<string, BadgeDisplay> = {
    new_explorer:    { id: 'new_explorer',    label: 'New Explorer',    description: 'Welcome to Tunisia.',              emoji: '🌟', accent: '#f4c542' },
    first_steps:     { id: 'first_steps',     label: 'First Steps',     description: 'Marked your first place visited.', emoji: '👣', accent: '#79c0ff' },
    trip_planner:    { id: 'trip_planner',    label: 'Trip Planner',    description: 'Created your first trip plan.',   emoji: '🧭', accent: '#a371f7' },
    reviewer:        { id: 'reviewer',        label: 'Reviewer',        description: 'Left your first review.',         emoji: '⭐', accent: '#ffd166' },
    saver:           { id: 'saver',           label: 'Saver',           description: 'Saved your first place or post.', emoji: '🔖', accent: '#56d364' },
    medina_walker:   { id: 'medina_walker',   label: 'Medina Walker',   description: 'Visited a medina city.',          emoji: '🕌', accent: '#e4b07e' },
    desert_explorer: { id: 'desert_explorer', label: 'Desert Explorer', description: 'Reached the Tunisian Sahara.',    emoji: '🐪', accent: '#d4623a' },
    beach_lover:     { id: 'beach_lover',     label: 'Beach Lover',     description: 'Toes on the Mediterranean.',      emoji: '🏖', accent: '#56cfe1' },
};

export const BADGE_DISPLAY_ORDER = [
    'new_explorer', 'first_steps', 'trip_planner', 'reviewer',
    'saver', 'medina_walker', 'desert_explorer', 'beach_lover',
];
