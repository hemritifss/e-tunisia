# Messages inbox (`#/messages`) + Search (`#/search`)

> Page-level overrides to `design-system/MASTER.md` for the dedicated DM inbox and the global search page. Both styled via [web/src/styles/messages-search.css](../../web/src/styles/messages-search.css).

## Why one file

Both pages share core primitives:
- List-of-people rows with `data-user-*` for the global `UserActionMenu`.
- Tinted accent chip in the page head.
- Empty-state with 72px `--accent-light` icon chip + headline + 42ch body.
- Skeleton shimmer (200%-width sweep across `--surface-hover` → `--surface-active`).

They're two pages with one rhythm, so consolidating the CSS keeps the file count sane.

## Messages page (`#/messages`)

### Layout

Two-column grid bounded by `--page-max`, height pinned to `100dvh - var(--nav-height)`. On `<768px` collapses to a single column with adaptive show/hide based on `:has(#dm-thread:empty)` — the inbox owns the screen until a thread is selected, then the thread takes over.

### Inbox column

- `--surface-elevated` background, `--border` 1px right divider.
- 320px wide on desktop; full-width on mobile.
- Sticky `dm-inbox-head` with display-font title + secondary icon button.
- List rows are real `<a href="#/messages/<roomId>">` so they're keyboard-navigable and right-clickable.

### Inbox row primitives
- 44px avatar wrapped in `.dm-inbox-avatar-wrap` (positioned for the presence dot).
- **Presence dot**: 12px circle anchored bottom-right of the avatar. `--success` filled when online with a pulsing `box-shadow` ring (2s loop, reduced-motion safe).
- Name + time on the top line, preview + optional "You: " prefix on the second line.
- **Active row** uses `color-mix(in oklch, var(--accent) 10%, transparent)` background. `@supports not` fallback to `--accent-light`.
- Carries the full `data-user-*` attribute set so the global `UserActionMenu` activates on right-click / long-press.

### Thread column

- `--bg-secondary` background (the message-list canvas).
- Header: avatar with presence dot + name + sub-status ("Online now" / country / "Offline").
- Body: day dividers (`Today` / `Yesterday` / formatted date) + bubble rows.

### Bubble shapes
- **Mine**: right-aligned, `--accent` background, `--accent-text`, tighter bottom-right corner.
- **Theirs**: left-aligned, `--surface-elevated`, `--border-light`, tighter bottom-left corner, includes a 28px avatar.
- Optimistic (pending) bubbles get `opacity: 0.7`.
- Time stamp in 10px tabular-nums; on "mine" bubbles fades to 0.8 opacity so the message body owns the eye.

### Typing indicator
3-dot bouncer in a left-aligned theirs-style bubble. 1.2s loop with staggered delays. Reduced-motion holds the dots at 0.7 opacity steady.

### Composer
- Sticky bottom row above safe-area-inset.
- Auto-sizing `<textarea>` (max 120px) with `--accent` focus border.
- 40px round send button with `--gradient-cta` + `--shadow-sm`. Spring scale-down on press.

## Search page (`#/search`)

### Head
- Eyebrow chip ("DISCOVER" with `Search` icon).
- Display-font H1 + description capped at 56ch.
- **Single search input** in a pill wrap, max-width 560px. Focus-within gets a 4px tinted ring + medium shadow.
- A clear (×) button appears once the user types; clicking it resets the query + refocuses the input.

### Live debounce
200ms keyup debounce. The URL hash is kept in sync via `history.replaceState` — refreshing or sharing the URL persists the query.

### Loading
Skeleton rows (4 × 80px shimmer cards) instead of a spinner — feels more responsive than a single dot.

### Empty states
Two variants:
- **Hint** ("Start typing to search") with the `Search` Lucide icon.
- **No-match** ("No matches for &lt;query&gt;") with the `SearchX` icon. Includes a recovery suggestion line.

Both use the same dashed-border card + `--accent-light` icon chip pattern shared across the app.

### People section
- `<h2>` title + count pill (tabular-nums in a neutral pill).
- Cards: 56px avatar · meta column · followers stat. Carry the full `data-user-*` attribute set.
- **Tier badge** next to the name uses the established mini-circle pattern (16px circle, brand-gradient backgrounds): `is-pro` gold + `Sparkles` icon, `is-business` mediterranean→violet + `Check`, `is-guide` olive + `BadgeCheck`. **Replaces** the legacy `✦` / `✓` text glyphs that previously sat in the search results.
- Hover lifts `-2px` with `--shadow-md` + `--accent-light` border.

### Places section
- Auto-fill grid of 220px tiles.
- 4:3 image (with `object-fit: cover` and 1.04 hover scale) + name + city + category line.
- Same hover lift + border-tint pattern as the people cards.

## Emoji-removal summary

| Surface | Removed | Replacement |
|---------|---------|-------------|
| Search results tier badge | `✦` (Pro) / `✓` (Business / Guide) glyphs as text | Lucide `Sparkles` / `Check` / `BadgeCheck` in `.search-tier-badge` mini-circles |
| Search empty / loading | Inline `<i style="font-size: 2.5rem;">` icons | `.search-empty-icon` chip with tokenized sizing |
| Search section headers | Inline `<span class="text-muted">` paren | `.search-section-count` pill |

The previous file also had a fair amount of inline `style="font-size:..."` / `style="color:var(--text-muted)"` directly in element constructors. All of those now resolve via CSS classes; the JS is leaner and the chrome is consistent with the rest of the redesigned app.

## Accessibility

- Inbox rows are real `<a href>` for proper history + keyboard nav.
- Thread header includes back-to-inbox button labeled `aria-label="Back to inbox"` (visible only on mobile via `.dm-mobile-only`).
- Presence dot has `aria-hidden="true"`; the text status carries the meaning.
- Search input is `type="search"` with `aria-label="Search"`.
- The clear button uses `hidden` attribute (toggled in JS) — not `display:none` inline styles.
- Tier badges have `aria-label` set to the visible-text equivalent (`"Verified Business"` / `"Pro Traveler"` / `"Local Guide"`).
- All decorative icon chips are `aria-hidden`.

## Animation budget

- Presence dot pulse: 2s loop, only when `is-online`. Reduced-motion disables.
- Typing dots: 1.2s loop, only when visible. Reduced-motion holds steady.
- Place card image scale: hover-triggered, 700ms.
- Skeleton shimmer: 1.6s linear, reduced-motion disables.

No always-on background animations.

## Anti-patterns

- Don't reintroduce `✦` or `✓` text glyphs anywhere on the search page. The Lucide mini-circle is the canonical tier badge.
- Don't add a "Filters" sidebar to the search results page. The query is the filter; sections (People / Places) are the result type. Filtering by type would need its own UX research and isn't a scoped-creep target.
- Don't put the bubble time inside the bubble's main text flow. It's `align-self: flex-end` for a reason — keeps the body the visual anchor.
- Don't make the inbox-row presence dot pulse on hover (already pulses when online). Two pulse triggers on the same element reads as noise.
- Don't move the composer above the bubbles. Composer-at-bottom is the unambiguous chat pattern; users will type into the wrong place otherwise.

## Related

- [messenger.md](messenger.md) — the chat popups + active-conversations widget that mirror this surface for "in-context" messaging. The dedicated inbox is the focused, undistracted version.
- [activity.md](activity.md) — paired alert surface. Both share the `data-user-*` integration and the per-type tint vocabulary.
- [explore.md](explore.md) — the search page's nearest content cousin (the dropdown command palette is the third member of that family).

## Files

- Messages page: [web/src/pages/messages.ts](../../web/src/pages/messages.ts)
- Search page: [web/src/pages/search.ts](../../web/src/pages/search.ts)
- Shared styles: [web/src/styles/messages-search.css](../../web/src/styles/messages-search.css)
