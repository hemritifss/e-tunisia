"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BADGE_DEFINITIONS = void 0;
const has = (b, current) => current.includes(b);
const DESERT_CITIES = new Set(['Tozeur', 'Matmata', 'Douz', 'Tataouine']);
const BEACH_CITIES = new Set(['Hammamet', 'Djerba', 'Sidi Bou Said', 'Sousse']);
const MEDINA_CITIES = new Set(['Tunis', 'Sousse', 'Kairouan', 'Sfax']);
exports.BADGE_DEFINITIONS = [
    {
        id: 'new_explorer',
        label: 'New Explorer',
        description: 'Welcome to Tunisia.',
        points: 5,
        eligible: (e, _, c) => e === 'user.created' && !has('new_explorer', c),
    },
    {
        id: 'first_steps',
        label: 'First Steps',
        description: 'Marked your first place visited.',
        points: 10,
        eligible: (e, _, c) => e === 'place.visited' && !has('first_steps', c),
    },
    {
        id: 'trip_planner',
        label: 'Trip Planner',
        description: 'Created your first trip plan.',
        points: 15,
        eligible: (e, _, c) => e === 'trip.created' && !has('trip_planner', c),
    },
    {
        id: 'reviewer',
        label: 'Reviewer',
        description: 'Left your first review.',
        points: 10,
        eligible: (e, _, c) => e === 'review.created' && !has('reviewer', c),
    },
    {
        id: 'saver',
        label: 'Saver',
        description: 'Saved your first place or post.',
        points: 5,
        eligible: (e, _, c) => e === 'post.saved' && !has('saver', c),
    },
    {
        id: 'medina_walker',
        label: 'Medina Walker',
        description: 'Visited a medina city.',
        points: 20,
        eligible: (e, p, c) => e === 'place.visited' &&
            !has('medina_walker', c) &&
            !!p?.city &&
            MEDINA_CITIES.has(p.city),
    },
    {
        id: 'desert_explorer',
        label: 'Desert Explorer',
        description: 'Reached the Tunisian Sahara.',
        points: 25,
        eligible: (e, p, c) => e === 'place.visited' &&
            !has('desert_explorer', c) &&
            !!p?.city &&
            DESERT_CITIES.has(p.city),
    },
    {
        id: 'beach_lover',
        label: 'Beach Lover',
        description: 'Toes on the Mediterranean.',
        points: 15,
        eligible: (e, p, c) => e === 'place.visited' &&
            !has('beach_lover', c) &&
            !!p?.city &&
            BEACH_CITIES.has(p.city),
    },
    {
        id: 'gem_scout',
        label: 'Gem Scout',
        description: 'Submitted your first hidden gem.',
        points: 20,
        eligible: (e, _, c) => e === 'gem.submitted' && !has('gem_scout', c),
    },
    {
        id: 'gem_hunter',
        label: 'Gem Hunter',
        description: 'Your discovery was confirmed by the community — it is on the map forever.',
        points: 60,
        eligible: (e, _, c) => e === 'gem.approved' && !has('gem_hunter', c),
    },
];
//# sourceMappingURL=badge-definitions.js.map