import React, { useEffect, useState } from 'react';
import { api, getImageUrl } from '../../shared/api';
import { Calendar, Users, MapPin, Star } from 'lucide-react';
import { Swap } from './Swap';

interface Props { handle: string; }

type Tab = 'trips' | 'reviews' | 'saves';

export function PassportTabs({ handle }: Props) {
    const [tab, setTab] = useState<Tab>('trips');
    const [data, setData] = useState<Record<Tab, any[] | null>>({ trips: null, reviews: null, saves: null });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (data[tab] !== null) return;
        setLoading(true);
        const fetcher =
            tab === 'trips' ? api.getTripsByHandle :
            tab === 'reviews' ? api.getReviewsByHandle :
            api.getSavesByHandle;
        Promise.resolve(fetcher(handle))
            .then((res: any) => {
                const list = Array.isArray(res) ? res : (res?.data ?? []);
                setData((d) => ({ ...d, [tab]: list }));
            })
            .catch(() => setData((d) => ({ ...d, [tab]: [] })))
            .finally(() => setLoading(false));
    }, [tab, handle]);

    return (
        <div className="passport-tabs">
            <div className="passport-tabs-head" role="tablist">
                {(['trips', 'reviews', 'saves'] as Tab[]).map((t) => (
                    <button
                        key={t}
                        role="tab"
                        aria-selected={tab === t}
                        className={tab === t ? 'active' : ''}
                        onClick={() => setTab(t)}
                    >
                        {t === 'trips' ? 'Trips' : t === 'reviews' ? 'Reviews' : 'Saves'}
                    </button>
                ))}
            </div>
            <div className="passport-tabs-body">
                <Swap loading={loading} skeleton={<div className="passport-tab-skel" />}>
                    {tab === 'trips' && <TripsList items={data.trips || []} />}
                    {tab === 'reviews' && <ReviewsList items={data.reviews || []} />}
                    {tab === 'saves' && <SavesList items={data.saves || []} />}
                </Swap>
            </div>
        </div>
    );
}

function TripsList({ items }: { items: any[] }) {
    if (!items.length) return <Empty text="No public trips yet." />;
    return (
        <div className="passport-trip-grid">
            {items.map((t) => (
                <a key={t.slug} className="passport-trip-card" href={`#/trip/${t.slug}`}>
                    <div className="passport-trip-cover">
                        {(t.stops || []).slice(0, 3).map((s: any, i: number) =>
                            s.placeCover ? (
                                <img
                                    key={i}
                                    src={s.placeCover.startsWith('http') ? s.placeCover : getImageUrl(s.placeCover)}
                                    alt=""
                                    loading="lazy"
                                />
                            ) : null,
                        )}
                    </div>
                    <div className="passport-trip-meta">
                        <strong>{t.title}</strong>
                        <span><Calendar size={12} /> {t.days}d · <Users size={12} /> {t.travelers}</span>
                    </div>
                </a>
            ))}
        </div>
    );
}

function ReviewsList({ items }: { items: any[] }) {
    if (!items.length) return <Empty text="No reviews yet." />;
    return (
        <ul className="passport-review-list">
            {items.map((r) => (
                <li key={r.id} className="passport-review">
                    <div className="passport-review-head">
                        {r.place?.name && (
                            <a href={`#/place/${r.place.id}`}><MapPin size={12} /> {r.place.name}</a>
                        )}
                        {typeof r.rating === 'number' && r.rating > 0 && (
                            <span className="passport-review-stars" aria-label={`${r.rating} out of 5 stars`}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} size={11} className={i < r.rating ? 'is-filled' : ''} />
                                ))}
                            </span>
                        )}
                    </div>
                    <p>{r.comment || r.body}</p>
                </li>
            ))}
        </ul>
    );
}

function SavesList({ items }: { items: any[] }) {
    if (!items.length) return <Empty text="No saved posts yet." />;
    return (
        <ul className="passport-review-list">
            {items.map((s: any) => (
                <li key={s.id} className="passport-review">
                    <div className="passport-review-head">
                        <a href={`#/post/${s.id}`}>{s.title || s.body?.slice(0, 80) || 'Saved post'}</a>
                    </div>
                    {s.body && <p>{s.body.slice(0, 200)}</p>}
                </li>
            ))}
        </ul>
    );
}

function Empty({ text }: { text: string }) {
    return <div className="passport-empty">{text}</div>;
}
