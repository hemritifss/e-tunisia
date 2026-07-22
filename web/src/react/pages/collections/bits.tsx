import React from 'react';
import { useQuery } from '@tanstack/react-query';
import * as api from '../../../api';
import { useAuthStore } from '../../stores/auth-store';
import type { Carnet, CarnetThemeKey } from './store';

/**
 * Shared vocabulary for the collections carnet: the theme system (each theme is
 * a rubber stamp), the plan/visited hooks, and the two view-model builders that
 * flatten an editor collection *and* a personal carnet into one shape the grid
 * and the detail sheet can both render without caring which they hold.
 */

// ── themes (each one is a stamp) ─────────────────────────────────────────────

export interface ThemeDef {
    key: CarnetThemeKey;
    label: string;
    emoji: string;
    /** Words that, seen in a title, imply this theme — used to tag editor picks. */
    match: string[];
}

export const THEMES: ThemeDef[] = [
    { key: 'beach', label: 'Beaches', emoji: '🏖️', match: ['beach', 'coast', 'sea', 'island', 'plage', 'lagoon', 'marina'] },
    { key: 'heritage', label: 'Heritage', emoji: '🏛️', match: ['unesco', 'heritage', 'roman', 'ruins', 'ancient', 'museum', 'punic', 'carthage', 'history'] },
    { key: 'food', label: 'Food', emoji: '🍽️', match: ['food', 'culinary', 'eat', 'dining', 'street food', 'restaurant', 'cuisine', 'market'] },
    { key: 'desert', label: 'Desert & oasis', emoji: '🏜️', match: ['desert', 'sahara', 'oasis', 'dune', 'star wars', 'ksar', 'south'] },
    { key: 'architecture', label: 'Architecture', emoji: '🕌', match: ['architecture', 'medina', 'mosque', 'ottoman', 'colonial', 'building', 'kasbah', 'door'] },
    { key: 'nature', label: 'Nature', emoji: '🌿', match: ['nature', 'mountain', 'forest', 'waterfall', 'hike', 'park', 'canyon', 'lake'] },
    { key: 'city', label: 'City', emoji: '🏙️', match: ['city', 'urban', 'nightlife', 'cafe', 'shopping', 'downtown'] },
    { key: 'gem', label: 'Hidden gems', emoji: '💎', match: ['hidden', 'gem', 'secret', 'off the beaten', 'undiscovered', 'local'] },
];

export const THEME_BY_KEY: Record<CarnetThemeKey, ThemeDef> =
    Object.fromEntries(THEMES.map((t) => [t.key, t])) as Record<CarnetThemeKey, ThemeDef>;

/** Best-guess theme for an editor collection that carries no explicit tag. */
export function inferTheme(text: string): CarnetThemeKey | undefined {
    const hay = (text || '').toLowerCase();
    for (const t of THEMES) {
        if (t.match.some((w) => hay.includes(w))) return t.key;
    }
    return undefined;
}

// ── plan gate ────────────────────────────────────────────────────────────────

export function usePlan() {
    const plan = useAuthStore((s) => s.user?.plan) ?? 'free';
    return {
        plan,
        isPro: plan === 'premium' || plan === 'business',
        isBusiness: plan === 'business',
    };
}

// ── visited ("Kont houni" stamps) ────────────────────────────────────────────

export function useVisitedIds() {
    // Auth-only endpoint; hitting it as a guest 401s → hard redirect. Skip when out.
    return useQuery({
        queryKey: ['visited-ids'],
        enabled: api.isLoggedIn(),
        queryFn: async () => {
            try {
                const res = await api.getVisitedIds();
                const ids = Array.isArray(res) ? res : (res as any)?.placeIds || [];
                return new Set<string>(ids.map(String));
            } catch {
                return new Set<string>();
            }
        },
        staleTime: 5 * 60_000,
    });
}

// ── unified view model ───────────────────────────────────────────────────────

export interface CollectionView {
    id: string;
    kind: 'curated' | 'carnet';
    title: string;
    description?: string;
    /** Raw cover path (unresolved). '' means "stitch a collage instead". */
    cover?: string;
    placeIds: string[];
    /** Known member covers, for the collage fallback (carnets that were browsed). */
    placeCovers: string[];
    count: number;
    theme?: CarnetThemeKey;
    likeCount: number;
    isPremium?: boolean;
    ownerName?: string;
    ownerVerified?: boolean;
    isBusiness?: boolean;
    isPrivate?: boolean;
    collaborators?: string[];
    updatedAt?: string;
    /** The original record, for the detail sheet / editor. */
    raw: any;
}

export function normalizeCurated(raw: any): CollectionView {
    const placeIds: string[] = (raw.placeIds || raw.places || []).map((p: any) => String(p?.id ?? p));
    const owner = raw.owner || {};
    const ownerPlan = owner.plan;
    return {
        id: String(raw.id),
        kind: 'curated',
        title: raw.title || 'Untitled collection',
        description: raw.description || '',
        cover: raw.coverImage || raw.image || (raw.images && raw.images[0]) || '',
        placeIds,
        placeCovers: [],
        count: placeIds.length,
        theme: inferTheme(`${raw.title} ${raw.description || ''}`),
        likeCount: Number(raw.likeCount) || 0,
        isPremium: !!raw.isPremium,
        ownerName: owner.fullName || owner.name,
        ownerVerified: !!(owner.isVerified || owner.verified),
        isBusiness: ownerPlan === 'business',
        raw,
    };
}

export function carnetToView(c: Carnet): CollectionView {
    return {
        id: c.id,
        kind: 'carnet',
        title: c.title,
        description: c.description,
        cover: c.cover || '',
        placeIds: c.places.map((p) => p.id),
        placeCovers: c.places.map((p) => p.cover || '').filter(Boolean),
        count: c.places.length,
        theme: c.theme,
        likeCount: c.loves || 0,
        isPrivate: c.isPrivate,
        collaborators: c.collaborators,
        updatedAt: c.updatedAt,
        raw: c,
    };
}

// ── cover: real image, else a stitched collage, else a stamped blank plate ────

export function CoverCollage({
    cover, covers, theme, alt = '',
}: {
    cover?: string;
    covers?: string[];
    theme?: CarnetThemeKey;
    alt?: string;
}) {
    const stamp = theme ? THEME_BY_KEY[theme]?.emoji : '📓';

    if (cover) {
        return <img className="cn-col-cover-img" src={api.getImageUrl(cover)} alt={alt} loading="lazy" />;
    }

    const tiles = (covers || []).filter(Boolean).slice(0, 4);
    if (tiles.length >= 2) {
        return (
            <div className={`cn-col-collage cn-col-collage--${Math.min(tiles.length, 4)}`} aria-hidden="true">
                {tiles.map((c, i) => (
                    <span key={i} style={{ backgroundImage: `url('${api.getImageUrl(c)}')` }} />
                ))}
            </div>
        );
    }

    // Nothing to show yet — a blank carnet plate with the theme stamp pressed in.
    return (
        <div className="cn-col-plate-blank" aria-hidden="true">
            <span className="cn-col-plate-stamp">{stamp}</span>
        </div>
    );
}

// ── a small rubber-stamp theme tag ───────────────────────────────────────────

export function StampTag({ theme, className = '' }: { theme?: CarnetThemeKey; className?: string }) {
    if (!theme) return null;
    const def = THEME_BY_KEY[theme];
    if (!def) return null;
    return (
        <span className={`cn-stamp-tag ${className}`.trim()} title={def.label}>
            <span aria-hidden="true">{def.emoji}</span> {def.label}
        </span>
    );
}
