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
          className={cn('skeleton-block', variants[variant], className)}
          style={style}
          {...props}
        />
      ))}
    </>
  );
};

export const PlaceCardSkeleton = () => (
  <div className="rounded-2xl overflow-hidden bg-surface shadow-sm">
    <Skeleton variant="rect" height={192} className="w-full rounded-none" />
    <div className="p-4 space-y-3">
      <Skeleton variant="text" width="70%" />
      <Skeleton variant="text" width="40%" />
      <div className="flex gap-2">
        <Skeleton variant="circle" width={32} height={32} />
        <Skeleton variant="text" width="50%" className="self-center" />
      </div>
    </div>
  </div>
);

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
