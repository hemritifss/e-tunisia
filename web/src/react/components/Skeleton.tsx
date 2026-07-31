import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rect' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
}

/**
 * Loading placeholder.
 *
 * Paints with the carnet `.skeleton-block` (dashed pencil outline + faint
 * hatching, from skeletons.css) rather than a grey shimmer. It used to use
 * Tailwind `bg-gray-*` gradients, which meant the two most-visited pages — the
 * feed and Explore — showed grey shimmer boxes while every other route showed
 * pencil sketches. Loading states were the last place in the app still speaking
 * a second design language.
 *
 * The API is unchanged, so all existing call sites keep working; only the paint
 * differs. Tailwind loads after skeletons.css, so the `rounded-*` variants below
 * still win over the base block's radius.
 */
export const Skeleton = ({
  variant = 'text',
  width,
  height,
  count = 1,
  className,
  ...props
}: SkeletonProps) => {
  const variants = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rect: 'rounded-lg',
    card: 'rounded-2xl',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          // Team call (c09e8b53): paint with the carnet `.skeleton-block`
          // pencil sketch so every loading surface speaks one language. It
          // breathes via bled-breathe and inherits its reduced-motion guard
          // from skeletons.css.
          className={cn('skeleton-block', variants[variant], className)}
          style={style}
          {...props}
        />
      ))}
    </>
  );
};

/* PlaceCardSkeleton lived here with a single reference: a dead import in
   ExplorePage that never rendered it. Explore's grid loads `.explore-skel`
   instead, and the real place card is <Carte>. Removed rather than left as a
   third, unrendered place-card shape. */

/**
 * Mirrors the rules layout of a real post, block for block, so the crossfade
 * to content lands without a layout shift.
 */
export const PostCardSkeleton = () => (
  <article className="post-skeleton" aria-hidden="true">
    <div className="post-skeleton-head">
      <span className="post-skeleton-avatar" />
      <span className="post-skeleton-bar" style={{ width: '30%' }} />
    </div>
    <span className="post-skeleton-title" />
    <span className="post-skeleton-title" style={{ width: '62%' }} />
    <span className="post-skeleton-bar" style={{ width: '96%' }} />
    <span className="post-skeleton-bar" style={{ width: '88%' }} />
    <span className="post-skeleton-media" />
  </article>
);
