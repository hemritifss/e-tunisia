import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getImageUrl } from '../../shared/api';
import { GOVERNORATES, governoratesFromCities } from '../../governorates';
import { useAuthStore } from '../stores/auth-store';

/**
 * The right rail: three ruled sections, no cards and no tabs. Each section is
 * an ink heading rule over its own rows, which is what lets the rail read as
 * part of the same document as the feed instead of a stack of widgets.
 */

function ago(iso: string): string {
    const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return `${s}S`;
    const m = Math.floor(s / 60); if (m < 60) return `${m}M`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}H`;
    return `${Math.floor(h / 24)}D`;
}

function summarize(e: any): { who: string; what: string } {
    const who = e?.actor?.fullName?.split(' ')[0] || 'Someone';
    if (e.type === 'review') return { who, what: `reviewed ${e.target?.placeName || 'a place'}` };
    if (e.type === 'trip') return { who, what: `planned ${e.target?.title || 'a trip'}` };
    if (e.type === 'endorse') return { who, what: `endorsed ${e.target?.user?.fullName?.split(' ')[0] || 'someone'}` };
    if (e.type === 'follow') return { who, what: `followed ${e.target?.user?.fullName?.split(' ')[0] || 'someone'}` };
    return { who, what: 'is exploring Tunisia' };
}

function SectionHead({ label, live = false }: { label: string; live?: boolean }) {
    return (
        <div className="rail-section-head">
            {live && <span className="rail-live-dot" aria-hidden="true" />}
            <span className="rail-section-label">{label}</span>
        </div>
    );
}

function RowSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <div className="rail-skel" aria-hidden="true">
            {Array.from({ length: rows }).map((_, i) => <span key={i} className="rail-skel-row" />)}
        </div>
    );
}

function TunisiaNowSection() {
    const { data, isLoading } = useQuery({
        queryKey: ['rail-activity'],
        queryFn: () => api.getGlobalActivity(8),
        staleTime: 30_000,
        refetchInterval: 60_000,
    });
    const items: any[] = useMemo(() => Array.isArray(data) ? data : (data as any)?.data ?? [], [data]);

    return (
        <section className="rail-section">
            <SectionHead label="Tunisia now" live />
            {isLoading && !items.length ? (
                <RowSkeleton />
            ) : !items.length ? (
                <p className="rail-empty">Nothing fresh yet. Pick a mood above.</p>
            ) : (
                <ul className="rail-rows">
                    {items.slice(0, 5).map((e, i) => {
                        const s = summarize(e);
                        const href = e.actor?.handle ? `#/u/${e.actor.handle}` : '#/activity';
                        return (
                            <li key={i} className="rail-row">
                                <a href={href}>
                                    <strong className="rail-row-who">{s.who}</strong>
                                    <span className="rail-row-what">{s.what}</span>
                                    <span className="rail-row-time">{ago(e.createdAt)}</span>
                                </a>
                            </li>
                        );
                    })}
                </ul>
            )}
            <a className="rail-section-link" href="#/activity">All activity <span aria-hidden="true">&rarr;</span></a>
        </section>
    );
}

/**
 * Passport progress. Moved off the welcome strip so the masthead stays a
 * headline: the numbers read better as a rail statistic than as a stat row.
 */
function PassportSection() {
    const user = useAuthStore((s) => s.user) as any;
    const handle: string | undefined = user?.handle || undefined;

    const { data } = useQuery({
        queryKey: ['rail-passport', handle],
        queryFn: () => api.getPassport(handle as string),
        enabled: !!handle,
        staleTime: 5 * 60_000,
    });

    if (!handle) return null;

    const visited: string[] = Array.isArray((data as any)?.visitedCities) ? (data as any).visitedCities : [];
    const stamped = governoratesFromCities(visited).size;
    const total = GOVERNORATES.length;

    return (
        <section className="rail-section">
            <SectionHead label="Your passport" />
            <div className="rail-passport">
                <span className="rail-passport-count">{String(stamped).padStart(2, '0')}</span>
                <span className="rail-passport-sub">of {total} governorates<br />stamped</span>
            </div>
            <div
                className="rail-passport-bars"
                role="img"
                aria-label={`${stamped} of ${total} governorates stamped`}
            >
                {Array.from({ length: total }).map((_, i) => (
                    <span key={i} className={i < stamped ? 'is-stamped' : undefined} />
                ))}
            </div>
            <a className="rail-section-link" href={`#/u/${handle}`}>
                Open your carnet <span aria-hidden="true">&rarr;</span>
            </a>
        </section>
    );
}

function TrendingPlaceSection() {
    const { data } = useQuery({
        queryKey: ['rail-trending-place'],
        queryFn: async () => {
            try {
                const r: any = await fetch('/api/v1/places/popular?limit=1').then((res) => res.json());
                const list = Array.isArray(r) ? r : (r?.data ?? []);
                return list[0] ?? null;
            } catch { return null; }
        },
        staleTime: 5 * 60_000,
    });

    if (!data) return null;

    const p: any = data;
    const meta = [
        p.city || p.governorate,
        p.rating ? `${Number(p.rating).toFixed(1)} ★` : null,
        p.reviewCount ? `${p.reviewCount} REVIEWS` : null,
    ].filter(Boolean).join(' · ');

    return (
        <section className="rail-section rail-section-boxed">
            <span className="rail-section-label">Trending place</span>
            <a className="rail-trending" href={`#/place/${p.id}`}>
                <span className="rail-trending-frame">
                    <img src={getImageUrl(p.coverImage || (p.images && p.images[0]), 'place')} alt="" loading="lazy" />
                </span>
                <span className="rail-trending-name">{p.name}</span>
                {meta && <span className="rail-trending-meta">{meta}</span>}
            </a>
        </section>
    );
}

export function TunisiaNowPanel() {
    return (
        <div className="feed-rail-sections">
            <TunisiaNowSection />
            <PassportSection />
            <TrendingPlaceSection />
        </div>
    );
}
