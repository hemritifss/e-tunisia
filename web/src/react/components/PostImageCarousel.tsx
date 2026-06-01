import React, { useRef, useState } from 'react';

// Swipeable image carousel for multi-image posts: native horizontal scroll-snap
// (smooth on touch), animated dot indicators, and a count pill. A single image
// renders as a plain tappable frame. Tapping a slide opens the post.

export function PostImageCarousel({ images, onOpen }: { images: string[]; onOpen: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== idx) setIdx(i);
  };

  if (images.length === 1) {
    return (
      <button type="button" className="post-carousel post-carousel-single" onClick={onOpen} aria-label="Open post">
        <img src={images[0]} alt="" loading="lazy" />
      </button>
    );
  }

  return (
    <div className="post-carousel">
      <div ref={trackRef} className="post-carousel-track scrollbar-hide" onScroll={onScroll}>
        {images.map((src, i) => (
          <button
            type="button"
            key={i}
            className="post-carousel-slide"
            onClick={onOpen}
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
