import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Clock } from 'lucide-react';
import { api } from '../../shared/api';
import { goTo } from '../../router';

/**
 * Shared search typeahead used by Explore and the Search page.
 *
 * - Types ≥ 2 chars → typo/accent-tolerant place suggestions from /places/suggest
 *   (so a divergent spelling still resolves to the canonical, Google-Maps-style name).
 * - Empty/too short → a "Recent searches" row (localStorage) for one-tap re-runs.
 *
 * Rendered in a portal so it escapes any `overflow:hidden` ancestor; the caller
 * attaches {@link anchorRef} to the wrapper around its own <input> and spreads
 * {@link inputProps} onto that input.
 */

export interface Suggestion {
  id: string;
  name: string;
  slug?: string;
  city?: string;
  governorate?: string;
  coverImage?: string | null;
}

// ── Recent searches (localStorage) ───────────────────────────────
const RECENTS_KEY = 'etunisia_recent_searches';
const RECENTS_MAX = 6;

export function getRecentSearches(): string[] {
  try {
    const a = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]');
    return Array.isArray(a) ? a.filter((x) => typeof x === 'string').slice(0, RECENTS_MAX) : [];
  } catch {
    return [];
  }
}
export function addRecentSearch(q: string): void {
  const term = (q || '').trim();
  if (term.length < 2) return;
  try {
    const rest = getRecentSearches().filter((x) => x.toLowerCase() !== term.toLowerCase());
    localStorage.setItem(RECENTS_KEY, JSON.stringify([term, ...rest].slice(0, RECENTS_MAX)));
  } catch {
    /* storage full / disabled — recents are best-effort */
  }
}
export function clearRecentSearches(): void {
  try { localStorage.removeItem(RECENTS_KEY); } catch { /* ignore */ }
}

/** Bold the matched slice of a name (case-insensitive substring; fuzzy-only hits render plain). */
function highlightMatch(name: string, q: string): React.ReactNode {
  const query = q.trim();
  if (!query) return name;
  const i = name.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return name;
  return (
    <>
      {name.slice(0, i)}
      <mark className="explore-suggest-mark">{name.slice(i, i + query.length)}</mark>
      {name.slice(i + query.length)}
    </>
  );
}

type Item =
  | { type: 'place'; place: Suggestion }
  | { type: 'recent'; label: string };

export interface UseSearchAutocomplete {
  /** Attach to the wrapper element around the <input> (used to position the menu). */
  anchorRef: React.RefObject<HTMLDivElement | null>;
  open: boolean;
  setOpen: (b: boolean) => void;
  /** Whether the menu is currently showing anything. */
  visible: boolean;
  /** Spread onto the <input>. */
  inputProps: {
    role: 'combobox';
    'aria-autocomplete': 'list';
    'aria-expanded': boolean;
    'aria-controls': string;
    'aria-activedescendant': string | undefined;
    onFocus: () => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  };
  /** The portal menu node — render it anywhere in the tree (it portals to <body>). */
  dropdown: React.ReactNode;
}

export function useSearchAutocomplete(params: {
  /** Current (controlled) input value. */
  query: string;
  /** Fill the box with a recent term and run the search (page-specific). */
  onPickRecent: (term: string) => void;
}): UseSearchAutocomplete {
  const { query, onPickRecent } = params;
  const baseId = useId();
  const listId = `${baseId}-listbox`;

  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [debounced, setDebounced] = useState('');
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null);
  const [recents, setRecents] = useState<string[]>([]);
  const anchorRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 150);
    return () => clearTimeout(t);
  }, [query]);
  useEffect(() => { setActiveIdx(-1); }, [debounced, open]);

  const showRecents = open && debounced.length < 2;
  useEffect(() => { if (showRecents) setRecents(getRecentSearches()); }, [showRecents]);

  const { data } = useQuery({
    queryKey: ['place-suggest', debounced],
    queryFn: () => api.suggestPlaces(debounced, 8).catch(() => [] as Suggestion[]),
    enabled: open && debounced.length >= 2,
    staleTime: 60_000,
  });
  const suggestions: Suggestion[] = Array.isArray(data) ? data : [];

  const items: Item[] = showRecents
    ? recents.map((label) => ({ type: 'recent', label }))
    : suggestions.map((place) => ({ type: 'place', place }));
  const visible = open && items.length > 0;

  // Keep the portal glued under the input across scroll/resize.
  const updateAnchor = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAnchor({ top: r.bottom + 8, left: r.left, width: r.width });
  }, []);
  useEffect(() => {
    if (!visible) return;
    updateAnchor();
    window.addEventListener('scroll', updateAnchor, true);
    window.addEventListener('resize', updateAnchor);
    return () => {
      window.removeEventListener('scroll', updateAnchor, true);
      window.removeEventListener('resize', updateAnchor);
    };
  }, [visible, updateAnchor, items.length]);

  // Close on outside pointer-down (menu is portaled, so check both refs).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const pick = (item: Item) => {
    setOpen(false);
    setActiveIdx(-1);
    if (item.type === 'place') {
      addRecentSearch(item.place.name);
      goTo(`/place/${item.place.id}`);
    } else {
      addRecentSearch(item.label);
      onPickRecent(item.label);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setOpen(false); setActiveIdx(-1); return; }
    if (e.key === 'Enter') {
      if (visible && activeIdx >= 0 && activeIdx < items.length) {
        e.preventDefault();
        pick(items[activeIdx]);
      } else if (debounced.length >= 2) {
        // Plain submit — remember it, but let the page's own Enter handler run too.
        addRecentSearch(debounced);
        setOpen(false);
      }
      return;
    }
    if (!visible) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
  };

  const dropdown = visible && anchor
    ? createPortal(
        <ul
          ref={listRef}
          id={listId}
          className="explore-suggest"
          role="listbox"
          aria-label={showRecents ? 'Recent searches' : 'Place suggestions'}
          style={{ position: 'fixed', top: anchor.top, left: anchor.left, width: anchor.width }}
        >
          {showRecents && (
            <li className="explore-suggest-head" aria-hidden="true">
              <span>Recent searches</span>
              <button
                type="button"
                className="explore-suggest-clear-recents"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { clearRecentSearches(); setRecents([]); }}
              >
                Clear
              </button>
            </li>
          )}
          {items.map((item, i) => (
            <li
              key={item.type === 'place' ? item.place.id : `recent-${i}`}
              id={`${baseId}-opt-${i}`}
              role="option"
              aria-selected={i === activeIdx}
            >
              <button
                type="button"
                className={`explore-suggest-item${i === activeIdx ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(item)}
              >
                {item.type === 'place' ? (
                  <>
                    <MapPin size={15} className="explore-suggest-pin" aria-hidden="true" />
                    <span className="explore-suggest-text">
                      <span className="explore-suggest-name">{highlightMatch(item.place.name, debounced)}</span>
                      {(item.place.city || item.place.governorate) && (
                        <span className="explore-suggest-sub">
                          {Array.from(new Set([item.place.city, item.place.governorate].filter(Boolean))).join(' · ')}
                        </span>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <Clock size={15} className="explore-suggest-pin" aria-hidden="true" />
                    <span className="explore-suggest-text">
                      <span className="explore-suggest-name">{item.label}</span>
                    </span>
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>,
        document.body,
      )
    : null;

  const activeDescId = activeIdx >= 0 ? `${baseId}-opt-${activeIdx}` : undefined;

  return {
    anchorRef,
    open,
    setOpen,
    visible,
    inputProps: {
      role: 'combobox',
      'aria-autocomplete': 'list',
      'aria-expanded': visible,
      'aria-controls': listId,
      'aria-activedescendant': activeDescId,
      onFocus: () => setOpen(true),
      onKeyDown,
    },
    dropdown,
  };
}
