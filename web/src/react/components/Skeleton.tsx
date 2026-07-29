import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rect' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
}

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
          // `.skeleton` (animations.css) carries the token-driven gradient, the
          // canonical bled-shimmer at the spec 1.4s, and its own reduced-motion
          // guard. This used to hardcode Tailwind greys at 2s with no guard,
          // which is why it never matched any other loading surface.
          className={cn('skeleton', variants[variant], className)}
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
