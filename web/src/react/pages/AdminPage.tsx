import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Users, MapPin, Crown, Calendar, Lightbulb, MessageSquare, Lock, ExternalLink } from 'lucide-react';

interface PlatformStats {
    users?: number;
    places?: number;
    reviews?: number;
    subscriptions?: number;
    [k: string]: any;
}

const showToast = (opts: any) => (window as any).showToast?.(opts);

async function adminFetch<T = any>(path: string): Promise<T | null> {
    try {
        const token = localStorage.getItem('etunisia_token') || localStorage.getItem('auth_token');
        if (!token) return null;
        const r = await fetch(`/api/v1${path}`, { headers: { Authorization: `Bearer ${token}` } });
        if (r.status === 401 || r.status === 403) {
            return { __forbidden: true } as any;
        }
        if (!r.ok) return null;
        const json = await r.json();
        return (json && json.data !== undefined ? json.data : json) as T;
    } catch { return null; }
}

function StatCard({ label, value, icon, accent }: { label: string; value: number | string; icon: React.ReactNode; accent: string }) {
    return (
        <div className="admin-stat" style={{ '--admin-accent': accent } as React.CSSProperties}>
            <span className="admin-stat-icon">{icon}</span>
            <div>
                <strong>{typeof value === 'number' ? value.toLocaleString() : value}</strong>
                <span>{label}</span>
            </div>
        </div>
    );
}

function QueueCard({ icon, title, desc, href, accent }: { icon: React.ReactNode; title: string; desc: string; href: string; accent: string }) {
    return (
        <a className="admin-queue" href={href} style={{ '--admin-accent': accent } as React.CSSProperties}>
            <span className="admin-queue-icon">{icon}</span>
            <div className="admin-queue-body">
                <strong>{title}</strong>
                <span>{desc}</span>
            </div>
            <ExternalLink size={14} />
        </a>
    );
}

export default function AdminPage() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: () => adminFetch<PlatformStats>('/admin/stats'),
        staleTime: 60_000,
    });

    const forbidden = (stats as any)?.__forbidden;

    if (forbidden) {
        return (
            <main className="admin-page admin-locked">
                <div className="admin-locked-card">
                    <Lock size={40} />
                    <h1>Admins only</h1>
                    <p>This is the moderation hub. Your account doesn't have admin privileges — if you think that's wrong, email <a href="mailto:support@etunisia.com">support@etunisia.com</a>.</p>
                    <a className="btn primary" href="#/">Back to feed</a>
                </div>
            </main>
        );
    }

    return (
        <main className="admin-page">
            <header className="admin-header">
                <span className="admin-kicker"><Shield size={12} /> Admin</span>
                <h1>Platform moderation</h1>
                <p>Keep e-Tunisia honest, fast, and welcoming.</p>
            </header>

            <section className="admin-stats">
                {isLoading && !stats ? (
                    Array.from({ length: 4 }).map((_, i) => <div key={i} className="admin-stat admin-stat-skel" />)
                ) : (
                    <>
                        <StatCard label="Travelers"    value={stats?.users ?? '—'}         icon={<Users size={18} />}    accent="var(--mediterranean)" />
                        <StatCard label="Places"       value={stats?.places ?? '—'}        icon={<MapPin size={18} />}   accent="var(--terracotta)" />
                        <StatCard label="Reviews"      value={stats?.reviews ?? '—'}       icon={<MessageSquare size={18} />} accent="var(--gold)" />
                        <StatCard label="Subscribers"  value={stats?.subscriptions ?? '—'} icon={<Crown size={18} />}    accent="var(--violet)" />
                    </>
                )}
            </section>

            <section className="admin-section">
                <header><h2>Queues</h2></header>
                <div className="admin-queues">
                    <QueueCard
                        icon={<Users size={18} />}
                        title="Users"
                        desc="Search, change role, suspend"
                        href="#/admin/users"
                        accent="var(--mediterranean)"
                    />
                    <QueueCard
                        icon={<MapPin size={18} />}
                        title="Places"
                        desc="Approve submissions + featured slots"
                        href="#/admin/places"
                        accent="var(--terracotta)"
                    />
                    <QueueCard
                        icon={<MessageSquare size={18} />}
                        title="Reviews"
                        desc="Flagged reviews queue"
                        href="#/admin/reviews"
                        accent="var(--gold)"
                    />
                    <QueueCard
                        icon={<Crown size={18} />}
                        title="Subscriptions"
                        desc="Pro + Business cycles, refunds"
                        href="#/admin/subscriptions"
                        accent="var(--violet)"
                    />
                    <QueueCard
                        icon={<Calendar size={18} />}
                        title="Events"
                        desc="Approve event submissions"
                        href="#/admin/events"
                        accent="var(--rose)"
                    />
                    <QueueCard
                        icon={<Lightbulb size={18} />}
                        title="Tips"
                        desc="Moderate community travel tips"
                        href="#/admin/tips"
                        accent="var(--olive)"
                    />
                </div>
            </section>

            <section className="admin-fineprint">
                <p>
                    Every admin action is logged. If you suspend a user or remove content,
                    the user gets a friendly notification with a link to appeal.
                </p>
            </section>
        </main>
    );
}
