import React, { useRef, useState } from 'react';

// Swipeable image carousel for multi-image posts: native horizontal scroll-snap
// (smooth on touch), animated dot indicators, and a count pill. A single image
// renders as a plain tappable frame. Tapping a slide opens the post.

export function PostImageCarousel({ images, onOpen, priority = false }: { images: string[]; onOpen: () => void; priority?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  // Distinguish a tap (→ open the post) from a swipe (→ just scroll).
  const downX = useRef<number | null>(null);
  const moved = useRef(false);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== idx) setIdx(i);
  };

  const onPointerDown = (e: React.PointerEvent) => { downX.current = e.clientX; moved.current = false; };
  const onPointerMove = (e: React.PointerEvent) => {
    if (downX.current !== null && Math.abs(e.clientX - downX.current) > 8) moved.current = true;
  };
  const onSlideClick = () => { if (!moved.current) onOpen(); };

  if (images.length === 1) {
    return (
      <button
        type="button"
        className="post-carousel post-carousel-single"
        onClick={onOpen}
        aria-label="Open post"
        /* The LCP candidate must paint the instant it decodes, so it opts out of
           the reveal entirely rather than wiping in behind a clip-path. */
        data-arch-reveal={priority ? undefined : ''}
      >
        {/* The first post's image is usually the page's LCP — don't lazy it. */}
        <img
          src={images[0]}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
        />
      </button>
    );
  }

  return (
    /* Reveal the whole media unit, not the track: the counter and dots belong to
       the same print and should arrive with it. The 16:9 box is reserved on the
       track, so the wrapper has height before the images load. */
    <div className="post-carousel" data-arch-reveal={priority ? undefined : ''}>
      <div
        ref={trackRef}
        className="post-carousel-track scrollbar-hide"
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
      >
        {images.map((src, i) => (
          <button
            type="button"
            key={i}
            className="post-carousel-slide"
            onClick={onSlideClick}
            aria-label={`Image ${i + 1} of ${images.length} — open post`}
          >
            <img src={src} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      <span className="post-carousel-counter">{idx + 1}/{images.length}</span>
      <div className="post-carousel-dots" aria-hidden="true">
        {images.map((_, i) => (
          <span key={i} className={`post-carousel-dot${i === idx ? ' is-active' : ''}`} />
        ))}
      </div>
    </div>
  );
}
