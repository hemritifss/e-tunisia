import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../shared/api';
import { TOPIC_BY_ID } from './endorsement-topics';

interface Entry {
    type: 'review' | 'trip' | 'endorse' | 'follow';
    createdAt: string;
    actor: { handle: string | null; fullName: string };
    target?: any;
}

function ago(iso: string): string {
    const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
}

function summarize(e: Entry): string {
    const who = e.actor?.fullName?.split(' ')[0] || 'Someone';
    if (e.type === 'review' && e.target?.placeName) return `${who} reviewed ${e.target.placeName}`;
    if (e.type === 'trip' && e.target?.title) return `${who} planned ${e.target.title}`;
    if (e.type === 'endorse' && e.target?.user?.fullName) {
        const topic = e.target.topic && TOPIC_BY_ID[e.target.topic]?.label;
        return `${who} endorsed ${e.target.user.fullName.split(' ')[0]}${topic ? ` for ${topic.toLowerCase()}` : ''}`;
    }
    if (e.type === 'follow' && e.target?.user?.fullName) return `${who} started following ${e.target.user.fullName.split(' ')[0]}`;
    return `${who} is exploring Tunisia`;
}

/**
 * "Tunisia is alive right now" pulse bar.
 *
 * Reads recent global activity, cycles one summary at a time on a 4s
 * interval. Dramatic + social — designed to make the home feed feel
 * inhabited, not empty.
 */
export function TunisiaPulse() {
    const { data } = useQuery({
        queryKey: ['tunisia-pulse'],
        queryFn: () => api.getGlobalActivity(8),
        staleTime: 60_000,
    });
    const entries: Entry[] = useMemo(() => Array.isArray(data) ? data : (data as any)?.data ?? [], [data]);
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        if (entries.length <= 1) return;
        const t = setInterval(() => setIdx((i) => (i + 1) % entries.length), 4000);
        return () => clearInterval(t);
    }, [entries.length]);

    const current = entries[idx];

    return (
        <section className="tunisia-pulse">
            <div className="tunisia-pulse-dot">
                <span className="tunisia-pulse-dot-core" />
                <span className="tunisia-pulse-dot-ring" />
            </div>
            <div className="tunisia-pulse-text">
                <strong>Tunisia is alive right now</strong>
                {current ? (
                    <a
                        key={idx}
                        className="tunisia-pulse-summary"
                        href={current.actor.handle ? `#/u/${current.actor.handle}` : '#/activity'}
                    >
                        <span className="tunisia-pulse-summary-text">{summarize(current)}</span>
                        <span className="tunisia-pulse-time">{ago(current.createdAt)} ago</span>
                    </a>
                ) : (
                    <span className="tunisia-pulse-summary tunisia-pulse-summary-loading">
                        Loading the latest moments…
                    </span>
                )}
            </div>
            <a className="tunisia-pulse-link" href="#/activity">See all →</a>
        </section>
    );
}
