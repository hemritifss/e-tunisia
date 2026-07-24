import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getImageUrl } from '../../shared/api';
import { ArrowLeft, MapPin, Star, Compass, Award, Sparkles, ImageOff, Route, Check } from 'lucide-react';
import { moodFromHash, MOOD_LIST, MoodDef } from '../components/mood-definitions';
import { onRouteChange } from '../../router';
import { Carte } from '../components/Carte';

interface Place { id: string; name: string; city?: string; rating?: number; coverImage?: string; images?: string[]; category?: any; }
interface Trip { slug: string; title: string; days: number; travelers: number; stops?: any[]; }
interface Guide { id: string; handle: string | null; fullName: string; avatar: string | null; country: string | null; bio?: string | null; role?: string; followersCount?: number; }


function TripCard({ t, tint }: { t: Trip; tint: string }) {
    const covers = (t.stops || []).slice(0, 3).map((s: any) => s?.placeCover).filter(Boolean);
    return (
        <a className="mood-trip-card" href={`#/trip/${t.slug}`} style={{ '--mood-tint': tint } as React.CSSProperties}>
            <div className="mood-trip-covers">
                {covers.length
                    ? covers.map((c: string, i: number) => <img key={i} src={c.startsWith('http') ? c : getImageUrl(c)} alt="" loading="lazy" />)
                    : <span className="mood-trip-cover-empty" aria-hidden="true"><Route size={28} /></span>}
            </div>
            <div className="mood-trip-body">
                <strong>{t.title}</strong>
                <span>{t.days}d · {t.travelers} travelers</span>
            </div>
        </a>
    );
}

function GuideCard({ u }: { u: Guide }) {
    const href = u.handle ? `#/u/${u.handle}` : '#';
    return (
        <a
            className="mood-guide-card"
            href={href}
            data-user-id={u.id}
            data-user-name={u.fullName}
            data-user-avatar={u.avatar || undefined}
            data-user-handle={u.handle || undefined}
        >
            {u.avatar
                ? <img src={getImageUrl(u.avatar)} alt="" loading="lazy" />
                : <span className="mood-guide-fallback">{(u.fullName || '?').slice(0, 1).toUpperCase()}</span>}
            <div className="mood-guide-body">
                <strong>
                    {u.fullName}
                    {u.role === 'creator' && (
                        <span className="mood-guide-check" title="Local Guide" aria-label="Local Guide">
                            <Check size={11} />
                        </span>
                    )}
                </strong>
                <span>{u.handle ? `@${u.handle}` : (u.country || '')}</span>
                {u.bio && <em>{u.bio.length > 80 ? u.bio.slice(0, 80) + '…' : u.bio}</em>}
            </div>
        </a>
    );
}

export default function MoodPage() {
    const [mood, setMood] = useState<MoodDef | null>(moodFromHash());

    useEffect(() => {
        const onHash = () => setMood(moodFromHash());
        return onRouteChange(onHash);
    }, []);

    // Places: search by the mood's query then filter to the mood's cities (cheap, no backend changes).
    const { data: placesData, isLoading: placesLoading } = useQuery({
        queryKey: ['mood-places', mood?.id],
        queryFn: async () => {
            if (!mood) return [];
            try {
                const r: any = await api.getPlaces({ search: mood.searchQuery, limit: '20' });
                const arr: any[] = Array.isArray(r) ? r : (r?.data ?? []);
                const cities = new Set(mood.cities.map((c) => c.toLowerCase()));
                const matched = arr.filter((p: any) => p.city && cities.has(p.city.toLowerCase()));
                return (matched.length ? matched : arr).slice(0, 8);
            } catch { return []; }
        },
        enabled: !!mood,
        staleTime: 5 * 60_000,
    });

    // Trips: discover endpoint filtered client-side by stop cities matching this mood.
    const { data: tripsData, isLoading: tripsLoading } = useQuery({
        queryKey: ['mood-trips', mood?.id],
        queryFn: async () => {
            if (!mood) return [];
            try {
                const r: any = await api.getTripsDiscover({ sort: 'popular', limit: 20 });
                const arr: any[] = r?.data ?? (Array.isArray(r) ? r : []);
                const cities = new Set(mood.cities.map((c) => c.toLowerCase()));
                const matched = arr.filter((t: any) =>
                    Array.isArray(t.stops) && t.stops.some((s: any) => s?.placeCity && cities.has(s.placeCity.toLowerCase())),
                );
                return (matched.length ? matched : arr).slice(0, 6);
            } catch { return []; }
        },
        enabled: !!mood,
        staleTime: 5 * 60_000,
    });

    // Local guides: top travelers ranked by city — pick the mood's most active city.
    const { data: guidesData } = useQuery({
        queryKey: ['mood-guides', mood?.id],
        queryFn: async () => {
            if (!mood) return [];
            for (const city of mood.cities) {
                try {
                    const r: any = await fetch(`/api/v1/users/leaderboards/city/${encodeURIComponent(city)}?limit=5`).then((r) => r.json());
                    const arr: any[] = Array.isArray(r) ? r : (r?.data ?? []);
                    if (arr.length) return arr.map((row: any) => row.user as Guide);
                } catch {}
            }
            return [] as Guide[];
        },
        enabled: !!mood,
        staleTime: 5 * 60_000,
    });

    if (!mood) {
        return (
            <main className="mood-page mood-404">
                <h2>Mood not found</h2>
                <p>Try one of these instead:</p>
                <div className="mood-404-list">
                    {MOOD_LIST.map((m) => {
                        const I = m.Icon;
                        return (
                            <a
                                key={m.id}
                                href={`#/mood/${m.id}`}
                                className="mood-404-pill"
                                style={{ '--mood-tint': m.tint } as React.CSSProperties}
                            >
                                <I size={14} /> {m.label}
                            </a>
                        );
                    })}
                </div>
            </main>
        );
    }

    const places: Place[] = (placesData || []) as any;
    const trips: Trip[] = (tripsData || []) as any;
    const guides: Guide[] = (guidesData || []) as any;

    return (
        <main className="mood-page" style={{ '--mood-tint': mood.tint } as React.CSSProperties}>
            <a className="mood-back" href="#/"><ArrowLeft size={14} /> Back to feed</a>

            <section className="mood-hero">
                <div className="mood-hero-bg" />
                <div className="mood-hero-orbs" aria-hidden="true">
                    <span className="mood-hero-orb" />
                    <span className="mood-hero-orb" />
                </div>
                <div className="mood-hero-icon" aria-hidden="true">
                    <mood.Icon size={32} strokeWidth={1.75} />
                </div>
                <h1>{mood.label} in Tunisia</h1>
                <p>{mood.tagline}</p>
                <div className="mood-hero-cities">
                    {mood.cities.slice(0, 6).map((c) => (
                        <a key={c} className="mood-city-chip" href={`#/search?q=${encodeURIComponent(c)}`}>
                            <MapPin size={11} /> {c}
                        </a>
                    ))}
                </div>
            </section>

            <section className="mood-section">
                <header>
                    <h2><Compass size={16} /> Top {mood.label.toLowerCase()} places</h2>
                    <a href="#/explore">Browse all →</a>
                </header>
                {placesLoading && !places.length ? (
                    <div className="mood-skel-grid">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="mood-skel-tile" />)}</div>
                ) : places.length ? (
                    <div className="mood-place-grid">
                        {places.map((p, i) => <Carte key={p.id} place={p} index={i} />)}
                    </div>
                ) : (
                    <div className="mood-empty">No {mood.label.toLowerCase()} places indexed yet. Be the first to add one.</div>
                )}
            </section>

            <section className="mood-section">
                <header>
                    <h2><Sparkles size={16} /> Trips travelers built around {mood.label.toLowerCase()}</h2>
                    <a href="#/discover-trips">All trip plans →</a>
                </header>
                {tripsLoading && !trips.length ? (
                    <div className="mood-skel-grid">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="mood-skel-trip" />)}</div>
                ) : trips.length ? (
                    <div className="mood-trip-grid">
                        {trips.map((t) => <TripCard key={t.slug} t={t} tint={mood.tint} />)}
                    </div>
                ) : (
                    <div className="mood-empty">No public trips here yet. Plan one and inspire the next traveler.</div>
                )}
            </section>

            <section className="mood-section">
                <header>
                    <h2><Award size={16} /> Local guides for {mood.label.toLowerCase()}</h2>
                    <a href="#/leaderboard">All travelers →</a>
                </header>
                {guides.length ? (
                    <div className="mood-guide-grid">
                        {guides.map((g) => <GuideCard key={g.id} u={g} />)}
                    </div>
                ) : (
                    <div className="mood-empty">Once travelers review places in {mood.cities[0]}, top guides will appear here.</div>
                )}
            </section>

            <section className="mood-section mood-other-moods">
                <header><h2>Other moods</h2></header>
                <div className="mood-other-grid">
                    {MOOD_LIST.filter((m) => m.id !== mood.id).map((m) => {
                        const I = m.Icon;
                        return (
                            <a
                                key={m.id}
                                className="mood-other-pill"
                                href={`#/mood/${m.id}`}
                                style={{ '--mood-tint': m.tint } as React.CSSProperties}
                            >
                                <span className="mood-other-icon" aria-hidden="true"><I size={16} strokeWidth={1.75} /></span>
                                <span className="mood-other-label">{m.label}</span>
                            </a>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}
