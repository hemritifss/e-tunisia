import React from 'react';
import { motion } from 'framer-motion';
import { getImageUrl } from '../../shared/api';
import { goTo } from '../../router';
import { track } from '../../analytics';

interface DiscoveryPlace {
  id: string;
  name: string;
  slug?: string;
  city?: string;
  governorate?: string;
  coverImage?: string | null;
  description?: string | null;
  rating?: number;
  reviewCount?: number;
  category?: string | null;
}

/**
 * In-feed heritage insert — a quality place the viewer hasn't visited, injected
 * (~1 in 7) by the ranked feed. Stone is the archival surface in this system,
 * so the insert is the one place in the feed that leaves the whitewash page.
 * Tapping it opens the place, feeding the gem / contribution loop.
 */
export function DiscoveryCard({ item }: { item: { place: DiscoveryPlace } }) {
  const p = item.place;
  const href = `#/place/${p.id}`;
  const open = (e: React.MouseEvent) => {
    e.preventDefault();
    track('discovery_click', { placeId: p.id });
    goTo(`/place/${p.id}`);
  };

  // Mono carries only values that are true, so each fragment is conditional.
  const meta = [
    [p.city, p.governorate].filter(Boolean).join(', ') || null,
    (p.rating ?? 0) > 0 ? `${Number(p.rating).toFixed(1)} ★` : null,
    p.reviewCount ? `${p.reviewCount} reviews` : null,
  ].filter(Boolean).join(' · ');

  return (
    <motion.article
      className="heritage-insert"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      <a className="heritage-insert-body" href={href} onClick={open}>
        <span className="heritage-insert-frame">
          <img src={getImageUrl(p.coverImage, 'place')} alt="" loading="lazy" />
        </span>
        <span className="heritage-insert-text">
          <span className="heritage-insert-kicker">Worth the detour</span>
          <span className="heritage-insert-name">{p.name}</span>
          {p.description && <span className="heritage-insert-desc">{p.description}</span>}
          {meta && <span className="heritage-insert-meta">{meta}</span>}
          <span className="heritage-insert-cta">Discover <span aria-hidden="true">&rarr;</span></span>
        </span>
      </a>
    </motion.article>
  );
}
