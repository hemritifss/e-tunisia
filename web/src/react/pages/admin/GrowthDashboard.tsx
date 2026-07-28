import '../../../styles/admin-growth.css';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity, Users, UserPlus, FileText, TrendingUp, BarChart3, Repeat, Lock,
} from 'lucide-react';
import { adminGet, ADMIN_FORBIDDEN } from './admin-api';

interface Growth {
  activeUsers: { dau: number; wau: number; mau: number };
  signups: { total: number; today: number; thisWeek: number; series: { day: string; count: number }[] };
  content: { posts: number; reviews: number; places: number };
  funnel: { signups: number; posted: number; conversionPct: number };
  retention: { d1: number; d7: number; d30: number };
}
type EventRow = { day: string; name: string; count: number; uniques: number };

function Tile({ label, value, icon, accent }: { label: string; value: number | string; icon: React.ReactNode; accent: string }) {
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

/** Last-N calendar-day keys (YYYY-MM-DD), oldest→newest. */
function lastDays(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(x.getDate() - i);
    out.push(x.toISOString().slice(0, 10));
  }
  return out;
}

/** Minimal inline-SVG bar chart — one bar per day. */
function DailyBars({ days, values, accent }: { days: string[]; values: number[]; accent: string }) {
  const max = Math.max(1, ...values);
  const W = 640, H = 140, pad = 4;
  const bw = (W - pad * 2) / values.length;
  return (
    <svg className="admin-growth-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Daily activity">
      {values.map((v, i) => {
        const h = Math.round((v / max) * (H - 24));
        return (
          <g key={i}>
            <rect x={pad + i * bw + 1} y={H - 18 - h} width={Math.max(1, bw - 2)} height={h}
              rx={2} fill={accent} opacity={0.85}>
              <title>{`${days[i]}: ${v.toLocaleString()}`}</title>
            </rect>
          </g>
        );
      })}
      {/* baseline */}
      <line x1={pad} y1={H - 18} x2={W - pad} y2={H - 18} stroke="var(--border)" strokeWidth={1} />
    </svg>
  );
}

function Sparkline({ values, accent }: { values: number[]; accent: string }) {
  const max = Math.max(1, ...values);
  const W = 120, H = 28;
  const step = values.length > 1 ? W / (values.length - 1) : W;
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(H - 2 - (v / max) * (H - 4)).toFixed(1)}`).join(' ');
  return (
    <svg className="admin-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={accent} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function RetentionRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="admin-growth-ret-row">
      <span className="admin-growth-ret-label">{label}</span>
      <div className="admin-growth-ret-track"><div className="admin-growth-ret-fill" style={{ width: `${Math.min(100, pct)}%` }} /></div>
      <span className="admin-growth-ret-val">{pct}%</span>
    </div>
  );
}

export function GrowthDashboard() {
  const { data: g, isLoading } = useQuery({
    queryKey: ['admin-growth'],
    queryFn: () => adminGet<Growth>('/analytics/growth'),
    staleTime: 60_000,
  });
  const { data: ev } = useQuery({
    queryKey: ['admin-events-summary'],
    queryFn: () => adminGet<EventRow[]>('/analytics/events/summary?days=30'),
    staleTime: 60_000,
  });

  if ((g as unknown) === ADMIN_FORBIDDEN) {
    return (
      <section className="admin-section admin-locked">
        <div className="admin-locked-icon"><Lock size={26} /></div>
        <h2>Admins only</h2>
        <p>You need an admin account to view growth analytics.</p>
      </section>
    );
  }

  const gd = (g && g !== ADMIN_FORBIDDEN ? g : null) as Growth | null;
  const rows: EventRow[] = Array.isArray(ev) ? ev : [];

  // Pivot events → per-day totals + per-event series.
  const days14 = lastDays(14);
  const byDay = new Map<string, number>();
  const byEvent = new Map<string, { count: number; series: Map<string, number> }>();
  for (const r of rows) {
    const day = String(r.day).slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + r.count);
    const e = byEvent.get(r.name) || { count: 0, series: new Map<string, number>() };
    e.count += r.count;
    e.series.set(day, (e.series.get(day) || 0) + r.count);
    byEvent.set(r.name, e);
  }
  const dailyTotals = days14.map((d) => byDay.get(d) || 0);
  const events = Array.from(byEvent.entries())
    .map(([name, v]) => ({ name, count: v.count, series: days14.map((d) => v.series.get(d) || 0) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return (
    <>
      <section className="admin-stats">
        {isLoading && !gd ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="admin-stat admin-stat-skel" />)
        ) : (
          <>
            <Tile label="Daily active" value={gd?.activeUsers.dau ?? '—'} icon={<Activity size={18} />} accent="var(--mediterranean)" />
            <Tile label="Weekly active" value={gd?.activeUsers.wau ?? '—'} icon={<Users size={18} />} accent="var(--terracotta)" />
            <Tile label="Monthly active" value={gd?.activeUsers.mau ?? '—'} icon={<TrendingUp size={18} />} accent="var(--violet)" />
            <Tile label="New today" value={gd?.signups.today ?? '—'} icon={<UserPlus size={18} />} accent="var(--warning)" />
          </>
        )}
      </section>

      {gd && (
        <div className="admin-growth-grid">
          <section className="admin-section">
            <header><h2><Activity size={16} /> Daily activity (14d)</h2></header>
            <DailyBars days={days14} values={dailyTotals} accent="var(--mediterranean)" />
          </section>

          <section className="admin-section">
            <header><h2><Repeat size={16} /> Retention</h2></header>
            <div className="admin-growth-ret">
              <RetentionRow label="D1" pct={gd.retention.d1} />
              <RetentionRow label="D7" pct={gd.retention.d7} />
              <RetentionRow label="D30" pct={gd.retention.d30} />
            </div>
            <p className="admin-growth-note">Share of new signups active again 1 / 7 / 30 days later.</p>
          </section>

          <section className="admin-section">
            <header><h2><FileText size={16} /> Signup → first post</h2></header>
            <div className="admin-growth-funnel">
              <div className="admin-growth-funnel-step">
                <strong>{gd.funnel.signups.toLocaleString()}</strong><span>signed up</span>
              </div>
              <div className="admin-growth-funnel-arrow">→ {gd.funnel.conversionPct}%</div>
              <div className="admin-growth-funnel-step">
                <strong>{gd.funnel.posted.toLocaleString()}</strong><span>posted ≥1</span>
              </div>
            </div>
          </section>

          <section className="admin-section">
            <header><h2><BarChart3 size={16} /> Content</h2></header>
            <div className="admin-stats admin-stats-compact">
              <Tile label="Posts" value={gd.content.posts} icon={<FileText size={16} />} accent="var(--mediterranean)" />
              <Tile label="Reviews" value={gd.content.reviews} icon={<Users size={16} />} accent="var(--warning)" />
              <Tile label="Places" value={gd.content.places} icon={<TrendingUp size={16} />} accent="var(--terracotta)" />
            </div>
          </section>
        </div>
      )}

      <section className="admin-section">
        <header><h2><BarChart3 size={16} /> Events (30 days)</h2></header>
        {events.length === 0 ? (
          <p className="admin-growth-note">No product events recorded yet — they’ll appear here as users act.</p>
        ) : (
          <table className="admin-growth-events">
            <thead><tr><th>Event</th><th>30d count</th><th>Trend (14d)</th></tr></thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.name}>
                  <td className="admin-growth-ev-name">{e.name}</td>
                  <td className="admin-growth-ev-count">{e.count.toLocaleString()}</td>
                  <td><Sparkline values={e.series} accent="var(--mediterranean)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

export default GrowthDashboard;
