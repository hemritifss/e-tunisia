import '../../styles/badges.css';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Award, Trophy, Star, Footprints, Pencil, Mountain, Lightbulb, Camera, MapPin,
  Landmark, Utensils, MessageCircle, Compass, Flame, Users, BookOpen, Heart,
  Calendar, Map, Tag, TrendingUp, Lock, CircleCheckBig,
} from 'lucide-react';
import * as api from '../../api';

// Migrated from vanilla pages/badges.ts — gamification surface.
// Badge `icon` is a dynamic "lucide-xxx" string; map mirrors icons.ts coverage.

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  award: Award, trophy: Trophy, star: Star, footprints: Footprints, pencil: Pencil,
  mountain: Mountain, lightbulb: Lightbulb, camera: Camera, 'map-pin': MapPin,
  landmark: Landmark, utensils: Utensils, 'message-circle': MessageCircle, compass: Compass,
  flame: Flame, users: Users, 'book-open': BookOpen, heart: Heart, calendar: Calendar,
  map: Map, tag: Tag, 'trending-up': TrendingUp,
};

function BadgeIcon({ icon }: { icon?: string }) {
  const name = (icon || 'lucide-award').replace(/^lucide-/, '');
  const Cmp = ICON_MAP[name] || Award;
  return <Cmp />;
}

function BadgeCard({ b }: { b: any }) {
  const earned = !!b.earned;
  const cat = (b.category || '').toLowerCase();
  return (
    <article className={`badge-card ${earned ? 'is-earned' : 'is-locked'}`} data-cat={cat}>
      <div className="badge-icon">
        {!earned && <span className="badge-lock-overlay" aria-hidden="true"><Lock /></span>}
        <BadgeIcon icon={b.icon} />
      </div>
      <h4 className="badge-name">{b.name}</h4>
      <p className="badge-desc">{b.description || ''}</p>
      {b.category && <span className="badge-cat" data-cat={cat}>{b.category}</span>}
      {earned
        ? <span className="badge-status is-earned"><CircleCheckBig /> Earned</span>
        : <span className="badge-status is-locked"><Lock /> Locked</span>}
    </article>
  );
}

export default function BadgesPage() {
  const { data: badges = [], isLoading } = useQuery({
    queryKey: ['all-badges'],
    queryFn: async () => {
      // No mock fallback: never show fabricated "earned" badges. Real catalog or empty.
      try {
        const b = await api.getAllBadges();
        return (b?.length ? b : []) as any[];
      } catch {
        return [] as any[];
      }
    },
  });

  const earned = badges.filter((b: any) => b.earned).length;
  const total = badges.length || 1;
  const pct = Math.round((earned / total) * 100);
  const sorted = [...badges].sort((a: any, b: any) => Number(!!b.earned) - Number(!!a.earned));

  return (
    <div className="badges-page page-enter">
      <header className="badges-hero">
        <div className="badges-hero-bg" aria-hidden="true" />
        <div className="badges-hero-mesh" aria-hidden="true" />
        <div className="badges-hero-orbs" aria-hidden="true"><span className="badges-hero-orb" /><span className="badges-hero-orb" /></div>
        <div className="badges-hero-content">
          <span className="badges-eyebrow"><Award /> Achievements</span>
          <h1>Badges &amp; <span className="badges-accent">milestones</span></h1>
          <p>Explore Tunisia and earn badges for your adventures. Complete challenges to unlock new achievements.</p>
        </div>
      </header>

      <section className="badges-stats" id="badges-stats" aria-label="Badge progress">
        {!isLoading && badges.length > 0 && (
          <>
            <div className="badges-progress-card">
              <div className="badges-progress-head">
                <div><strong>{earned} of {total} badges earned</strong><span>Keep exploring to unlock more</span></div>
                <div className="badges-progress-pct">{pct}%</div>
              </div>
              <div className="badges-progress-bar"><span style={{ width: `${pct}%` }} /></div>
            </div>
            <div className="badges-stat-tiles">
              <div className="badges-stat-card is-earned"><div className="badges-stat-icon"><CircleCheckBig /></div><strong>{earned}</strong><span>Earned</span></div>
              <div className="badges-stat-card is-locked"><div className="badges-stat-icon"><Lock /></div><strong>{total - earned}</strong><span>Locked</span></div>
              <div className="badges-stat-card is-progress"><div className="badges-stat-icon"><TrendingUp /></div><strong>{pct}%</strong><span>Complete</span></div>
            </div>
          </>
        )}
      </section>

      <section className="badges-grid-section">
        {!isLoading && badges.length === 0 ? (
          // Empty catalog rendered nothing before — hero floating over blank space.
          <div className="badges-empty">
            <div className="badges-empty-icon" aria-hidden="true"><Award /></div>
            <h2>No badges yet</h2>
            <p>Badges appear here as you explore Tunisia — check in to places, write reviews, and plan trips to start earning them.</p>
            <a href="#/explore" className="btn btn-primary"><Compass size={16} /> Start exploring</a>
          </div>
        ) : (
          <div className="badges-grid" id="badges-grid">
            {isLoading ? (
              <div className="badges-skeleton">
                <div className="sk-grid">{Array.from({ length: 6 }).map((_, i) => <div className="sk-badge-card skeleton-block" key={i} />)}</div>
              </div>
            ) : (
              sorted.map((b: any) => <BadgeCard key={b.id || b.name} b={b} />)
            )}
          </div>
        )}
      </section>
    </div>
  );
}
