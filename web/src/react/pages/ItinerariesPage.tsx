import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { Map as MapIcon, CalendarDays, Crown, Mountain, Eye, X, Compass, Bookmark } from 'lucide-react';
import * as api from '../../api';
import { showToast } from '../../ui-utils';

// Migrated from vanilla pages/itineraries.ts — same classes, same data + mock
// fallback, same detail modal (portaled to body).

const mockItineraries = [
  { id: '1', title: '3-Day Tunis & Carthage Discovery', description: 'Explore the capital city, visit the ancient Carthage ruins, and wander through Sidi Bou Said. Perfect for first-time visitors wanting to experience the cultural heart of Tunisia.', duration: 3, difficulty: 'easy', isPremium: false, image: 'https://images.unsplash.com/photo-1680600855512-441b69ef3d18?w=600&q=80' },
  { id: '2', title: 'Sahara Desert Adventure', description: 'Journey from Tozeur to Douz, experience a desert camp under the stars, ride camels across dunes, and visit the mountain oases of Chebika, Tamerza, and Mides.', duration: 5, difficulty: 'moderate', isPremium: true, image: 'https://images.unsplash.com/photo-1689742855019-a09e208930e8?w=600&q=80' },
  { id: '3', title: 'Coastal Tunisia: Beaches & Medinas', description: "From Bizerte to Sousse, discover Tunisia's stunning Mediterranean coast. Visit Tabarka's coral reefs, Hammamet's resorts, and the UNESCO medina of Sousse.", duration: 7, difficulty: 'easy', isPremium: false, image: 'https://images.unsplash.com/photo-1598554200951-b9f36526ecd9?w=600&q=80' },
  { id: '4', title: 'Ancient Heritage Trail', description: "Visit El Jem's colossal amphitheatre, Dougga's complete Roman city, Bulla Regia's underground villas, and Kairouan's Great Mosque. A journey through 3,000 years of history.", duration: 4, difficulty: 'moderate', isPremium: true, image: 'https://images.unsplash.com/photo-1611094184403-df84cdcc7523?w=600&q=80' },
  { id: '5', title: 'Djerba Island Escape', description: "Relax on pristine beaches, explore Erriadh's street art, visit the ancient El Ghriba synagogue, and taste the freshest seafood in North Africa.", duration: 3, difficulty: 'easy', isPremium: false, image: 'https://images.unsplash.com/photo-1653173449794-09b4ec96a17f?w=600&q=80' },
];

const DIFF_TINT: Record<string, string> = {
  easy: 'var(--success)',
  moderate: 'var(--amber)',
  hard: 'var(--coral)',
  challenging: 'var(--coral)',
};

const diffStyle = (tint: string) => ({ ['--diff-tint']: tint } as React.CSSProperties);

function coverOf(it: any): string {
  return api.getImageUrl(it.coverImage || it.image || (it.images && it.images[0]) || '');
}

function ItineraryModal({ it, onClose }: { it: any; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const diff = (it.difficulty || 'easy').toLowerCase();
  const tint = DIFF_TINT[diff] || 'var(--success)';
  const cover = coverOf(it);

  const close = useCallback(() => {
    setOpen(false);
    document.body.style.overflow = '';
    window.setTimeout(onClose, 240);
  }, [onClose]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setOpen(true));
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [close]);

  return createPortal(
    <div className={`itinerary-modal ${open ? 'open' : ''}`} role="dialog" aria-modal="true" style={diffStyle(tint)}>
      <div className="itinerary-modal-overlay" onClick={close} />
      <div className="itinerary-modal-card" role="document">
        <button type="button" className="itinerary-modal-close" aria-label="Close" onClick={close}>
          <X />
        </button>
        <div className="itinerary-modal-cover" style={{ backgroundImage: `url('${cover}')` }}>
          <div className="itinerary-modal-cover-overlay" aria-hidden="true" />
          <div className="itinerary-modal-cover-tags">
            <span className="itinerary-duration-tag"><CalendarDays /> {it.duration} day{it.duration === 1 ? '' : 's'}</span>
            {it.isPremium && <span className="itinerary-pro-tag"><Crown /> Pro</span>}
          </div>
          <h2>{it.title}</h2>
        </div>
        <div className="itinerary-modal-body">
          <div className="itinerary-modal-meta">
            <span className="itinerary-modal-meta-chip"><Mountain /> {diff}</span>
            <span className="itinerary-modal-meta-chip"><CalendarDays /> {it.duration} day{it.duration === 1 ? '' : 's'}</span>
          </div>
          <p className="itinerary-modal-desc">{it.description}</p>
          <div className="itinerary-modal-actions">
            {it.isPremium ? (
              <a href="#/premium" className="btn btn-primary itinerary-modal-cta"><Crown /> Unlock with Pro</a>
            ) : (
              <a href="#/explore" className="btn btn-primary itinerary-modal-cta"><Compass /> Start exploring</a>
            )}
            <button type="button" className="btn btn-outline itinerary-modal-save" onClick={() => showToast('Itinerary saved')}>
              <Bookmark /> Save
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function ItinerariesPage() {
  const [selected, setSelected] = useState<any | null>(null);
  const { data: itineraries, isLoading } = useQuery({
    queryKey: ['itineraries'],
    queryFn: async () => {
      try {
        const its = await api.getItineraries();
        if (its?.length) return its;
      } catch {
        /* fall through */
      }
      return mockItineraries;
    },
  });

  return (
    <div className="itineraries-page page-enter">
      <section className="itineraries-hero">
        <div className="itineraries-hero-bg" aria-hidden="true" />
        <div className="itineraries-hero-mesh" aria-hidden="true" />
        <div className="itineraries-hero-orbs" aria-hidden="true">
          <span className="itineraries-hero-orb" />
          <span className="itineraries-hero-orb" />
        </div>
        <div className="itineraries-hero-content">
          <span className="itineraries-eyebrow"><MapIcon /> Curated journeys</span>
          <h1>Trip <span className="itineraries-accent">itineraries</span></h1>
          <p>Multi-day plans designed by local experts and seasoned travelers — from Sahara nights to coastal road trips.</p>
        </div>
      </section>

      <div className="itineraries-grid">
        {isLoading ? (
          <div className="itineraries-loading"><div className="spinner" /><p>Loading itineraries…</p></div>
        ) : (
          (itineraries || []).map((it) => {
            const diff = (it.difficulty || 'easy').toLowerCase();
            const tint = DIFF_TINT[diff] || 'var(--success)';
            return (
              <article key={it.id} className="itinerary-card reveal-on-scroll" style={diffStyle(tint)}>
                <div className="itinerary-card-cover" style={{ backgroundImage: `url('${coverOf(it)}')` }}>
                  <div className="itinerary-card-cover-overlay" aria-hidden="true" />
                  <div className="itinerary-card-cover-tags">
                    <span className="itinerary-duration-tag"><CalendarDays /> {it.duration} day{it.duration === 1 ? '' : 's'}</span>
                    {it.isPremium && <span className="itinerary-pro-tag"><Crown /> Pro</span>}
                  </div>
                  <h3 className="itinerary-card-title">{it.title}</h3>
                </div>
                <div className="itinerary-card-body">
                  <div className="itinerary-difficulty"><Mountain /> {diff}</div>
                  <p className="itinerary-desc">{it.description}</p>
                  <button type="button" className="btn btn-outline btn-sm itinerary-view-btn" onClick={() => setSelected(it)}>
                    <Eye /> View full itinerary
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {selected && <ItineraryModal it={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
