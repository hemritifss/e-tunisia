import '../../styles/jellyfish.css';
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Waves, MapPin, Clock, X, Send, Loader2, RefreshCw } from 'lucide-react';
import * as api from '../../api';
import { requireAuth, showToast } from '../../ui-utils';
import { track } from '../../analytics';

// GROWTH §7 — "famma 9nadel?" (are there jellyfish?). In Tunisian summer this is
// a DAILY question with no good answer online. Zero-login to read, login to report.

const JELLY: Record<string, { label: string; cls: string; emoji: string }> = {
  none: { label: 'No jellyfish', cls: 'ok', emoji: '🏖️' },
  few: { label: 'A few jellyfish', cls: 'warn', emoji: '🪼' },
  lots: { label: 'Lots of jellyfish', cls: 'bad', emoji: '🪼🪼' },
};
const WATER: Record<string, string> = { clear: 'Clear water', seaweed: 'Some seaweed', murky: 'Murky' };
const CROWD: Record<string, string> = { empty: 'Empty', ok: 'Some people', packed: 'Packed' };

function ago(iso: string | null): string {
  if (!iso) return '';
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

type Beach = {
  placeId: string; name: string; city: string; governorate: string; coverImage: string | null;
  jellyfish: string | null; water: string | null; crowd: string | null; note: string | null;
  reportedAt: string | null; reportsToday: number;
};

function ReportModal({ beach, onClose }: { beach: Beach; onClose: () => void }) {
  const qc = useQueryClient();
  const [jellyfish, setJellyfish] = useState<'none' | 'few' | 'lots'>('none');
  const [water, setWater] = useState<'' | 'clear' | 'seaweed' | 'murky'>('');
  const [crowd, setCrowd] = useState<'' | 'empty' | 'ok' | 'packed'>('');
  const [note, setNote] = useState('');

  // Escape-to-close + body scroll lock — the modal was scrim/button-only,
  // leaving keyboard users no quick dismiss.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  const m = useMutation({
    mutationFn: () => api.reportBeach(beach.placeId, { jellyfish, water: water || undefined, crowd: crowd || undefined, note: note.trim() || undefined }),
    onSuccess: (r: any) => {
      track('beach_report', { placeId: beach.placeId, jellyfish });
      showToast(r?.awarded ? 'Thanks! +5 XP — you just helped the whole beach' : 'Report saved — thanks!');
      qc.invalidateQueries({ queryKey: ['beaches'] });
      onClose();
    },
    onError: (e: any) => showToast(e?.message || 'Could not send report', { type: 'error' }),
  });
  return (
    <div className="jelly-modal-scrim" onClick={onClose}>
      <div className="jelly-modal" role="dialog" aria-modal="true" aria-label={`Report conditions at ${beach.name}`} onClick={(e) => e.stopPropagation()}>
        <button className="jelly-modal-close" onClick={onClose} aria-label="Close"><X size={18} aria-hidden="true" /></button>
        <h2>How's {beach.name} right now?</h2>
        <div className="jelly-field">
          <label>Jellyfish?</label>
          <div className="jelly-seg">
            {(['none', 'few', 'lots'] as const).map((v) => (
              <button key={v} className={`jelly-seg-btn ${JELLY[v].cls} ${jellyfish === v ? 'is-on' : ''}`} onClick={() => setJellyfish(v)}>
                {JELLY[v].emoji} {v === 'none' ? 'None' : v === 'few' ? 'A few' : 'Lots'}
              </button>
            ))}
          </div>
        </div>
        <div className="jelly-field">
          <label>Water <span className="jelly-opt">(optional)</span></label>
          <div className="jelly-seg">
            {(['clear', 'seaweed', 'murky'] as const).map((v) => (
              <button key={v} className={`jelly-seg-btn ${water === v ? 'is-on' : ''}`} onClick={() => setWater(water === v ? '' : v)}>{WATER[v]}</button>
            ))}
          </div>
        </div>
        <div className="jelly-field">
          <label>Crowd <span className="jelly-opt">(optional)</span></label>
          <div className="jelly-seg">
            {(['empty', 'ok', 'packed'] as const).map((v) => (
              <button key={v} className={`jelly-seg-btn ${crowd === v ? 'is-on' : ''}`} onClick={() => setCrowd(crowd === v ? '' : v)}>{CROWD[v]}</button>
            ))}
          </div>
        </div>
        <input className="input" maxLength={160} value={note} placeholder="Anything else? (e.g. lifeguard on duty, parking full)" onChange={(e) => setNote(e.target.value)} />
        <button className="btn btn-primary jelly-modal-submit" onClick={() => m.mutate()} disabled={m.isPending}>
          {m.isPending ? <><Loader2 className="animate-spin" size={16} /> Sending…</> : <><Send size={16} /> Post report (+5 XP)</>}
        </button>
      </div>
    </div>
  );
}

function BeachCard({ b, onReport }: { b: Beach; onReport: (b: Beach) => void }) {
  const j = b.jellyfish ? JELLY[b.jellyfish] : null;
  return (
    <article className={`jelly-card ${j ? j.cls : 'stale'}`}>
      <div className="jelly-card-head">
        <a className="jelly-card-name" href={`#/place/${b.placeId}`}>{b.name}</a>
        <span className="jelly-card-loc"><MapPin size={11} /> {b.city}</span>
      </div>
      {j ? (
        <div className="jelly-card-status">
          <span className="jelly-badge">{j.emoji} {j.label}</span>
          <div className="jelly-card-sub">
            {b.water && <span>{WATER[b.water]}</span>}
            {b.crowd && <span>· {CROWD[b.crowd]}</span>}
          </div>
          {b.note && <p className="jelly-card-note">“{b.note}”</p>}
          <div className="jelly-card-meta"><Clock size={11} /> {ago(b.reportedAt)} · {b.reportsToday} report{b.reportsToday === 1 ? '' : 's'} today</div>
        </div>
      ) : (
        <div className="jelly-card-status">
          <span className="jelly-badge stale">No report yet today</span>
          <div className="jelly-card-meta">Be the first — are you there?</div>
        </div>
      )}
      <button className="jelly-card-report" onClick={() => onReport(b)}>I'm here — report</button>
    </article>
  );
}

export default function JellyfishPage() {
  const [gov, setGov] = useState<string>('');
  const [reporting, setReporting] = useState<Beach | null>(null);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['beaches', gov],
    queryFn: () => api.getBeaches(gov || undefined),
    staleTime: 60_000,
  });
  const beaches: Beach[] = Array.isArray(data) ? data : [];
  const governorates = useMemo(
    () => Array.from(new Set(beaches.map((b) => b.governorate).filter(Boolean))).sort(),
    [beaches],
  );
  const withReports = beaches.filter((b) => b.reportedAt).length;

  const openReport = (b: Beach) => { if (requireAuth('report beach conditions')) setReporting(b); };

  return (
    <div className="jelly-page page-enter" data-design="sleek">
      <header className="jelly-header">
        <span className="jelly-kicker"><Waves size={13} /> Beach report</span>
        <h1>Famma 9nadel? 🪼</h1>
        <p>Live jellyfish, water &amp; crowd reports from Tunisia's beaches — updated by people who are there right now.</p>
      </header>

      <div className="jelly-controls">
        <select className="jelly-gov" value={gov} onChange={(e) => setGov(e.target.value)} aria-label="Filter by governorate">
          <option value="">All coasts{withReports ? ` · ${withReports} reported today` : ''}</option>
          {governorates.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <button className="jelly-refresh" onClick={() => refetch()} aria-label="Refresh" disabled={isFetching}>
          <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {isLoading ? (
        <div className="jelly-grid">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="jelly-card jelly-skel" />)}</div>
      ) : beaches.length === 0 ? (
        <p className="jelly-empty">No beaches here yet. Try another coast.</p>
      ) : (
        <div className="jelly-grid">
          {beaches.map((b) => <BeachCard key={b.placeId} b={b} onReport={openReport} />)}
        </div>
      )}

      <p className="jelly-fineprint">Reports fade after 24h — a beach with no badge just means nobody's reported it today. See jellyfish? Tap “report” and help everyone.</p>

      {reporting && <ReportModal beach={reporting} onClose={() => setReporting(null)} />}
    </div>
  );
}
