import '../../styles/events.css';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays, Music2, Theater, UtensilsCrossed, Trophy, Palette,
  Tag, Sparkles, MapPin, Clock, Users, Check, Plus, CalendarX, RotateCcw,
} from 'lucide-react';
import * as api from '../../api';
import { isFlagged, toggleFlag, requireAuth } from '../../ui-utils';
import { useCity } from '../lib/useCity';

// Migrated from vanilla pages/events.ts — same classes, same api.getEvents +
// mock fallback, same attend flow (local flag + optimistic + celebrate).

const eventImages: Record<string, string> = {
  'carthage-festival': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop',
  'tabarka-jazz': 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&h=400&fit=crop',
  'douz-sahara': 'https://images.unsplash.com/photo-1509316785289-ef98d7f4e7e8?w=600&h=400&fit=crop',
  'djerba-street': 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=600&h=400&fit=crop',
  'olive-oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&h=400&fit=crop',
  'medina-night': 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=600&h=400&fit=crop',
};

interface CategoryDef {
  id: string;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
  tint: string;
}

const CATEGORIES: CategoryDef[] = [
  { id: 'all', label: 'All Events', Icon: CalendarDays, tint: 'var(--text-secondary)' },
  { id: 'Music', label: 'Music', Icon: Music2, tint: 'var(--coral)' },
  { id: 'Culture', label: 'Culture', Icon: Theater, tint: 'var(--mediterranean)' },
  { id: 'Food', label: 'Food', Icon: UtensilsCrossed, tint: 'var(--olive)' },
  { id: 'Sports', label: 'Sports', Icon: Trophy, tint: 'var(--gold)' },
  { id: 'Art', label: 'Art', Icon: Palette, tint: 'var(--accent)' },
];

const CATEGORY_TINTS: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.tint]));

const tintStyle = (tint: string) => ({ ['--cat-tint']: tint } as React.CSSProperties);

function EventCard({ ev, featured }: { ev: any; featured?: boolean }) {
  const [attending, setAttending] = useState(!!ev.attending || isFlagged('event:' + ev.id + ':attend'));
  const [celebrating, setCelebrating] = useState(false);

  const month = ev.month || (ev.date ? new Date(ev.date).toLocaleString('en', { month: 'short' }).toUpperCase() : '');
  const day = ev.day || (ev.date ? new Date(ev.date).getDate().toString().padStart(2, '0') : '');
  const image = ev.image || eventImages[ev.id] || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop';
  const tint = CATEGORY_TINTS[ev.category] || 'var(--accent)';
  const attendees = (Number(ev.attendees) || 0) + (attending && !ev.attending ? 1 : 0);

  const onAttend = () => {
    if (!requireAuth('attend events')) return;
    if (attending) return;
    setAttending(true);
    setCelebrating(true);
    toggleFlag('event:' + ev.id + ':attend');
    try {
      api.attendEvent(ev.id);
    } catch {
      /* best-effort */
    }
    window.setTimeout(() => setCelebrating(false), 600);
  };

  return (
    <article
      className={`event2-card${featured ? ' event2-card-featured' : ''} reveal-on-scroll`}
      data-event-id={ev.id}
      style={tintStyle(tint)}
    >
      <div className="event2-img">
        <img src={image} alt={ev.title} loading="lazy" />
        <span className="event2-cat"><Tag /> {ev.category || 'Event'}</span>
        {featured && <span className="event2-featured-badge"><Sparkles /> Featured</span>}
      </div>
      <div className="event2-body">
        <div className="event2-date" aria-label={`${month} ${day}`}>
          <span className="event2-month">{month}</span>
          <span className="event2-day">{day}</span>
        </div>
        <div className="event2-info">
          <h3 className="event2-title">{ev.title}</h3>
          {ev.location && <p className="event2-location"><MapPin /> {ev.location}</p>}
          {ev.time && <p className="event2-time"><Clock /> {ev.time}</p>}
          <div className="event2-footer">
            <span className="event2-attendees">
              <Users /> <strong>{attendees}</strong> attending
            </span>
            <button
              type="button"
              className={`event2-attend-btn ${attending ? 'is-attended' : ''} ${celebrating ? 'is-celebrating' : ''}`}
              aria-pressed={attending}
              onClick={onAttend}
            >
              {attending ? <Check /> : <Plus />}
              <span>{attending ? 'Attending' : 'Attend'}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Skeleton() {
  return (
    <div className="event2-card event2-skeleton" aria-hidden="true">
      <div className="event2-skel-img" />
      <div className="event2-skel-body">
        <div className="event2-skel-line w-70" />
        <div className="event2-skel-line w-50" />
        <div className="event2-skel-line w-75" />
        <div className="event2-skel-footer">
          <div className="event2-skel-pill" />
          <div className="event2-skel-btn" />
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [filter, setFilter] = useState('all');
  const globalCity = useCity();
  const { data: allEvents, isLoading } = useQuery({
    queryKey: ['events', globalCity],
    queryFn: async () => {
      // No mock fallback: an empty result is a real answer and must show the
      // empty state, never fabricated demo events.
      try {
        const evs = await api.getEvents(undefined, globalCity || undefined);
        return (evs?.length ? evs : []) as any[];
      } catch {
        return [] as any[];
      }
    },
  });

  const list = !allEvents
    ? []
    : filter === 'all'
      ? allEvents
      : allEvents.filter((e) => e.category === filter);
  const activeLabel = CATEGORIES.find((c) => c.id === filter)?.label || 'matching';

  return (
    <div className="events-page page-enter">
      <section className="event2-hero">
        <div className="event2-hero-gradient" aria-hidden="true" />
        <div className="event2-hero-mesh" aria-hidden="true" />
        <div className="event2-hero-orbs" aria-hidden="true">
          <span className="event2-hero-orb" />
          <span className="event2-hero-orb" />
        </div>
        <div className="event2-hero-content">
          <span className="event2-eyebrow"><CalendarDays /> Don't miss out</span>
          <h1>What's happening in <span className="event2-accent">Tunisia</span></h1>
          <p>Festivals, cultural tours, food tastings, and unforgettable experiences across the country.</p>
        </div>
      </section>

      <nav className="event2-filters-wrapper" aria-label="Event category filter">
        <div className="event2-filters" role="tablist">
          {CATEGORIES.map((c) => {
            const active = c.id === filter;
            const Icon = c.Icon;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                className={`event2-filter${active ? ' active' : ''}`}
                style={tintStyle(c.tint)}
                aria-selected={active}
                onClick={() => setFilter(c.id)}
              >
                <span className="event2-filter-icon"><Icon /></span>
                {c.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="event2-grid">
        {isLoading ? (
          [1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} />)
        ) : list.length === 0 ? (
          <div className="event2-empty">
            <div className="event2-empty-icon"><CalendarX /></div>
            <h3>No {activeLabel.toLowerCase()} events on the calendar</h3>
            <p>Check back soon — new ones land here as the community shares them.</p>
            <button type="button" className="btn btn-outline" onClick={() => setFilter('all')}>
              <RotateCcw /> Show all events
            </button>
          </div>
        ) : (
          list.map((ev, i) => <EventCard key={ev.id} ev={ev} featured={i === 0 && list.length >= 3} />)
        )}
      </div>
    </div>
  );
}
