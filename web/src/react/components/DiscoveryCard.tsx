import React from 'react';
import { motion } from 'framer-motion';
import { Compass, MapPin, ArrowRight } from 'lucide-react';
import { getImageUrl } from '../../shared/api';
import { goTo } from '../../router';
import { track } from '../../analytics';
import { StarRating } from './StarRating';

interface DiscoveryPlace {
  id: string;
  name: string;
  slug?: string;
  city?: string;
  governorate?: string;
  coverImage?: string | null;
  rating?: number;
  reviewCount?: number;
  category?: string | null;
}

/**
 * In-feed discovery card — a quality place the viewer hasn't visited, injected
 * (~1 in 7) by the ranked feed. Tapping it opens the place, feeding the gem /
 * contribution loop ("been here? add a tip").
 */
export function DiscoveryCard({ item }: { item: { place: DiscoveryPlace } }) {
  const p = item.place;
  const href = `#/place/${p.id}`;
  const open = () => {
    track('discovery_click', { placeId: p.id });
    goTo(`/place/${p.id}`);
  };
  const locality = [p.city, p.governorate].filter(Boolean).join(', ');

  return (
    <motion.article
      className="discovery-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="discovery-card-kicker">
        <Compass size={13} /> Worth the detour
      </div>
      <a className="discovery-card-body" href={href} onClick={(e) => { e.preventDefault(); open(); }}>
        <div className="discovery-card-cover">
          <img src={getImageUrl(p.coverImage, 'place')} alt="" loading="lazy" />
          {p.category && <span className="discovery-card-cat">{p.category}</span>}
        </div>
        <div className="discovery-card-meta">
          <h3 className="discovery-card-name">{p.name}</h3>
          {locality && (
            <p className="discovery-card-loc"><MapPin size={12} /> {locality}</p>
          )}
          {(p.rating ?? 0) > 0 && (
            <div className="discovery-card-rating">
              <StarRating rating={p.rating || 0} size={13} />
              {p.reviewCount ? <span className="discovery-card-count">({p.reviewCount})</span> : null}
            </div>
          )}
        </div>
      </a>
      <button className="discovery-card-cta" type="button" onClick={open}>
        Discover <ArrowRight size={14} />
      </button>
    </motion.article>
  );
}
