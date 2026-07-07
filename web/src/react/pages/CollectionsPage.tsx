import '../../styles/collections.css';
import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { Layers, MapPin, X, Compass, Map as MapIcon } from 'lucide-react';
import * as api from '../../api';

// Migrated from vanilla pages/collections.ts — same classes, same data +
// mock fallback, same detail modal (portaled to body, enter/exit animation).

const mockCollections = [
  { id: '1', title: 'Best Beach Destinations', placeIds: ['3', '7', '8'], coverImage: 'https://images.unsplash.com/photo-1598554200951-b9f36526ecd9?w=600&q=80', description: "Crystal-clear waters and golden sand along Tunisia's Mediterranean coast." },
  { id: '2', title: 'UNESCO World Heritage Sites', placeIds: ['2', '4', '6'], coverImage: 'https://images.unsplash.com/photo-1770712857881-2133f72fcab7?w=600&q=80', description: "Explore Tunisia's 8 UNESCO-listed treasures spanning millennia of history." },
  { id: '3', title: 'Top Food Experiences', placeIds: ['1', '4'], coverImage: 'https://images.unsplash.com/photo-1742806418170-f051cb880314?w=600&q=80', description: 'From street food to fine dining, the best culinary stops in Tunisia.' },
  { id: '4', title: 'Desert & Oasis Adventures', placeIds: ['5'], coverImage: 'https://images.unsplash.com/photo-1689742855019-a09e208930e8?w=600&q=80', description: 'Journey into the Sahara and discover hidden oases.' },
  { id: '5', title: 'Architecture & Medinas', placeIds: ['1', '4', '8'], coverImage: 'https://images.unsplash.com/photo-1677942269665-1a08bf81d362?w=600&q=80', description: 'Centuries of Islamic, Ottoman, and colonial architecture.' },
  { id: '6', title: 'Hidden Gems', placeIds: ['7'], coverImage: 'https://images.unsplash.com/photo-1653173449794-09b4ec96a17f?w=600&q=80', description: 'Off-the-beaten-path destinations most tourists never find.' },
];

function placeCount(col: any): number {
  return col.placeIds?.length || 0;
}

function CollectionModal({ col, onClose }: { col: any; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const count = placeCount(col);
  const cover = api.getImageUrl(col.coverImage || col.image || '');

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
    <div className={`collection-modal ${open ? 'open' : ''}`} role="dialog" aria-modal="true">
      <div className="collection-modal-overlay" onClick={close} />
      <div className="collection-modal-card" role="document">
        <button type="button" className="collection-modal-close" aria-label="Close" onClick={close}>
          <X />
        </button>
        <div className="collection-modal-cover" style={{ backgroundImage: `url('${cover}')` }}>
          <div className="collection-modal-cover-overlay" aria-hidden="true" />
          <div className="collection-modal-cover-tags">
            <span className="collection-modal-count-tag">
              <MapPin /> {count} place{count === 1 ? '' : 's'}
            </span>
          </div>
          <h2>{col.title}</h2>
        </div>
        <div className="collection-modal-body">
          <p className="collection-modal-desc">{col.description || ''}</p>
          <div className="collection-modal-actions">
            <a href="#/explore" className="btn btn-primary collection-modal-cta"><Compass /> Explore places</a>
            <a href="#/map" className="btn btn-outline"><MapIcon /> View on map</a>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function CollectionsPage() {
  const [selected, setSelected] = useState<any | null>(null);
  const { data: collections, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      try {
        const cols = await api.getCollections();
        if (cols?.length) return cols;
      } catch {
        /* fall through */
      }
      return mockCollections;
    },
  });

  return (
    <div className="collections-page page-enter">
      <section className="collections-hero">
        <div className="collections-hero-bg" aria-hidden="true" />
        <div className="collections-hero-mesh" aria-hidden="true" />
        <div className="collections-hero-orbs" aria-hidden="true">
          <span className="collections-hero-orb" />
          <span className="collections-hero-orb" />
        </div>
        <div className="collections-hero-content">
          <span className="collections-eyebrow"><Layers /> Editor's picks</span>
          <h1>Curated <span className="collections-accent">collections</span></h1>
          <p>Hand-picked sets of places grouped by theme — UNESCO sites, hidden beaches, food trails, and more.</p>
        </div>
      </section>

      <div className="collections-grid">
        {isLoading ? (
          <div className="collections-loading"><div className="spinner" /><p>Loading collections…</p></div>
        ) : (
          (collections || []).map((col) => {
            const count = placeCount(col);
            const cover = api.getImageUrl(col.coverImage || col.image || (col.images && col.images[0]) || '');
            return (
              <article key={col.id} className="collection-card reveal-on-scroll" data-col-id={col.id}>
                <button type="button" className="collection-card-link" aria-label={`Open ${col.title}`} onClick={() => setSelected(col)}>
                  <div className="collection-card-image">
                    <img src={cover} alt="" loading="lazy" />
                    <div className="collection-card-overlay" aria-hidden="true" />
                    <div className="collection-card-info">
                      <h3>{col.title}</h3>
                      <span className="collection-card-count">
                        <MapPin /> {count} place{count === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </button>
                {col.description && <p className="collection-card-desc">{col.description}</p>}
              </article>
            );
          })
        )}
      </div>

      {selected && <CollectionModal col={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
