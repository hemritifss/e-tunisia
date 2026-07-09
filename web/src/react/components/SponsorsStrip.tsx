import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getImageUrl } from '../../shared/api';

interface Sponsor {
  id: string;
  name: string;
  logo?: string | null;
  website?: string | null;
  description?: string | null;
  tier?: 'gold' | 'silver' | 'bronze' | string;
}

const TIER_ORDER: Record<string, number> = { gold: 0, silver: 1, bronze: 2 };

// Renders active sponsors (from /sponsors) as a compact logo strip. Clicking a
// sponsor tracks the click (/sponsors/:id/click) and opens their site. Renders
// nothing when there are no sponsors, so it stays invisible until seeded.
export function SponsorsStrip() {
  const { data } = useQuery({
    queryKey: ['sponsors'],
    queryFn: async () => {
      try {
        const r: any = await api.getSponsors();
        return (Array.isArray(r) ? r : r?.data || []) as Sponsor[];
      } catch {
        return [] as Sponsor[];
      }
    },
    staleTime: 5 * 60_000,
  });

  const sponsors = (data || [])
    .filter((s) => s && s.name)
    .sort((a, b) => (TIER_ORDER[a.tier || 'bronze'] ?? 2) - (TIER_ORDER[b.tier || 'bronze'] ?? 2));

  if (sponsors.length === 0) return null;

  const open = (s: Sponsor) => {
    api.clickSponsor(s.id).catch(() => {});
    if (s.website) window.open(s.website, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="sponsors-strip" aria-label="Our sponsors">
      <div className="sponsors-strip-head">
        <span>Sponsors</span>
        <span className="sponsors-strip-hint">Supporting local travel</span>
      </div>
      <div className="sponsors-strip-grid">
        {sponsors.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`sponsor-tile sponsor-tier-${s.tier || 'bronze'}`}
            onClick={() => open(s)}
            title={s.description || s.name}
            aria-label={s.name}
          >
            {s.logo ? (
              <img src={getImageUrl(s.logo)} alt={s.name} loading="lazy" />
            ) : (
              <span className="sponsor-name">{s.name}</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
