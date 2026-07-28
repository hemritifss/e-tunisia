import '../../styles/wrapped.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Share2, Check, ChevronLeft, ChevronRight, MapPin, IdCard, Sparkles } from 'lucide-react';
import { api, ogShareUrl } from '../../shared/api';
import { useAuthStore } from '../stores/auth-store';
import { currentRoute, goTo } from '../../router';
import { track } from '../../analytics';

// "Your Summer in Tunisia" — Wrapped (GROWTH §6). A tap-through story deck of the
// season's real activity, ending in a shareable card. Zero-login to VIEW a shared
// Wrapped (/wrapped/:handle); the owner reaches their own via /wrapped.

interface Wrapped {
  handle: string;
  fullName: string;
  avatar: string | null;
  period: { label: string; year: number };
  isEmpty: boolean;
  stats: { checkIns: number; citiesCount: number; governoratesCount: number; reviews: number; gems: number; beachReports: number };
  cities: string[];
  topCity: { city: string; count: number } | null;
  firstTrip: { city: string; at: string } | null;
  personality: { key: string; label: string; emoji: string; blurb: string };
  points: number;
  passportLevel: string;
  founderNumber: number | null;
}

function handleFromPath(): string {
  const m = currentRoute().match(/^\/wrapped\/([^/?]+)/);
  return m ? decodeURIComponent(m[1]).toLowerCase() : '';
}

export default function WrappedPage() {
  const authUser = useAuthStore((s) => s.user) as any;
  const pathHandle = useMemo(() => handleFromPath(), []);
  const handle = pathHandle || authUser?.handle || '';
  const isOwner = !!authUser?.handle && authUser.handle.toLowerCase() === handle.toLowerCase();

  const [data, setData] = useState<Wrapped | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!handle) { setError('no-handle'); return; }
    let cancelled = false;
    (async () => {
      try {
        const res: any = await api.getWrapped(handle);
        if (cancelled) return;
        if (!res || res.error) { setError('not-found'); return; }
        setData(res);
        track('wrapped_view', { handle, owner: isOwner, empty: !!res.isEmpty });
      } catch { if (!cancelled) setError('not-found'); }
    })();
    return () => { cancelled = true; };
  }, [handle]);

  const slides = useMemo(() => (data && !data.isEmpty ? buildSlides(data) : []), [data]);
  const total = slides.length;

  const next = () => setIdx((i) => Math.min(total - 1, i + 1));
  const prev = () => setIdx((i) => Math.max(0, i - 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total]);

  const share = async () => {
    if (!data) return;
    const url = ogShareUrl(`wrapped/${data.handle}`);
    const text = isOwner
      ? `My ${data.period.label} in Tunisia — ${data.personality.label} ${data.personality.emoji}`
      : `${data.fullName}'s ${data.period.label} in Tunisia ${data.personality.emoji}`;
    track('wrapped_share', { handle: data.handle });
    try {
      if (navigator.share) { await navigator.share({ title: 'Summer in Tunisia — Wrapped', text, url }); return; }
    } catch { /* cancelled */ }
    try { await navigator.clipboard.writeText(`${text} ${url}`); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch { /* ignore */ }
  };

  // ── Guard states ───────────────────────────────────────────
  if (error === 'no-handle') {
    return (
      <div className="wrapped-page wrapped-guard">
        <h1>Your Summer in Tunisia</h1>
        <p>Sign in to see your Wrapped — the cities, check-ins and story of your season.</p>
        <a className="btn primary" href="#/login">Sign in</a>
      </div>
    );
  }
  if (error) {
    return (
      <div className="wrapped-page wrapped-guard">
        <h1>Wrapped not found</h1>
        <p>We couldn't find a Wrapped for @{handle}.</p>
        <a className="btn primary" href="#/explore">Explore Tunisia</a>
      </div>
    );
  }
  if (!data) {
    return <div className="wrapped-page wrapped-loading"><div className="wrapped-spinner" /></div>;
  }

  // ── Empty state — not enough summer activity yet ───────────
  if (data.isEmpty) {
    return (
      <div className="wrapped-page wrapped-guard">
        <div className="wrapped-kicker"><Sparkles size={14} /> {data.period.label}</div>
        <h1>{isOwner ? 'Your summer is just getting started' : `@${data.handle}'s summer is just getting started`}</h1>
        <p>{isOwner
          ? 'Check in at a place, write a review, or add a hidden gem — then come back to see your Wrapped fill up.'
          : 'No summer story here yet. Start your own — Tunisia is waiting.'}</p>
        <div className="wrapped-guard-actions">
          <a className="btn primary" href="#/map"><MapPin size={16} /> Check in somewhere</a>
          <a className="btn ghost" href="#/city-quiz">Which city are you? →</a>
        </div>
      </div>
    );
  }

  const isLast = idx === total - 1;

  return (
    <div className="wrapped-page">
      {/* story progress bars */}
      <div className="wrapped-bars">
        {slides.map((_, i) => (
          <span key={i} className={`wrapped-bar ${i <= idx ? 'is-done' : ''}`} />
        ))}
      </div>

      <div className="wrapped-stage" key={idx}>
        {slides[idx]}
      </div>

      {/* tap zones */}
      <button className="wrapped-tap wrapped-tap-left" onClick={prev} aria-label="Previous" disabled={idx === 0}>
        <ChevronLeft size={20} />
      </button>
      {!isLast && (
        <button className="wrapped-tap wrapped-tap-right" onClick={next} aria-label="Next">
          <ChevronRight size={20} />
        </button>
      )}

      {isLast && (
        <div className="wrapped-actions">
          <button className="btn primary" type="button" onClick={share}>
            {copied ? <><Check size={16} /> Link copied</> : <><Share2 size={16} /> {isOwner ? 'Share your Wrapped' : 'Share'}</>}
          </button>
          {isOwner
            ? <a className="btn ghost" href={`#/u/${data.handle}`}><IdCard size={16} /> My passport</a>
            : <button className="btn ghost" type="button" onClick={() => goTo(authUser?.handle ? '/wrapped' : '/register')}>Make your own →</button>}
        </div>
      )}
    </div>
  );
}

// ── Slides ───────────────────────────────────────────────────
function buildSlides(d: Wrapped): React.ReactNode[] {
  const slides: React.ReactNode[] = [];

  slides.push(
    <div className="wrapped-slide ws-cover" key="cover">
      <div className="wrapped-kicker"><Sparkles size={14} /> {d.period.label}</div>
      <h1>Your Summer<br />in Tunisia 🇹🇳</h1>
      <p className="ws-sub">Let's look back at {d.fullName.split(' ')[0]}'s season.</p>
    </div>,
  );

  slides.push(
    <div className="wrapped-slide ws-stat" key="places">
      <span className="ws-label">You explored</span>
      <span className="ws-big">{d.stats.citiesCount}</span>
      <span className="ws-unit">{d.stats.citiesCount === 1 ? 'city' : 'cities'}</span>
      <p className="ws-note">across <strong>{d.stats.governoratesCount}</strong> of 24 governorates{d.cities.length ? ` — ${d.cities.slice(0, 5).join(', ')}${d.cities.length > 5 ? '…' : ''}` : ''}.</p>
    </div>,
  );

  slides.push(
    <div className="wrapped-slide ws-stat" key="checkins">
      <span className="ws-label">You checked in</span>
      <span className="ws-big">{d.stats.checkIns}</span>
      <span className="ws-unit">{d.stats.checkIns === 1 ? 'time' : 'times'}</span>
      {d.topCity && <p className="ws-note">Your summer HQ was <strong>{d.topCity.city}</strong> — {d.topCity.count} check-in{d.topCity.count === 1 ? '' : 's'}.</p>}
    </div>,
  );

  // Contribution slide — only if they actually gave something back.
  const contrib = d.stats.reviews + d.stats.gems + d.stats.beachReports;
  if (contrib > 0) {
    slides.push(
      <div className="wrapped-slide ws-contrib" key="contrib">
        <span className="ws-label">You gave back</span>
        <div className="ws-contrib-row">
          {d.stats.reviews > 0 && <div className="ws-chip"><b>{d.stats.reviews}</b><span>review{d.stats.reviews === 1 ? '' : 's'}</span></div>}
          {d.stats.gems > 0 && <div className="ws-chip"><b>{d.stats.gems}</b><span>hidden gem{d.stats.gems === 1 ? '' : 's'}</span></div>}
          {d.stats.beachReports > 0 && <div className="ws-chip"><b>{d.stats.beachReports}</b><span>beach report{d.stats.beachReports === 1 ? '' : 's'}</span></div>}
        </div>
        <p className="ws-note">You didn't just travel Tunisia — you made it better for the next traveler.</p>
      </div>,
    );
  }

  // Personality reveal.
  slides.push(
    <div className="wrapped-slide ws-personality" key="personality">
      <span className="ws-label">This summer, you were</span>
      <div className="ws-emoji">{d.personality.emoji}</div>
      <h2 className="ws-persona">{d.personality.label}</h2>
      <p className="ws-blurb">{d.personality.blurb}</p>
    </div>,
  );

  // Final summary card (the shareable frame).
  slides.push(
    <div className="wrapped-slide ws-final" key="final">
      <div className="ws-card">
        <span className="ws-card-kicker">{d.period.label} · in Tunisia</span>
        <strong className="ws-card-name">{d.fullName}</strong>
        <span className="ws-card-persona">{d.personality.emoji} {d.personality.label}</span>
        <div className="ws-card-grid">
          <div><b>{d.stats.checkIns}</b><span>check-ins</span></div>
          <div><b>{d.stats.citiesCount}</b><span>cities</span></div>
          <div><b>{d.stats.governoratesCount}</b><span>governorates</span></div>
          <div><b>{d.stats.reviews}</b><span>reviews</span></div>
        </div>
        <span className="ws-card-brand">🇹🇳 e-tunisia</span>
      </div>
    </div>,
  );

  return slides;
}
