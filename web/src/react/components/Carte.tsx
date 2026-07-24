import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Heart } from 'lucide-react';
import { getImageUrl } from '../../shared/api';
import { coverPlaceholder } from '../../shared/placeholder';

export interface CartePlace {
  id: string;
  name: string;
  coverImage?: string | null;
  images?: string[];
  city?: string;
  governorate?: string;
  rating?: number;
  reviewCount?: number;
  category?: string | { name?: string } | null;
  isFeatured?: boolean;
}

interface CarteProps {
  place: CartePlace;
  /** Index in a grid — drives the scattered-postcard tilt. */
  index?: number;
  href?: string;
  isSaved?: boolean;
  onToggleSave?: (e: React.MouseEvent) => void;
}

/**
 * Carte — THE atomic place card, styled as a "carte postale" so every place
 * across the app (Explore, Favorites, Search, feed injections…) speaks the
 * carnet identity instead of a generic web card: a paper mat, a pasted photo
 * print with a strip of masking tape, a postage-stamp rating, a rubber-stamp
 * "Featured". Extends the landing's `.ej-postcard` language. Styles live in
 * styles/carte.css. This is the single card component the team asked to extract
 * — reuse it everywhere rather than re-inventing per page.
 */
export function Carte({ place, index = 0, href, isSaved, onToggleSave }: CarteProps) {
  const initial =
    getImageUrl(place.coverImage || place.images?.[0]) || coverPlaceholder(place.id, place.name);
  const [src, setSrc] = useState(initial);

  const locality = [place.city, place.governorate].filter(Boolean).join(', ');
  const rating = Number(place.rating) || 0;
  const reviews = Number(place.reviewCount) || 0;
  const category =
    typeof place.category === 'string' ? place.category : place.category?.name || '';
  const link = href || `#/place/${place.id}`;

  return (
    <motion.article
      className="carte"
      data-tilt={index % 3}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      <a className="carte-link" href={link} aria-label={`View ${place.name}`}>
        <figure className="carte-photo">
          <img
            src={src}
            alt={place.name}
            loading="lazy"
            onError={() => setSrc(coverPlaceholder(place.id, place.name))}
          />
          <span className="carte-tape" aria-hidden="true" />
          {place.isFeatured && <span className="carte-featured">Featured</span>}
          {rating > 0 && (
            <span className="carte-stamp">
              <Star size={11} aria-hidden="true" /> {rating.toFixed(1)}
            </span>
          )}
        </figure>
        <div className="carte-body">
          {category && <span className="carte-kicker">{category}</span>}
          <h3 className="carte-title">{place.name}</h3>
          <p className="carte-postmark">
            <MapPin size={12} aria-hidden="true" />
            <span className="carte-postmark-text">
              {locality || 'Tunisia'}
              {reviews > 0 ? ` · ${reviews} review${reviews === 1 ? '' : 's'}` : ''}
            </span>
          </p>
        </div>
      </a>
      {onToggleSave && (
        <button
          type="button"
          className={`carte-fav${isSaved ? ' is-saved' : ''}`}
          aria-pressed={!!isSaved}
          aria-label={isSaved ? `Remove ${place.name} from saved` : `Save ${place.name}`}
          onClick={onToggleSave}
        >
          <Heart size={16} aria-hidden="true" className={isSaved ? 'carte-fav-filled' : ''} />
        </button>
      )}
    </motion.article>
  );
}

export default Carte;
