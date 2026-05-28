import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, MapPin, Users, Sparkles, Check, BadgeCheck } from 'lucide-react';
import * as api from '../../api';
import { replace, currentPath, query as routeQuery } from '../../router';

// Migrated from vanilla pages/search.ts — debounced aggregate search.

function initialQuery(): string {
  const params = routeQuery();
  return params.get('q') || (params.get('hashtag') ? '#' + (params.get('hashtag') || '') : '') || '';
}

function TierBadge({ u }: { u: any }) {
  let kind: 'business' | 'pro' | 'guide' | null = null;
  if (u.plan === 'business') kind = 'business';
  else if (u.plan === 'premium' || u.plan === 'admin') kind = 'pro';
  else if (u.role === 'creator') kind = 'guide';
  if (!kind) return null;
  const title = kind === 'business' ? 'Verified Business' : kind === 'pro' ? 'Pro Traveler' : 'Local Guide';
  return (
    <span className={`search-tier-badge is-${kind}`} title={title} aria-label={title}>
      {kind === 'pro' ? <Sparkles /> : kind === 'business' ? <Check /> : <BadgeCheck />}
    </span>
  );
}

function PersonCard({ u }: { u: any }) {
  const avatar = u.avatar ? api.getImageUrl(u.avatar, 'avatar') : `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(u.fullName || u.handle || 'u')}`;
  const sub = `${u.handle ? '@' + u.handle : ''}${u.country ? ' · ' + u.country : ''}`.trim();
  return (
    <a className="search-person-card" href={u.handle ? `#/u/${encodeURIComponent(u.handle)}` : '#'}
       data-user-id={u.id || ''} data-user-name={u.fullName || ''} data-user-avatar={u.avatar ? api.getImageUrl(u.avatar, 'avatar') : ''} data-user-handle={u.handle || ''} data-user-plan={u.plan || ''}>
      <img className="search-person-avatar" alt="" loading="lazy" src={avatar} />
      <div className="search-person-meta">
        <strong className="search-person-name">{u.fullName || 'Traveler'}<TierBadge u={u} /></strong>
        <span className="search-person-sub">{sub || ' '}</span>
        {u.bio && <span className="search-person-bio">{u.bio}</span>}
      </div>
      <span className="search-person-followers"><Users /><span>{u.followersCount || 0}</span></span>
    </a>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="search-section">
      <h2 className="search-section-title"><span>{title}</span><span className="search-section-count">{count}</span></h2>
      {children}
    </section>
  );
}

export default function SearchPage() {
  const [input, setInput] = useState(initialQuery());
  const [debounced, setDebounced] = useState(input.trim());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const t = setTimeout(() => setDebounced(input.trim()), 200); return () => clearTimeout(t); }, [input]);
  // Keep the URL's ?q= in sync (silent replace).
  useEffect(() => { const base = currentPath(); replace(debounced ? `${base}?q=${encodeURIComponent(debounced)}` : base); }, [debounced]);
  useEffect(() => { const t = setTimeout(() => inputRef.current?.focus(), 100); return () => clearTimeout(t); }, []);

  const { data, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => api.search(debounced).catch(() => ({ places: [], posts: [], users: [] })),
    enabled: !!debounced,
  });

  const places = data?.places || [];
  const posts = data?.posts || [];
  const users = data?.users || [];
  const hasResults = places.length || posts.length || users.length;

  return (
    <div className="search-page page-enter">
      <header className="search-page-head">
        <span className="search-page-eyebrow"><Search /> Discover</span>
        <h1>Search Tunisia</h1>
        <p>Find places, cities, tags, or travelers — all in one place.</p>
        <div className="search-page-input-wrap">
          <Search className="search-page-input-icon" />
          <input
            ref={inputRef} id="search-page-input" type="search" className="search-page-input"
            placeholder="Search places, cities, tags, people…" autoComplete="off" aria-label="Search"
            value={input} onChange={(e) => setInput(e.target.value)}
          />
          {input && (
            <button type="button" className="search-page-clear" aria-label="Clear search" onClick={() => { setInput(''); inputRef.current?.focus(); }}><X /></button>
          )}
        </div>
      </header>

      <div className="search-page-results">
        {!debounced ? (
          <div className="search-empty"><div className="search-empty-icon"><Search /></div><h3>Start typing to search</h3><p>Find places, cities, tags, or travelers across Tunisia.</p></div>
        ) : isFetching ? (
          <div className="search-loading">{Array.from({ length: 4 }).map((_, i) => <div className="search-skel-row" key={i} />)}</div>
        ) : !hasResults ? (
          <div className="search-empty"><div className="search-empty-icon"><Search /></div><h3>No matches for "{debounced}"</h3><p>Try a different city, tag, or handle.</p></div>
        ) : (
          <>
            {users.length > 0 && (
              <Section title="People" count={users.length}>
                <div className="search-people-list">{users.map((u: any) => <PersonCard key={u.id} u={u} />)}</div>
              </Section>
            )}
            {places.length > 0 && (
              <Section title="Places" count={places.length}>
                <div className="search-place-grid">
                  {places.map((p: any) => {
                    const cat = p.category?.name || p.category || '';
                    return (
                      <a key={p.id} href={`#/place/${p.id}`} className="search-place-card">
                        <div className="search-place-img"><img src={api.getImageUrl(p.coverImage || (p.images && p.images[0]) || '', 'place')} alt="" loading="lazy" /></div>
                        <div className="search-place-info">
                          <strong>{p.name}</strong>
                          <span className="search-place-sub"><MapPin /> {p.city || ''}{cat ? ' · ' + cat : ''}</span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </Section>
            )}
            {posts.length > 0 && (
              <Section title="Posts" count={posts.length}>
                <div className="search-post-list">
                  {posts.map((p: any) => (
                    <a key={p.id} href={`#/post/${p.id}`} className="search-post-card">
                      <div className="search-post-content">
                        <strong>{p.title}</strong>
                        <p>{(p.body || '').slice(0, 120)}{(p.body || '').length > 120 ? '…' : ''}</p>
                        <span className="search-post-meta">{p.category || 'Post'} · {p.location || ''}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
