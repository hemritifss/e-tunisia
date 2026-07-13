import '../../styles/leaderboard.css';
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Globe, Building2, Check, Sparkles, BadgeCheck } from 'lucide-react';
import * as api from '../../api';
import TunisiaLoader from '../components/TunisiaLoader';

// Migrated from the vanilla pages/leaderboard.ts — same markup classes, same
// data calls + mock fallback, same data-user-* attrs (drive the right-click
// UserActionMenu) and reveal-on-scroll (pure-CSS scroll animation).

type Mode = 'global' | 'city';

function RankChip({ rank }: { rank: number }) {
  if (rank > 3) return <span className="leaderboard-rank-num">#{rank}</span>;
  const tier = rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze';
  return (
    <span className={`leaderboard-medal leaderboard-medal-${tier}`} aria-label={`Rank ${rank}`}>
      <Trophy />
      <span className="leaderboard-medal-rank">{rank}</span>
    </span>
  );
}

function TierBadge({ plan, role }: { plan?: string; role?: string }) {
  if (plan === 'business') {
    return (
      <span className="leaderboard-tier leaderboard-tier-business" title="Verified Business" aria-label="Verified Business">
        <Check />
      </span>
    );
  }
  if (plan === 'premium' || plan === 'admin') {
    return (
      <span className="leaderboard-tier leaderboard-tier-pro" title="Pro Traveler" aria-label="Pro Traveler">
        <Sparkles />
      </span>
    );
  }
  if (role === 'creator') {
    return (
      <span className="leaderboard-tier leaderboard-tier-guide" title="Local Guide" aria-label="Local Guide">
        <BadgeCheck />
      </span>
    );
  }
  return null;
}

function avatarFor(name: string, avatar?: string): string {
  return avatar
    ? api.getImageUrl(avatar)
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(name)}`;
}

function GlobalRow({ u, index }: { u: any; index: number }) {
  const rank = u.rank || index + 1;
  const isTop3 = rank <= 3;
  const handle = u.handle || u.user?.handle;
  const name = u.name || u.fullName || u.user?.fullName || 'Explorer';
  const userId = u.id || u.user?.id || '';
  const plan = u.plan || u.user?.plan || '';
  const role = u.role || u.user?.role;
  const avatarUrl = avatarFor(name, u.avatar || u.user?.avatar);
  const points = (u.points || u.user?.points || 0).toLocaleString();
  return (
    <a
      href={handle ? `#/u/${encodeURIComponent(handle)}` : '#'}
      className={`leaderboard-item ${isTop3 ? 'is-top-' + rank : ''} reveal-on-scroll`}
      {...(userId
        ? {
            'data-user-id': userId,
            'data-user-name': name,
            'data-user-avatar': avatarUrl,
            'data-user-handle': handle || '',
            'data-user-plan': plan,
          }
        : {})}
    >
      <div className="leaderboard-rank"><RankChip rank={rank} /></div>
      <img src={avatarUrl} alt="" className="leaderboard-avatar" loading="lazy" />
      <div className="leaderboard-info">
        <strong>{name}<TierBadge plan={plan} role={role} /></strong>
        <span>{handle ? '@' + handle : 'Level ' + (u.level || 1)}</span>
      </div>
      <div className="leaderboard-points">
        <strong>{points}</strong>
        <span>XP</span>
      </div>
    </a>
  );
}

function CityRow({ entry }: { entry: any }) {
  const rank = entry.rank;
  const isTop3 = rank <= 3;
  const u = entry.user || {};
  const name = u.fullName || 'Reviewer';
  const handle = u.handle;
  const userId = u.id || '';
  const avatarUrl = avatarFor(name, u.avatar);
  const sub = `${handle ? '@' + handle : ''}${u.country ? (handle ? ' · ' : '') + u.country : ''}`;
  return (
    <a
      href={handle ? `#/u/${encodeURIComponent(handle)}` : '#'}
      className={`leaderboard-item ${isTop3 ? 'is-top-' + rank : ''} reveal-on-scroll`}
      {...(userId
        ? {
            'data-user-id': userId,
            'data-user-name': name,
            'data-user-avatar': avatarUrl,
            'data-user-handle': handle || '',
            'data-user-plan': u.plan || '',
          }
        : {})}
    >
      <div className="leaderboard-rank"><RankChip rank={rank} /></div>
      <img src={avatarUrl} alt="" className="leaderboard-avatar" loading="lazy" />
      <div className="leaderboard-info">
        <strong>{name}<TierBadge plan={u.plan} role={u.role} /></strong>
        <span>{sub}</span>
      </div>
      <div className="leaderboard-points">
        <strong>{Number(entry.reviews) || 0}</strong>
        <span>reviews</span>
      </div>
    </a>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="leaderboard-loading">
      <TunisiaLoader size={52} />
      <p>{label}</p>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="leaderboard-empty">
      <div className="leaderboard-empty-icon"><Trophy /></div>
      <p>{message}</p>
    </div>
  );
}

async function fetchGlobal(): Promise<any[]> {
  // No mock fallback: an empty leaderboard shows the real empty state.
  try {
    const leaders = await api.getLeaderboard(20);
    return leaders?.length ? leaders : [];
  } catch {
    return [];
  }
}

async function fetchCities(): Promise<string[]> {
  try {
    const res: any = await fetch('/api/v1/users/leaderboards/cities?limit=30').then((r) => r.json());
    const arr: any[] = Array.isArray(res) ? res : res?.data ?? [];
    return arr.map((c) => c.city).filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchCityRows(city: string): Promise<any[]> {
  const res: any = await fetch(
    `/api/v1/users/leaderboards/city/${encodeURIComponent(city)}?limit=20`,
  ).then((r) => r.json());
  return Array.isArray(res) ? res : res?.data ?? [];
}

export default function LeaderboardPage() {
  const [mode, setMode] = useState<Mode>('global');
  const [city, setCity] = useState<string>('');

  const globalQ = useQuery({
    queryKey: ['leaderboard', 'global'],
    queryFn: fetchGlobal,
  });

  const citiesQ = useQuery({
    queryKey: ['leaderboard', 'cities'],
    queryFn: fetchCities,
    enabled: mode === 'city',
  });

  // Default the city picker to the first available city once loaded.
  useEffect(() => {
    if (mode === 'city' && !city && citiesQ.data?.length) {
      setCity(citiesQ.data[0]);
    }
  }, [mode, city, citiesQ.data]);

  const cityQ = useQuery({
    queryKey: ['leaderboard', 'city', city],
    queryFn: () => fetchCityRows(city),
    enabled: mode === 'city' && !!city,
  });

  const cities = citiesQ.data ?? [];

  return (
    <div className="leaderboard-page page-enter">
      <header className="leaderboard-hero">
        <div className="leaderboard-hero-bg" aria-hidden="true" />
        <div className="leaderboard-hero-mesh" aria-hidden="true" />
        <div className="leaderboard-hero-orbs" aria-hidden="true">
          <span className="leaderboard-hero-orb" />
          <span className="leaderboard-hero-orb" />
        </div>
        <div className="leaderboard-hero-content">
          <span className="leaderboard-eyebrow"><Trophy /> Rankings</span>
          <h1><span className="leaderboard-accent">Leaderboard</span></h1>
          <p>Climb the ranks by exploring, reviewing, and sharing.</p>
        </div>
      </header>

      <nav className="leaderboard-tabs" role="tablist" aria-label="Leaderboard mode">
        <button
          type="button"
          role="tab"
          className={`leaderboard-tab ${mode === 'global' ? 'active' : ''}`}
          aria-selected={mode === 'global'}
          onClick={() => setMode('global')}
        >
          <Globe />
          <span>Top Explorers</span>
        </button>
        <button
          type="button"
          role="tab"
          className={`leaderboard-tab ${mode === 'city' ? 'active' : ''}`}
          aria-selected={mode === 'city'}
          onClick={() => setMode('city')}
        >
          <Building2 />
          <span>Top Reviewers by City</span>
        </button>
      </nav>

      <div className="leaderboard-city-row" hidden={mode !== 'city'}>
        <label htmlFor="leaderboard-city-select">City</label>
        <select
          id="leaderboard-city-select"
          className="leaderboard-city-select"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        >
          {cities.length ? (
            cities.map((c) => <option key={c} value={c}>{c}</option>)
          ) : (
            <option value="">— no cities yet —</option>
          )}
        </select>
      </div>

      <div className="leaderboard-list" role="region" aria-live="polite">
        {mode === 'global' ? (
          globalQ.isLoading ? (
            <Loading label="Loading explorers…" />
          ) : globalQ.data?.length ? (
            globalQ.data.map((u, i) => <GlobalRow key={u.id || u.user?.id || i} u={u} index={i} />)
          ) : (
            <Empty message="No rankings yet — be the first to climb." />
          )
        ) : citiesQ.isLoading || (cityQ.isLoading && !!city) ? (
          <Loading label="Loading top reviewers…" />
        ) : !city ? (
          <Empty message="No city rankings yet." />
        ) : cityQ.isError ? (
          <Empty message="Couldn't load city rankings." />
        ) : cityQ.data?.length ? (
          cityQ.data.map((entry, i) => <CityRow key={entry.user?.id || i} entry={entry} />)
        ) : (
          <Empty message={`No reviews yet in ${city}.`} />
        )}
      </div>
    </div>
  );
}
