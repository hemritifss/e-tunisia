import '../../styles/owner-earnings.css';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase, Check, Sparkles, Inbox, BarChart3, MapPin, TrendingUp, Target, Mail, Phone,
  MessageCircle, Star, Package, X, Plus, Pencil, Trash2, ExternalLink, Coins, Wallet,
} from 'lucide-react';
import * as api from '../../api';
import { showToast } from '../../ui-utils';
import { useMoney } from '../lib/useCurrency';
import TunisiaLoader from '../components/TunisiaLoader';

// Migrated from vanilla pages/owner.ts — business dashboard: stats, inquiry
// pipeline, lead-source breakdown, listings, + boost/package CRUD modals.

type Status = 'new' | 'contacted' | 'quoted' | 'booked' | 'closed';
const STATUS_ORDER: Status[] = ['new', 'contacted', 'quoted', 'booked', 'closed'];

function fmtDate(d: string | null | undefined): string {
  if (!d) return '';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '' : dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function whatsapp(phone: string): string {
  const digits = String(phone).replace(/\D+/g, '');
  const cc = digits.startsWith('216') ? digits : (digits.length === 8 ? '216' + digits : digits);
  return `https://wa.me/${cc}`;
}
function sourceLabel(s: string): string {
  if (s === 'place-detail') return 'Direct (place page)';
  if (s === 'package') return 'Package CTA';
  if (s === 'post') return 'Social post';
  if (s === 'direct') return 'Direct';
  return s;
}

function Empty({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return <div className="empty-state">{icon}<h3>{title}</h3><p>{body}</p></div>;
}

// ── Stats ──
function StatsTiles() {
  const { data: s, isLoading, isError } = useQuery({ queryKey: ['inquiry-stats'], queryFn: () => api.getInquiryStats() });
  if (isLoading) return <section className="owner-stats">{[0, 1, 2, 3].map((i) => <div className="owner-stat-skel" key={i} />)}</section>;
  if (isError || !s) return <section className="owner-stats"><p className="text-muted" style={{ padding: 'var(--space-3)' }}>Could not load stats.</p></section>;
  const tiles: Array<[string, string | number, React.ReactNode]> = [
    ['Listings', s.placeCount, <MapPin />],
    ['New this week', s.last7Days, <TrendingUp />],
    ['Open inquiries', (s.new || 0) + (s.contacted || 0) + (s.quoted || 0), <Inbox />],
    ['Conversion', s.conversionRate + '%', <Target />],
  ];
  return (
    <section className="owner-stats">
      {tiles.map(([label, val, icon], i) => (
        <div className="owner-stat" key={i}>
          <div className="owner-stat-icon">{icon}</div>
          <div className="owner-stat-meta"><div className="owner-stat-num">{val}</div><div className="owner-stat-label">{label}</div></div>
        </div>
      ))}
    </section>
  );
}

// ── Inquiry inbox ──
function InquiryCard({ inq }: { inq: any }) {
  const queryClient = useQueryClient();
  const place = inq.place || {};
  const [status, setStatus] = useState<Status>(inq.status || 'new');
  const dateRange = inq.dateFrom || inq.dateTo ? `${fmtDate(inq.dateFrom)}${inq.dateTo ? ' -> ' + fmtDate(inq.dateTo) : ''}` : 'Dates flexible';
  const party = `${inq.partySize || 1} ${inq.partySize === 1 ? 'traveler' : 'travelers'}`;
  const budget = inq.budget ? ` - ${inq.budget} ${inq.currency || 'TND'}` : '';

  const setPipe = async (target: Status) => {
    const prev = status;
    setStatus(target);
    try {
      await api.updateInquiryStatus(inq.id, target);
      showToast(`Marked as ${target}`);
      queryClient.invalidateQueries({ queryKey: ['inquiry-stats'] });
    } catch (e: any) {
      setStatus(prev);
      showToast(e?.message || 'Could not update status', { type: 'error' });
    }
  };

  return (
    <div className="inquiry-card owner-inquiry-card" data-inquiry-id={inq.id}>
      {place.coverImage ? <img className="inquiry-card-thumb" src={api.getImageUrl(place.coverImage)} loading="lazy" alt="" /> : <div className="inquiry-card-thumb" />}
      <div className="inquiry-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <h3 className="inquiry-card-title">{inq.name || 'Traveler'} {'->'} {place.name || 'place'}</h3>
          <span className="inquiry-card-meta">{timeAgo(inq.createdAt)}</span>
        </div>
        <div className="inquiry-card-meta">{inq.email}{inq.phone ? ' - ' + inq.phone : ''} - {party} - {dateRange}{budget}</div>
        <p className="inquiry-card-msg">{inq.message || ''}</p>
        <div className="owner-inquiry-actions">
          {inq.email && <a className="btn btn-outline btn-sm" href={`mailto:${inq.email}?subject=${encodeURIComponent('Re: your trip to ' + (place.name || 'Tunisia'))}`}><Mail /> Email</a>}
          {inq.phone && <a className="btn btn-outline btn-sm" href={`tel:${inq.phone}`}><Phone /> Call</a>}
          {inq.phone && <a className="btn btn-outline btn-sm" target="_blank" rel="noopener" href={whatsapp(inq.phone)}><MessageCircle /> WhatsApp</a>}
        </div>
        <div className="inquiry-status-pipeline">
          {STATUS_ORDER.map((st) => (
            <button key={st} type="button" className={`inquiry-status-pill ${st}${status === st ? ' active' : ''}`} onClick={() => setPipe(st)}>{st}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Inbox_() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['received-inquiries'],
    queryFn: async () => { const res = await api.listReceivedInquiries(1, 20); return Array.isArray(res?.data) ? res.data : []; },
  });
  if (isLoading) return <div className="favorites-loading"><TunisiaLoader size={52} /></div>;
  if (isError) return <p className="text-muted" style={{ padding: 'var(--space-3)' }}>Could not load inquiries.</p>;
  if (!data || data.length === 0) return <Empty icon={<Inbox />} title="No inquiries yet" body="Once travelers send a quote request, they'll appear here with one-tap contact + status tracking." />;
  return <>{data.map((r: any) => <InquiryCard key={r.id} inq={r} />)}</>;
}

// ── Lead-source breakdown ──
function Breakdown() {
  const { data, isLoading } = useQuery({ queryKey: ['inquiry-breakdown'], queryFn: () => api.getInquiryBreakdown().catch(() => null) });
  if (isLoading) return <div className="favorites-loading"><TunisiaLoader size={52} /></div>;
  const hasSources = (data?.sources?.length || 0) > 0;
  const hasPackages = (data?.packages?.length || 0) > 0;
  if (!data || (!hasSources && !hasPackages)) return <Empty icon={<BarChart3 />} title="No data yet" body="Once travelers submit inquiries, you'll see which sources convert best here." />;
  const bars = (rows: any[], labelOf: (r: any) => string) => {
    const max = Math.max(...rows.map((r) => r.total), 1);
    return rows.map((r, i) => (
      <div className="breakdown-row" key={i}>
        <div className="breakdown-label">{labelOf(r)}</div>
        <div className="breakdown-bar"><div className="breakdown-bar-fill" style={{ width: `${Math.round((r.total / max) * 100)}%` }} /></div>
        <div className="breakdown-num">{r.total}{r.booked ? ` - ${r.booked} booked` : ''}</div>
      </div>
    ));
  };
  return (
    <div className="owner-breakdown-grid">
      {hasSources && <div className="owner-breakdown-card"><h3>Lead sources</h3>{bars(data.sources, (r) => sourceLabel(r.source))}</div>}
      {hasPackages && <div className="owner-breakdown-card"><h3>Top packages</h3>{bars(data.packages, (r) => r.title)}</div>}
    </div>
  );
}

// ── Package editor modal ──
function PackageEditorModal({ place, pkg, onClose, onSaved }: { place: any; pkg: any | null; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => { document.body.style.overflow = 'hidden'; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; }; }, [onClose]);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const includesRaw = String(fd.get('includes') || '');
    const payload: any = {
      title: String(fd.get('title') || '').trim(), description: String(fd.get('description') || '').trim(),
      pricePerPerson: Number(fd.get('pricePerPerson') || 0), currency: String(fd.get('currency') || 'TND'),
      durationDays: Number(fd.get('durationDays') || 1), minPartySize: Number(fd.get('minPartySize') || 1), maxPartySize: Number(fd.get('maxPartySize') || 12),
      includes: includesRaw ? includesRaw.split(',').map((s) => s.trim()).filter(Boolean) : [],
    };
    const badge = String(fd.get('badge') || '').trim();
    if (badge) payload.badge = badge;
    setBusy(true);
    try {
      if (pkg) await api.updatePackage(pkg.id, payload); else await api.createPackage(place.id, payload);
      showToast(pkg ? 'Package updated' : 'Package added');
      onSaved();
      onClose();
    } catch (err: any) {
      setBusy(false);
      showToast(err?.message || (Array.isArray(err?.details) ? err.details.join(', ') : '') || 'Could not save', { type: 'error' });
    }
  };
  return createPortal(
    <div className="sheet-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet inquiry-modal" role="dialog">
        <header className="sheet-head">
          <div><h3>{pkg ? 'Edit package' : 'Add a package'}</h3><p className="inquiry-sub">{place.name}</p></div>
          <button className="sheet-close" onClick={onClose}><X /></button>
        </header>
        <form className="inquiry-form" onSubmit={submit}>
          <label className="inquiry-full"><span>Title *</span><input name="title" type="text" required maxLength={200} defaultValue={pkg?.title || ''} placeholder="e.g. Sunset camel ride + Berber dinner" /></label>
          <label className="inquiry-full"><span>Description *</span><textarea name="description" rows={3} required minLength={5} maxLength={4000} defaultValue={pkg?.description || ''} placeholder="What does the traveler experience?" /></label>
          <div className="inquiry-row">
            <label><span>Price / person *</span><input name="pricePerPerson" type="number" min={0} step={5} required defaultValue={pkg?.pricePerPerson ?? ''} /></label>
            <label><span>Currency</span><select name="currency" defaultValue={pkg?.currency || 'TND'}><option value="TND">TND</option><option value="EUR">EUR</option><option value="USD">USD</option></select></label>
          </div>
          <div className="inquiry-row">
            <label><span>Duration (days)</span><input name="durationDays" type="number" min={1} max={60} defaultValue={pkg?.durationDays || 1} /></label>
            <label><span>Badge</span><input name="badge" type="text" maxLength={60} defaultValue={pkg?.badge || ''} placeholder="Bestseller, New, Limited…" /></label>
          </div>
          <div className="inquiry-row">
            <label><span>Min travelers</span><input name="minPartySize" type="number" min={1} max={50} defaultValue={pkg?.minPartySize || 1} /></label>
            <label><span>Max travelers</span><input name="maxPartySize" type="number" min={1} max={100} defaultValue={pkg?.maxPartySize || 12} /></label>
          </div>
          <label className="inquiry-full"><span>Includes (comma-separated)</span><input name="includes" type="text" defaultValue={Array.isArray(pkg?.includes) ? pkg.includes.join(', ') : ''} placeholder="Hotel pickup, English guide, All meals" /></label>
          <div className="inquiry-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Save</button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

// ── Package manager modal ──
function PackageManagerModal({ place, onClose }: { place: any; onClose: () => void }) {
  const [editor, setEditor] = useState<{ pkg: any | null } | null>(null);
  useEffect(() => { document.body.style.overflow = 'hidden'; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; }; }, [onClose]);
  const { data: pkgs, isLoading, refetch } = useQuery({ queryKey: ['place-packages', place.id], queryFn: () => api.listPackagesForPlace(place.id).catch(() => [] as any[]) });

  const del = async (pkg: any) => {
    if (!confirm(`Delete "${pkg.title}"?`)) return;
    try { await api.deletePackage(pkg.id); showToast('Package removed'); refetch(); }
    catch (e: any) { showToast(e?.message || 'Could not delete', { type: 'error' }); }
  };

  return createPortal(
    <div className="sheet-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet pkg-mgr-modal" role="dialog">
        <header className="sheet-head">
          <div><h3>Tour packages</h3><p className="inquiry-sub">{place.name}</p></div>
          <button className="sheet-close" onClick={onClose}><X /></button>
        </header>
        <div className="pkg-mgr-body">
          <div className="pkg-mgr-list">
            {isLoading ? <div className="favorites-loading"><TunisiaLoader size={52} /></div>
              : !pkgs || pkgs.length === 0 ? <Empty icon={<Package />} title="No packages yet" body="Add your first bookable experience to convert inquiries into bookings." />
                : pkgs.map((pkg: any) => (
                  <div className="pkg-mgr-row" key={pkg.id}>
                    <div className="pkg-mgr-row-info">
                      <div className="pkg-mgr-row-title">{pkg.title}</div>
                      <div className="pkg-mgr-row-meta">{pkg.pricePerPerson} {pkg.currency || 'TND'} / person - {pkg.durationDays || 1}d - {pkg.minPartySize}-{pkg.maxPartySize} pax</div>
                    </div>
                    <div className="pkg-mgr-row-actions">
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditor({ pkg })}><Pencil /></button>
                      <button className="btn btn-ghost btn-sm" type="button" style={{ color: 'var(--brand)' }} onClick={() => del(pkg)}><Trash2 /></button>
                    </div>
                  </div>
                ))}
          </div>
          <button className="btn btn-primary pkg-mgr-new" type="button" onClick={() => setEditor({ pkg: null })}><Plus /> Add package</button>
        </div>
      </div>
      {editor && <PackageEditorModal place={place} pkg={editor.pkg} onClose={() => setEditor(null)} onSaved={() => refetch()} />}
    </div>,
    document.body,
  );
}

// ── Boost modal ──
function BoostModal({ place, onClose, onSuccess }: { place: any; onClose: () => void; onSuccess: () => void }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => { document.body.style.overflow = 'hidden'; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; }; }, [onClose]);
  const { data } = useQuery({
    queryKey: ['boost-data'],
    queryFn: async () => {
      const [tiers, bal] = await Promise.all([api.getBoostTiers().catch(() => []), api.getMyCredits().catch(() => ({ balance: 0 }))]);
      return { tiers: Array.isArray(tiers) ? tiers : [], balance: Number((bal as any)?.balance || 0) };
    },
  });
  const tiers = data?.tiers || [];
  const balance = data?.balance || 0;
  const popular = tiers.length >= 2 ? tiers[1].days : 7;

  const boost = async (t: any) => {
    if (balance < t.credits) { showToast('Not enough credits — top up first', { type: 'error' }); return; }
    if (!confirm(`Boost "${place.name}" for ${t.label} (${t.credits} credits)?`)) return;
    setBusy(true);
    try {
      const res = await api.boostListing(place.id, t.days);
      showToast(`Boost active until ${new Date(res.boostExpiresAt).toLocaleDateString()}`);
      onSuccess();
      onClose();
    } catch (err: any) { setBusy(false); showToast(err?.message || 'Could not boost', { type: 'error' }); }
  };

  return createPortal(
    <div className="sheet-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet boost-modal" role="dialog">
        <header className="sheet-head">
          <div><h3>Boost this listing</h3><p className="inquiry-sub">{place.name}</p></div>
          <button className="sheet-close" onClick={onClose}><X /></button>
        </header>
        <div className="boost-body">
          <p className="boost-intro">Boosted listings show first in the Featured carousel on the home feed and get a sparkle badge on the listing page. Boosts stack if you already have one active.</p>
          <div className="boost-tiers">
            {tiers.map((t: any) => (
              <button key={t.days} type="button" disabled={busy} className={`boost-tier ${balance < t.credits ? 'is-locked' : ''} ${t.days === popular ? 'is-popular' : ''}`} onClick={() => boost(t)}>
                {t.days === popular && <span className="boost-tier-tag">Most popular</span>}
                <div className="boost-tier-duration">{t.label}</div>
                <div className="boost-tier-price"><strong>{t.credits}</strong> credits</div>
                <div className="boost-tier-sub">{Math.round(t.credits / t.days)} credits / day</div>
              </button>
            ))}
          </div>
          <div className="boost-balance"><Coins /> Balance: {balance.toLocaleString()} credits <a href="#/credits" style={{ marginLeft: 8 }}>Top up</a></div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Listing card ──
function PlaceCard({ p, onBoost, onPackages }: { p: any; onBoost: () => void; onPackages: () => void }) {
  const boosted = p.isBoosted && p.boostExpiresAt && new Date(p.boostExpiresAt) > new Date();
  return (
    <div className="owner-place-card">
      <a href={`#/place/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        {p.coverImage ? <img src={api.getImageUrl(p.coverImage)} alt="" loading="lazy" /> : <div className="owner-place-thumb-fallback" />}
      </a>
      <div className="owner-place-meta">
        <div className="owner-place-name">{p.name}</div>
        <div className="owner-place-sub">{p.city || ''}{p.governorate ? ' - ' + p.governorate : ''}</div>
        <div className="owner-place-stats">{p.viewCount || 0} views · {p.reviewCount || 0} reviews · <span className="owner-place-stat-rating"><Star /> {Number(p.rating || 0).toFixed(1)}</span></div>
        {boosted && <div className="owner-place-boost-badge"><Sparkles /> Boosted until {new Date(p.boostExpiresAt).toLocaleDateString()}</div>}
        <div className="owner-place-actions">
          <button className="btn btn-primary btn-sm" type="button" onClick={onBoost}><Sparkles /> {p.isBoosted ? 'Extend boost' : 'Boost'}</button>
          <button className="btn btn-outline btn-sm" type="button" onClick={onPackages}><Package /> Packages</button>
          <a className="btn btn-ghost btn-sm" href={`#/place/${p.id}`}><ExternalLink /> View</a>
        </div>
      </div>
    </div>
  );
}

function Listings({ onBoost, onPackages }: { onBoost: (p: any) => void; onPackages: (p: any) => void }) {
  const { data: places, isLoading, isError } = useQuery({ queryKey: ['my-places'], queryFn: () => api.listMyPlaces().catch(() => [] as any[]) });
  if (isLoading) return <div className="favorites-loading"><TunisiaLoader size={52} /></div>;
  if (isError) return <p className="text-muted" style={{ padding: 'var(--space-3)' }}>Could not load listings.</p>;
  if (!places || places.length === 0) return <Empty icon={<MapPin />} title="You don't host any listings yet" body="List your hotel, tour, or experience and start receiving direct inquiries." />;
  return <>{places.map((p: any) => <PlaceCard key={p.id} p={p} onBoost={() => onBoost(p)} onPackages={() => onPackages(p)} />)}</>;
}

// ── Plan banner ──
function PlanBanner() {
  const { data: info } = useQuery({ queryKey: ['my-plan-owner'], queryFn: () => (api as any).getMyPlan?.().catch(() => null) ?? Promise.resolve(null) });
  const plan: 'free' | 'premium' | 'business' = info?.plan || 'free';
  if (plan === 'business') {
    return <span className="owner-tier-chip is-business"><Check /> Verified Business</span>;
  }
  return (
    <>
      {plan === 'premium' && <span className="owner-tier-chip is-pro"><Sparkles /> Pro Traveler</span>}
      <a className="pro-gate-card is-business" href="#/pro">
        <span className="pro-gate-card-icon"><Briefcase /></span>
        <div className="pro-gate-card-body">
          <strong>Owner Dashboard is a Business feature</strong>
          <span>List places, claim verified status, get inquiry analytics + boost slots, and respond to reviews officially. Free + Pro travelers can still see the surface read-only.</span>
        </div>
        <span className="pro-gate-card-cta">Upgrade →</span>
      </a>
    </>
  );
}

function Earnings() {
  const money = useMoney();
  const { data, isLoading } = useQuery({ queryKey: ['owner-earnings'], queryFn: () => api.getOwnerEarnings().catch(() => null) });
  if (isLoading) return <div className="owner-stats">{[0, 1, 2].map((i) => <div className="owner-stat-skel" key={i} />)}</div>;
  const s = data?.summary;
  if (!s || s.bookings === 0) {
    return <p className="text-muted" style={{ padding: 'var(--space-3)' }}>No paid bookings yet. Earnings from confirmed bookings will show here.</p>;
  }
  const tiles: Array<{ label: string; val: string; hint?: string }> = [
    { label: 'Owed to you', val: money(s.owedTnd), hint: 'Awaiting payout' },
    { label: 'Paid out', val: money(s.paidOutTnd) },
    { label: 'Net earnings', val: money(s.netTnd), hint: `${s.bookings} booking${s.bookings === 1 ? '' : 's'}` },
    { label: 'Platform commission', val: money(s.commissionTnd) },
  ];
  return (
    <>
      <div className="owner-stats">
        {tiles.map((t, i) => (
          <div className="owner-stat" key={i}>
            <div className="owner-stat-icon"><Wallet size={18} /></div>
            <div className="owner-stat-meta">
              <div className="owner-stat-num">{t.val}</div>
              <div className="owner-stat-label">{t.label}{t.hint ? ` · ${t.hint}` : ''}</div>
            </div>
          </div>
        ))}
      </div>
      <ul className="owner-earnings-list">
        {(data!.entries || []).slice(0, 8).map((e) => (
          <li className="owner-earnings-row" key={e.id}>
            <span className="owner-earnings-place">{e.placeName}</span>
            <span className="owner-earnings-net">{money(e.netTnd)}</span>
            <span className={`owner-earnings-status ${e.settled ? 'is-paid' : 'is-owed'}`}>{e.settled ? 'Paid out' : 'Owed'}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function OwnerPage() {
  const [boostPlace, setBoostPlace] = useState<any | null>(null);
  const [pkgPlace, setPkgPlace] = useState<any | null>(null);
  const queryClient = useQueryClient();

  return (
    <div className="owner-page page-enter" data-design="sleek" id="owner-root">
      <div className="owner-plan-strip"><PlanBanner /></div>

      <div className="favorites-header owner-header">
        <h1><Briefcase /> Owner Dashboard</h1>
        <p>Manage the listings you host and the inquiries travelers send you.</p>
      </div>

      <StatsTiles />

      <section className="owner-section">
        <header className="owner-section-head"><h2><Wallet /> Earnings &amp; payouts</h2></header>
        <div className="owner-earnings"><Earnings /></div>
      </section>

      <section className="owner-section">
        <header className="owner-section-head">
          <h2><Inbox /> Recent inquiries</h2>
          <a href="#/inquiries" className="text-muted" style={{ fontSize: '0.85rem' }}>My sent inquiries -&gt;</a>
        </header>
        <div className="inquiry-list"><Inbox_ /></div>
      </section>

      <section className="owner-section">
        <header className="owner-section-head"><h2><BarChart3 /> Where leads come from</h2></header>
        <div className="owner-breakdown"><Breakdown /></div>
      </section>

      <section className="owner-section">
        <header className="owner-section-head"><h2><MapPin /> My listings</h2></header>
        <div className="owner-places-grid"><Listings onBoost={setBoostPlace} onPackages={setPkgPlace} /></div>
      </section>

      {boostPlace && <BoostModal place={boostPlace} onClose={() => setBoostPlace(null)} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['my-places'] })} />}
      {pkgPlace && <PackageManagerModal place={pkgPlace} onClose={() => setPkgPlace(null)} />}
    </div>
  );
}
