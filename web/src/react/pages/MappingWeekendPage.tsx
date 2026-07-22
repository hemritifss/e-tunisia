import '../../styles/mapping.css';
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, MapPin, Gem, Users, Share2, Check, Clock, Flame } from 'lucide-react';
import { api, ogShareUrl, getImageUrl } from '../../shared/api';
import { useAuthStore } from '../stores/auth-store';
import { track } from '../../analytics';

// "The Great Tunisia Mapping Weekend" (GROWTH §8) — the launch moment. A live
// national leaderboard: every governorate racing to map its region. Public to
// view (auth adds your personal rank); the primary action is "Add a hidden gem".

interface GovRow { governorate: string; points: number; gems: number; contributors: number; rank: number; }
interface Contributor { handle: string | null; fullName: string; avatar: string | null; governorate: string | null; points: number; rank: number; }
interface Standings {
  event: { slug: string; title: string; subtitle: string | null; startsAt: string; endsAt: string; prizes: string | null };
  status: 'upcoming' | 'live' | 'ended';
  now: string;
  totals: { contributors: number; gems: number; governorates: number; points: number };
  governorates: GovRow[];
  topContributors: Contributor[];
  me: { points: number; rank: number; governorate: string | null } | null;
}

const MEDALS = ['🥇', '🥈', '🥉'];

function useCountdown(target: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!target) return null;
  const ms = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { d, h, m, s, done: ms === 0 };
}

export default function MappingWeekendPage() {
  const user = useAuthStore((s) => s.user) as any;
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useQuery<Standings>({
    queryKey: ['mapping-weekend'],
    queryFn: () => api.getMappingWeekend() as any,
    refetchInterval: 20000, // live board — poll every 20s
    refetchOnWindowFocus: true,
  });

  useEffect(() => { track('mapping_weekend_view', {}); }, []);

  const status = data?.status;
  const countdownTarget = status === 'upcoming' ? data?.event.startsAt : status === 'live' ? data?.event.endsAt : null;
  const cd = useCountdown(countdownTarget || null);

  const maxPoints = useMemo(() => Math.max(1, ...(data?.governorates || []).map((g) => g.points)), [data]);

  const share = async () => {
    if (!data) return;
    const url = ogShareUrl(`mapping-weekend`);
    const leader = data.governorates[0];
    const text = status === 'live' && leader
      ? `${leader.governorate} is leading the Great Tunisia Mapping Weekend 🗺️ — help your governorate catch up!`
      : 'The Great Tunisia Mapping Weekend 🗺️ — help map Tunisia\'s hidden treasures.';
    track('mapping_weekend_share', {});
    try { if (navigator.share) { await navigator.share({ title: data.event.title, text, url }); return; } } catch { /* cancelled */ }
    try { await navigator.clipboard.writeText(`${text} ${url}`); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch { /* ignore */ }
  };

  if (isLoading) return <div className="mw-page mw-loading"><div className="mw-spinner" /></div>;
  if (error || !data) {
    return (
      <div className="mw-page mw-guard">
        <h1>No mapping event right now</h1>
        <p>The next Great Tunisia Mapping Weekend hasn't been scheduled yet. In the meantime, every gem you add still counts.</p>
        <a className="btn primary" href="#/submit-gem"><Gem size={16} /> Add a hidden gem</a>
      </div>
    );
  }

  const { event, totals, governorates, topContributors, me } = data;

  return (
    <div className="mw-page" data-design="sleek">
      <header className="mw-hero">
        <span className={`mw-status mw-status-${status}`}>
          {status === 'live' && <><Flame size={13} /> Live now</>}
          {status === 'upcoming' && <><Clock size={13} /> Starting soon</>}
          {status === 'ended' && <>Final results</>}
        </span>
        <h1>{event.title}</h1>
        {event.subtitle && <p className="mw-subtitle">{event.subtitle}</p>}

        {cd && status !== 'ended' && (
          <div className="mw-countdown" aria-label="time remaining">
            {[['d', cd.d], ['h', cd.h], ['m', cd.m], ['s', cd.s]].map(([label, val]) => (
              <div key={label as string} className="mw-cd-unit">
                <span className="mw-cd-val">{String(val).padStart(2, '0')}</span>
                <span className="mw-cd-label">{label}</span>
              </div>
            ))}
            <span className="mw-cd-caption">{status === 'live' ? 'until it closes' : 'until kickoff'}</span>
          </div>
        )}

        <div className="mw-actions">
          <a className="btn primary" href="#/submit-gem"><Gem size={16} /> Add a hidden gem</a>
          <button className="btn ghost" type="button" onClick={share}>
            {copied ? <><Check size={16} /> Copied</> : <><Share2 size={16} /> Rally your region</>}
          </button>
        </div>
      </header>

      {/* totals */}
      <div className="mw-totals">
        <div><Users size={16} /><b>{totals.contributors}</b><span>mappers</span></div>
        <div><Gem size={16} /><b>{totals.gems}</b><span>gems added</span></div>
        <div><MapPin size={16} /><b>{totals.governorates}</b><span>governorates in</span></div>
        <div><Trophy size={16} /><b>{totals.points}</b><span>points</span></div>
      </div>

      {/* your standing */}
      {me ? (
        <div className="mw-me">
          <div className="mw-me-rank">#{me.rank}</div>
          <div className="mw-me-body">
            <strong>You're on the board</strong>
            <span>{me.points} points{me.governorate ? ` · flying the flag for ${me.governorate}` : ''}. Keep going.</span>
          </div>
          <a className="btn primary sm" href="#/submit-gem">Add more →</a>
        </div>
      ) : (
        <div className="mw-me mw-me-cta">
          <div className="mw-me-body">
            <strong>{user ? 'Get on the board' : 'Join the weekend'}</strong>
            <span>Add or confirm a gem, check in, or review a place — every action scores for your governorate.</span>
          </div>
          <a className="btn primary sm" href={user ? '#/submit-gem' : '#/register'}>{user ? 'Add a gem →' : 'Sign up →'}</a>
        </div>
      )}

      <div className="mw-grid">
        {/* governorate leaderboard */}
        <section className="mw-board">
          <h2><Trophy size={16} /> Governorate leaderboard</h2>
          {governorates.length === 0 && <p className="mw-empty">No points yet — be the first to put your governorate on the board.</p>}
          <ol className="mw-gov-list">
            {governorates.map((g) => (
              <li key={g.governorate} className={`mw-gov ${g.rank <= 3 ? 'is-podium' : ''}`}>
                <span className="mw-gov-rank">{MEDALS[g.rank - 1] || g.rank}</span>
                <div className="mw-gov-main">
                  <div className="mw-gov-top">
                    <span className="mw-gov-name">{g.governorate}</span>
                    <span className="mw-gov-pts">{g.points} pts</span>
                  </div>
                  <div className="mw-gov-bar"><span style={{ width: `${Math.round((g.points / maxPoints) * 100)}%` }} /></div>
                  <div className="mw-gov-meta">{g.gems} gem{g.gems === 1 ? '' : 's'} · {g.contributors} mapper{g.contributors === 1 ? '' : 's'}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* top contributors */}
        <section className="mw-board">
          <h2><Flame size={16} /> Top mappers</h2>
          {topContributors.length === 0 && <p className="mw-empty">The race is wide open.</p>}
          <ol className="mw-people">
            {topContributors.map((c) => (
              <li key={(c.handle || c.fullName) + c.rank} className="mw-person">
                <span className="mw-person-rank">{MEDALS[c.rank - 1] || c.rank}</span>
                {c.avatar
                  ? <img
                      className="mw-person-av"
                      src={getImageUrl(c.avatar)}
                      alt=""
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  : <span className="mw-person-av mw-person-av-fb">{(c.fullName || '?').slice(0, 1).toUpperCase()}</span>}
                <div className="mw-person-body">
                  <a className="mw-person-name" href={c.handle ? `#/u/${c.handle}` : undefined}>{c.handle ? `@${c.handle}` : c.fullName}</a>
                  {c.governorate && <span className="mw-person-gov">{c.governorate}</span>}
                </div>
                <span className="mw-person-pts">{c.points}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {event.prizes && (
        <section className="mw-prizes">
          <h2>🏆 Prizes</h2>
          <p>{event.prizes}</p>
        </section>
      )}

      <p className="mw-refresh-note">Standings refresh automatically every 20 seconds.</p>
    </div>
  );
}
