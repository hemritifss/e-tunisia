import React from 'react';

// ============================================================================
// Route skeletons — the shape of the page, drawn before the data lands.
//
// These replace the blocking <TunisiaLoader/> spinners that used to sit in the
// middle of an otherwise empty page. A spinner says "wait"; a skeleton says
// "here is what is coming, and where" — so when content arrives nothing jumps.
//
// Built on the carnet `.skeleton-block` class (skeletons.css): dashed pencil
// outline + faint hatching, not a grey shimmer. That keeps loading states in
// the same design language as the rest of the app instead of looking like a
// generic component library dropped on top.
//
// Prefer the closest-matching layout below over a bare <Sk/>: the whole point
// is that the placeholder occupies the same box the real content will.
// ============================================================================

/** Base pencil-sketch block. Everything here composes from it. */
export function Sk({
  w,
  h,
  radius,
  className,
  style,
}: {
  w?: string | number;
  h?: string | number;
  radius?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`skeleton-block${className ? ` ${className}` : ''}`}
      style={{
        width: typeof w === 'number' ? `${w}px` : w,
        height: typeof h === 'number' ? `${h}px` : h,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

/**
 * Wrapper that marks a loading region for assistive tech. Screen readers get a
 * single honest "Loading" announcement instead of trying to read a wall of
 * decorative placeholder boxes.
 */
export function SkRegion({
  label,
  className,
  style,
  children,
}: {
  label: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className} style={style}>
      {/* Decorative boxes are hidden; the region's own label carries the meaning. */}
      <div aria-hidden="true" style={{ display: 'contents' }}>
        {children}
      </div>
    </div>
  );
}

/** One place/trip card: image band, title, meta line, footer row. */
export function CardSkeleton({ imageHeight = 168 }: { imageHeight?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <Sk h={imageHeight} radius="var(--radius-lg, 10px)" />
      <Sk h={16} w="72%" />
      <Sk h={12} w="45%" />
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Sk w={26} h={26} radius="50%" />
        <Sk h={12} w="38%" />
      </div>
    </div>
  );
}

/** Responsive card grid — Favorites, Saved, Explore, Discover Trips, Tag. */
export function CardGridSkeleton({
  count = 6,
  label = 'Loading',
  imageHeight,
  minCardWidth = 240,
}: {
  count?: number;
  label?: string;
  imageHeight?: number;
  minCardWidth?: number;
}) {
  return (
    <SkRegion
      label={label}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
        gap: '1.25rem',
        width: '100%',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} imageHeight={imageHeight} />
      ))}
    </SkRegion>
  );
}

/** Avatar + two lines, repeated — Leaderboard, Inquiries, follower lists. */
export function ListSkeleton({
  count = 6,
  label = 'Loading',
  avatar = true,
  rowHeight,
}: {
  count?: number;
  label?: string;
  avatar?: boolean;
  rowHeight?: number;
}) {
  return (
    <SkRegion label={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '0.75rem',
            minHeight: rowHeight,
            border: '1px solid var(--border-light, var(--border))',
            borderRadius: 'var(--radius-lg, 10px)',
          }}
        >
          {avatar && <Sk w={42} h={42} radius="50%" />}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {/* Staggered widths read as text, not as a stack of identical bars. */}
            <Sk h={14} w={`${68 - (i % 3) * 9}%`} />
            <Sk h={11} w={`${46 - (i % 2) * 8}%`} />
          </div>
        </div>
      ))}
    </SkRegion>
  );
}

/** Article-shaped: hero image, heading, paragraph rules — Place/Post detail. */
export function DetailSkeleton({ label = 'Loading', hero = 260 }: { label?: string; hero?: number }) {
  return (
    <SkRegion
      label={label}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 760, margin: '0 auto', width: '100%' }}
    >
      <Sk h={hero} radius="var(--radius-xl, 14px)" />
      <Sk h={28} w="65%" />
      <Sk h={14} w="35%" />
      <div style={{ display: 'flex', gap: '0.5rem', margin: '0.25rem 0' }}>
        <Sk h={30} w={96} radius="999px" />
        <Sk h={30} w={82} radius="999px" />
        <Sk h={30} w={70} radius="999px" />
      </div>
      <Sk h={13} w="97%" />
      <Sk h={13} w="92%" />
      <Sk h={13} w="88%" />
      <Sk h={13} w="60%" />
    </SkRegion>
  );
}

/** Stacked form fields — Settings, Profile edit, Onboarding steps. */
export function FormSkeleton({ fields = 5, label = 'Loading' }: { fields?: number; label?: string }) {
  return (
    <SkRegion
      label={label}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', maxWidth: 560, margin: '0 auto', width: '100%' }}
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Sk h={12} w={`${22 + (i % 3) * 7}%`} />
          <Sk h={44} radius="var(--radius-md, 6px)" />
        </div>
      ))}
    </SkRegion>
  );
}

/**
 * Own-profile skeleton. Drives the `.profile-skeleton` layout that already
 * shipped in skeletons.css but was never wired to a page — ProfilePage was
 * spinning instead. Structure mirrors the real profile exactly: cover, avatar,
 * actions, bio, meta, XP bar, stat tiles, quick links.
 */
export function ProfilePageSkeleton({ label = 'Loading profile' }: { label?: string }) {
  return (
    <SkRegion label={label} className="profile-skeleton">
      <div className="sk-cover skeleton-block">
        <div className="sk-cover-badge skeleton-block" />
      </div>

      <div className="sk-identity">
        <div className="sk-avatar skeleton-block" />
        <div className="sk-actions">
          <div className="sk-btn skeleton-block" />
          <div className="sk-btn skeleton-block" />
        </div>
      </div>

      <div className="sk-bio">
        <div className="sk-name skeleton-block" />
        <div className="sk-handle skeleton-block" />
        <div className="sk-bio-line skeleton-block" />
        <div className="sk-bio-line short skeleton-block" />
      </div>

      <div className="sk-meta">
        <div className="sk-meta-item skeleton-block" />
        <div className="sk-meta-item skeleton-block" />
      </div>

      <div className="sk-xp">
        <div className="sk-xp-header">
          <div className="sk-xp-label skeleton-block" />
          <div className="sk-xp-value skeleton-block" />
        </div>
        <div className="sk-xp-bar skeleton-block" />
        <div className="sk-xp-footer">
          <div className="sk-xp-ft skeleton-block" />
          <div className="sk-xp-ft skeleton-block" />
        </div>
      </div>

      <div className="sk-stats">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="sk-stat skeleton-block" />
        ))}
      </div>

      <div className="sk-links-title skeleton-block" />
      <div className="sk-links-grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="sk-link-card skeleton-block" />
        ))}
      </div>
    </SkRegion>
  );
}

/** A row of stat tiles above content — Credits, Owner, Passport headers. */
export function StatsRowSkeleton({ count = 4, label = 'Loading' }: { count?: number; label?: string }) {
  return (
    <SkRegion
      label={label}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))`,
        gap: '0.85rem',
        width: '100%',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Sk key={i} h={88} radius="var(--radius-lg, 10px)" />
      ))}
    </SkRegion>
  );
}
