import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { currentRoute } from '../../router';
import {
    Shield, Users, MapPin, Crown, Calendar, Lightbulb, MessageSquare, ExternalLink,
    LayoutDashboard, Check, Star, Trash2, ShieldCheck, ShieldOff, Sparkles, X,
    TrendingUp, Wallet, Clock, History,
} from 'lucide-react';
import AdminQueue, { AdminLocked, QueueConfig } from './admin/AdminQueue';
import { adminGet, adminMutate, ADMIN_FORBIDDEN } from './admin/admin-api';
import { GrowthDashboard } from './admin/GrowthDashboard';

interface PlatformStats { users?: number; places?: number; reviews?: number; subscriptions?: number; pendingPlaces?: number; [k: string]: any }
interface Analytics { mrr: number; arr: number; activeSubscriptions: number; pendingSubscriptions: number; conversionRate: number; paidUsers: number; byPlan: Record<string, { count: number; revenue: number }>; }

// ─── small presentational helpers ───────────────────────────────────────────────
function Pill({ text, tone }: { text: string; tone?: string }) {
    return <span className={`admin-pill ${tone || ''}`}>{text}</span>;
}
const fmtDate = (d: any) => (d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const planTone = (p: string) => (p === 'business' ? 'violet' : p === 'premium' ? 'gold' : p === 'admin' ? 'sky' : 'muted');
const statusTone = (s: string) => (s === 'active' ? 'green' : s === 'pending' ? 'amber' : 'muted');
const truncate = (s: string, n = 64) => (s && s.length > n ? `${s.slice(0, n)}…` : s || '');

// ─── queue configs ───────────────────────────────────────────────────────────────
// Built per-viewer: the "Make admin" action only appears for super-admins.
function buildQueues(isSuperAdmin: boolean): Record<string, QueueConfig> {
  return {
    users: {
        key: 'users', title: 'Users', subtitle: 'Search, change role, suspend', endpoint: '/admin/users', paginated: true,
        columns: [
            { header: 'Name', render: (u) => (<div className="admin-cell-stack"><strong>{u.fullName || '—'}</strong>{u.handle && <span>@{u.handle}</span>}</div>) },
            { header: 'Email', render: (u) => u.email },
            { header: 'Plan', render: (u) => <Pill text={u.plan || 'free'} tone={planTone(u.plan)} /> },
            { header: 'Role', render: (u) => <Pill text={u.role || 'user'} tone={u.role === 'admin' ? 'sky' : 'muted'} /> },
            { header: 'Status', render: (u) => <Pill text={u.isActive === false ? 'suspended' : 'active'} tone={u.isActive === false ? 'muted' : 'green'} /> },
            { header: 'Joined', render: (u) => fmtDate(u.createdAt) },
        ],
        actions: [
            {
                label: (u) => (u.role === 'admin' || u.role === 'superadmin' ? 'Remove admin' : 'Make admin'),
                icon: <ShieldCheck size={13} />,
                show: () => isSuperAdmin, // super-admin only — prevents admin self-minting
                confirm: (u) => (u.role === 'admin' || u.role === 'superadmin' ? `Remove admin from ${u.fullName}?` : `Grant admin to ${u.fullName}?`),
                run: (u) => adminMutate(`/admin/users/${u.id}/role`, 'PATCH', { role: (u.role === 'admin' || u.role === 'superadmin') ? 'user' : 'admin' }),
            },
            { label: (u) => (u.isActive === false ? 'Restore' : 'Suspend'), icon: <ShieldOff size={13} />, variant: 'danger', show: (u) => u.role !== 'admin' && u.role !== 'superadmin', confirm: (u) => (u.isActive === false ? '' : `Suspend ${u.fullName}?`), run: (u) => adminMutate(`/admin/users/${u.id}/${u.isActive === false ? 'unban' : 'ban'}`, 'PATCH') },
        ],
    },
    places: {
        key: 'places', title: 'Places', subtitle: 'Approve submissions + featured slots', endpoint: '/admin/places', paginated: true,
        filters: [{ key: 'all', label: 'All' }, { key: 'pending', label: 'Pending', query: { pendingOnly: 'true' } }],
        columns: [
            { header: 'Name', render: (p) => <strong>{p.name}</strong> },
            { header: 'Where', render: (p) => [p.city, p.governorate].filter(Boolean).join(' · ') || '—' },
            { header: 'Status', render: (p) => <Pill text={p.isApproved ? 'approved' : 'pending'} tone={p.isApproved ? 'green' : 'amber'} /> },
            { header: 'Featured', render: (p) => (p.isFeatured ? <Pill text="featured" tone="gold" /> : '—') },
        ],
        actions: [
            { label: 'Approve', icon: <Check size={13} />, variant: 'primary', show: (p) => !p.isApproved, run: (p) => adminMutate(`/admin/places/${p.id}/approve`, 'PATCH') },
            { label: (p) => (p.isFeatured ? 'Unfeature' : 'Feature'), icon: <Star size={13} />, run: (p) => adminMutate(`/admin/places/${p.id}/feature`, 'PATCH') },
            { label: 'Delete', icon: <Trash2 size={13} />, variant: 'danger', confirm: (p) => `Delete "${p.name}"? This cannot be undone.`, run: (p) => adminMutate(`/admin/places/${p.id}`, 'DELETE') },
        ],
    },
    reviews: {
        key: 'reviews', title: 'Reviews', subtitle: 'Moderate community reviews', endpoint: '/admin/reviews', paginated: true,
        columns: [
            { header: 'Place', render: (r) => <strong>{r.place?.name || '—'}</strong> },
            { header: 'Rating', render: (r) => (<span className="admin-rating"><Star size={12} /> {Number(r.rating).toFixed(1)}</span>) },
            { header: 'Comment', render: (r) => truncate(r.comment) },
            { header: 'Author', render: (r) => r.user?.fullName || '—' },
            { header: 'Date', render: (r) => fmtDate(r.createdAt) },
        ],
        actions: [
            { label: 'Delete', icon: <Trash2 size={13} />, variant: 'danger', confirm: 'Delete this review?', run: (r) => adminMutate(`/admin/reviews/${r.id}`, 'DELETE') },
        ],
    },
    subscriptions: {
        key: 'subscriptions', title: 'Subscriptions', subtitle: 'Confirm manual payments · cycles · refunds', endpoint: '/admin/subscriptions',
        columns: [
            { header: 'Member', render: (s) => (<div className="admin-cell-stack"><strong>{s.user?.fullName || '—'}</strong><span>{s.user?.email}</span></div>) },
            { header: 'Plan', render: (s) => <Pill text={s.plan} tone={planTone(s.plan)} /> },
            { header: 'Amount', render: (s) => `${Number(s.amount).toLocaleString()} ${s.currency || 'TND'}` },
            { header: 'Method', render: (s) => s.paymentMethod || '—' },
            { header: 'Status', render: (s) => <Pill text={s.status} tone={statusTone(s.status)} /> },
            { header: 'Date', render: (s) => fmtDate(s.createdAt) },
        ],
        actions: [
            { label: 'Confirm', icon: <Check size={13} />, variant: 'primary', show: (s) => s.status === 'pending', confirm: (s) => `Confirm payment and activate ${s.plan} for ${s.user?.fullName}?`, run: (s) => adminMutate(`/admin/subscriptions/${s.id}/confirm`, 'PATCH') },
            { label: 'Reject', icon: <X size={13} />, variant: 'danger', show: (s) => s.status === 'pending' || s.status === 'active', confirm: 'Cancel this subscription?', run: (s) => adminMutate(`/admin/subscriptions/${s.id}/reject`, 'PATCH') },
        ],
    },
    events: {
        key: 'events', title: 'Events', subtitle: 'Approve event submissions', endpoint: '/admin/events',
        columns: [
            { header: 'Title', render: (e) => <strong>{e.title}</strong> },
            { header: 'Place', render: (e) => e.place?.name || '—' },
            { header: 'Organizer', render: (e) => e.organizer?.fullName || '—' },
            { header: 'Starts', render: (e) => fmtDate(e.startDate) },
            { header: 'Status', render: (e) => <Pill text={e.isActive ? 'active' : 'hidden'} tone={e.isActive ? 'green' : 'muted'} /> },
        ],
        actions: [
            { label: (e) => (e.isActive ? 'Hide' : 'Activate'), icon: <Calendar size={13} />, run: (e) => adminMutate(`/admin/events/${e.id}/toggle`, 'PATCH') },
        ],
    },
    tips: {
        key: 'tips', title: 'Tips', subtitle: 'Moderate community travel tips', endpoint: '/admin/tips',
        columns: [
            { header: 'Title', render: (t) => <strong>{t.title}</strong> },
            { header: 'Author', render: (t) => t.author?.fullName || '—' },
            { header: 'Category', render: (t) => t.category || '—' },
            { header: 'Status', render: (t) => <Pill text={t.isApproved ? 'approved' : 'pending'} tone={t.isApproved ? 'green' : 'amber'} /> },
            { header: 'Date', render: (t) => fmtDate(t.createdAt) },
        ],
        actions: [
            { label: (t) => (t.isApproved ? 'Unapprove' : 'Approve'), icon: <Check size={13} />, run: (t) => adminMutate(`/admin/tips/${t.id}/toggle`, 'PATCH') },
        ],
    },
    audit: {
        key: 'audit', title: 'Audit log', subtitle: 'Every admin action, who did it, when', endpoint: '/admin/audit', paginated: true,
        columns: [
            { header: 'Actor', render: (e) => (<div className="admin-cell-stack"><strong>{e.actorName || '—'}</strong>{e.actorEmail && <span>{e.actorEmail}</span>}</div>) },
            { header: 'Action', render: (e) => <code className="admin-code">{e.action}</code> },
            { header: 'Target', render: (e) => (e.targetType ? `${e.targetType}${e.targetId ? ` #${String(e.targetId).slice(0, 8)}` : ''}` : '—') },
            { header: 'When', render: (e) => (e.createdAt ? new Date(e.createdAt).toLocaleString() : '—') },
        ],
    },
  };
}

const SUBNAV: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: '', label: 'Overview', icon: <LayoutDashboard size={15} /> },
    { key: 'growth', label: 'Growth', icon: <TrendingUp size={15} /> },
    { key: 'users', label: 'Users', icon: <Users size={15} /> },
    { key: 'places', label: 'Places', icon: <MapPin size={15} /> },
    { key: 'reviews', label: 'Reviews', icon: <MessageSquare size={15} /> },
    { key: 'subscriptions', label: 'Subscriptions', icon: <Crown size={15} /> },
    { key: 'events', label: 'Events', icon: <Calendar size={15} /> },
    { key: 'tips', label: 'Tips', icon: <Lightbulb size={15} /> },
    { key: 'audit', label: 'Audit log', icon: <History size={15} /> },
];

function currentSub(): string {
    const m = (typeof window !== 'undefined' ? currentRoute() : '').match(/^\/admin\/?([a-z]*)/i);
    return (m?.[1] || '').toLowerCase();
}

// ─── hub ───────────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent }: { label: string; value: number | string; icon: React.ReactNode; accent: string }) {
    return (
        <div className="admin-stat" style={{ '--admin-accent': accent } as React.CSSProperties}>
            <span className="admin-stat-icon">{icon}</span>
            <div><strong>{typeof value === 'number' ? value.toLocaleString() : value}</strong><span>{label}</span></div>
        </div>
    );
}

function QueueCard({ icon, title, desc, href, accent, badge }: { icon: React.ReactNode; title: string; desc: string; href: string; accent: string; badge?: number }) {
    return (
        <a className="admin-queue" href={href} style={{ '--admin-accent': accent } as React.CSSProperties}>
            <span className="admin-queue-icon">{icon}</span>
            <div className="admin-queue-body"><strong>{title}{badge ? <span className="admin-queue-badge">{badge}</span> : null}</strong><span>{desc}</span></div>
            <ExternalLink size={14} />
        </a>
    );
}

function Hub() {
    const { data: stats, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminGet<PlatformStats>('/admin/stats'), staleTime: 60_000 });
    const { data: analytics } = useQuery({ queryKey: ['admin-analytics'], queryFn: () => adminGet<Analytics>('/admin/analytics'), staleTime: 60_000 });

    if (stats === ADMIN_FORBIDDEN) return <AdminLocked />;
    const a = (analytics && analytics !== ADMIN_FORBIDDEN ? analytics : null) as Analytics | null;
    // The ADMIN_FORBIDDEN case already returned above, so stats is narrowed here.
    const s = stats ?? null;

    return (
        <>
            <section className="admin-stats">
                {isLoading && !s ? (
                    Array.from({ length: 4 }).map((_, i) => <div key={i} className="admin-stat admin-stat-skel" />)
                ) : (
                    <>
                        <StatCard label="Travelers" value={s?.users ?? '—'} icon={<Users size={18} />} accent="var(--mediterranean)" />
                        <StatCard label="Places" value={s?.places ?? '—'} icon={<MapPin size={18} />} accent="var(--terracotta)" />
                        <StatCard label="Reviews" value={s?.reviews ?? '—'} icon={<MessageSquare size={18} />} accent="var(--gold)" />
                        <StatCard label="Subscribers" value={s?.subscriptions ?? a?.activeSubscriptions ?? '—'} icon={<Crown size={18} />} accent="var(--violet)" />
                    </>
                )}
            </section>

            {a && (
                <section className="admin-section">
                    <header><h2>Revenue</h2></header>
                    <div className="admin-stats">
                        <StatCard label="MRR" value={`${a.mrr.toLocaleString()} TND`} icon={<Wallet size={18} />} accent="var(--olive)" />
                        <StatCard label="ARR (run-rate)" value={`${a.arr.toLocaleString()} TND`} icon={<TrendingUp size={18} />} accent="var(--mediterranean)" />
                        <StatCard label="Pending payments" value={a.pendingSubscriptions} icon={<Clock size={18} />} accent="var(--gold)" />
                        <StatCard label="Free → Paid" value={`${a.conversionRate}%`} icon={<Sparkles size={18} />} accent="var(--violet)" />
                    </div>
                </section>
            )}

            <section className="admin-section">
                <header><h2>Queues</h2></header>
                <div className="admin-queues">
                    <QueueCard icon={<Users size={18} />} title="Users" desc="Search, change role, suspend" href="#/admin/users" accent="var(--mediterranean)" />
                    <QueueCard icon={<MapPin size={18} />} title="Places" desc="Approve submissions + featured slots" href="#/admin/places" accent="var(--terracotta)" badge={s?.pendingPlaces} />
                    <QueueCard icon={<MessageSquare size={18} />} title="Reviews" desc="Moderate community reviews" href="#/admin/reviews" accent="var(--gold)" />
                    <QueueCard icon={<Crown size={18} />} title="Subscriptions" desc="Confirm manual payments + refunds" href="#/admin/subscriptions" accent="var(--violet)" badge={a?.pendingSubscriptions} />
                    <QueueCard icon={<Calendar size={18} />} title="Events" desc="Approve event submissions" href="#/admin/events" accent="var(--rose)" />
                    <QueueCard icon={<Lightbulb size={18} />} title="Tips" desc="Moderate community travel tips" href="#/admin/tips" accent="var(--olive)" />
                    <QueueCard icon={<History size={18} />} title="Audit log" desc="Every admin action, who did it, when" href="#/admin/audit" accent="var(--text-secondary)" />
                </div>
            </section>

            <section className="admin-fineprint">
                <p>Every moderation action takes effect immediately. Confirming a pending subscription activates that member's plan.</p>
            </section>
        </>
    );
}

export default function AdminPage() {
    const { data: me } = useQuery({ queryKey: ['admin-me'], queryFn: () => adminGet<{ isSuperAdmin?: boolean }>('/admin/me'), staleTime: 5 * 60_000 });
    const isSuperAdmin = !!(me && me !== ADMIN_FORBIDDEN && (me as any).isSuperAdmin);
    const sub = currentSub();
    const config = sub && sub !== 'growth' ? buildQueues(isSuperAdmin)[sub] : null;
    const isGrowth = sub === 'growth';

    return (
        <main className="admin-page">
            <header className="admin-header">
                <span className="admin-kicker"><Shield size={12} /> Admin</span>
                <h1>{config ? config.title : isGrowth ? 'Growth analytics' : 'Platform supervision'}</h1>
                <p>{config ? config.subtitle : isGrowth ? 'Real DAU/WAU, retention, and the signup → first-post funnel.' : 'Keep e-Tunisia honest, fast, and welcoming.'}</p>
                <nav className="admin-subnav">
                    {SUBNAV.map((n) => (
                        <a key={n.key} href={`#/admin${n.key ? `/${n.key}` : ''}`} className={sub === n.key ? 'active' : ''}>
                            {n.icon}<span>{n.label}</span>
                        </a>
                    ))}
                </nav>
            </header>

            {config ? <AdminQueue config={config} /> : isGrowth ? <GrowthDashboard /> : <Hub />}
        </main>
    );
}
