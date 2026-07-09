import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Hash, TrendingUp } from 'lucide-react';
import { api } from '../../shared/api';

interface Trending {
  tag: string;
  display: string;
  count: number;
}

export function TrendingHashtags() {
  const { data, isLoading } = useQuery({
    queryKey: ['trending-hashtags'],
    queryFn: () => api.getTrendingHashtags(8) as Promise<Trending[]>,
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });

  const tags = Array.isArray(data) ? data : [];
  if (isLoading) {
    return (
      <aside className="trending-card">
        <header className="trending-head">
          <TrendingUp size={16} className="text-brand" />
          <h3>Trending</h3>
        </header>
        <ul className="trending-list">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="trending-row trending-row-skeleton">
              <div className="trending-skeleton-bar" />
            </li>
          ))}
        </ul>
      </aside>
    );
  }

  if (tags.length === 0) return null;

  return (
    <aside className="trending-card">
      <header className="trending-head">
        <TrendingUp size={16} className="text-brand" />
        <h3>Trending in Tunisia</h3>
      </header>
      <ul className="trending-list">
        {tags.map((t, i) => (
          <li key={t.tag}>
            <a className="trending-row" href={`#/tag/${encodeURIComponent(t.tag)}`}>
              <span className="trending-rank">{i + 1}</span>
              <span className="trending-tag">
                <Hash size={14} />
                <strong>{t.display}</strong>
              </span>
              <span className="trending-count">
                {t.count.toLocaleString()} {t.count === 1 ? 'post' : 'posts'}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
