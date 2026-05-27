# Events page (`#/events`)

> Page-level overrides to `design-system/MASTER.md` for the events listing. Inherits everything not listed here.

## Style direction

Hybrid like Explore + Mood: cinematic hero (MASTER §2b — dark mesh + 2 orbs) on top, Nature Distilled grid below. Closes the brand-tint loop with Explore + Mood by mapping every event **category** to the same OKLCH tokens.

## Section order

1. **Hero** — dark mesh + 2 orbs (coral + mediterranean), eyebrow chip, headline with one-word gradient on "Tunisia".
2. **Filter strip** — segmented tinted pill control, one per category + "All Events". Per-pill tint shifts the active state's background/border/text.
3. **Grid** — auto-fill 280px columns. **First card spans the full row** as a featured-variant when the list has ≥3 items (and isn't a filtered subset that empties out).

## Category palette (loop-aligned)

Every event category is a brand-token reference — same vocabulary as Explore categories and Mood pages. **Don't** add a category without picking a Lucide icon **and** a brand token.

| Category | Lucide icon | Tint token |
|----------|-------------|-----------|
| All Events | `calendar-days` | `var(--text-secondary)` (neutral) |
| Music | `music-2` | `var(--coral)` |
| Culture | `theater` | `var(--mediterranean)` |
| Food | `utensils-crossed` | `var(--olive)` |
| Sports | `trophy` | `var(--gold)` |
| Art | `palette` | `var(--accent)` (terracotta) |

The tint propagates into the **event card** via inline `style="--cat-tint: <token>"` set per-card from the event's `.category` field. So a Music event:
- Has a coral category pill in the image corner.
- Has a coral top-strip on its date block.
- Has a coral attend button.
- Lifts to a coral hover border.

This is what makes the page feel coherent even with 6 categories on screen — each card declares its own visual identity from one token.

## Hero

- Background: `--gradient-hero` (dark mediterranean → violet → navy) + `--gradient-dark-mesh` overlay.
- **Two orbs**: coral (top-left, 340px, 70px blur) + mediterranean (bottom-right, 300px, 70px blur, `-8s` delay). 16s float. Reduced-motion disables.
- **Eyebrow chip:** "DON'T MISS OUT" in `--tracking-widest` with a `calendar-days` Lucide icon. Frosted glass (14% white, 22% border, 10px blur).
- **Headline:** display 900, `clamp(2rem, 5vw, 3.25rem)`. The word "Tunisia" gets a kinetic gold→coral→gold gradient, 6s loop. **Different from landing/explore** where it's gold→terracotta-light → events get coral as the second stop because the orb palette includes coral. Small detail, but it ties the hero internally.
- **Subhead:** `oklch(90% 0.01 80)` with text-shadow for legibility over varied orb positions.

## Filter strip (`.event2-filters`)

Segmented pill control, horizontally scrollable, edge-to-edge on mobile via negative `margin-inline`.

- Each `.event2-filter` carries its own `--cat-tint` inline.
- Icon is in a 20×20 chip, colored with the tint regardless of active state — the strip reads as a tinted rainbow at rest.
- Hover: border tints to the category tint, text shifts to `--text-primary`.
- **Active:** background uses `color-mix(in oklch, <tint> 14%, <surface>)`, border + text shift to the tint, weight bumps to 600. `@supports not` fallback to `--surface-hover`.
- `role="tablist"` + `role="tab"` + `aria-selected` for screen readers.

## Card chrome

### Resting state
- `--surface-elevated`, `--border`, `--radius-xl`, `--shadow-sm`.
- Image 16:10 aspect, `loading="lazy"`.
- Category pill **inside the image** top-left, with `color-mix(in oklch, <tint> 88%, transparent)` background — saturated tinted glass over the image.
- Body: 64px **date block** on the left, content on the right.

### Date block
- Stacked month (uppercase tint-colored letters) over day (display-font 24px, tabular-num).
- 4px tint-colored top strip — like a tear-away calendar page.
- This is the page's signature primitive — instantly readable across cultures.

### Hover state
- Card lifts `-4px` with `--shadow-lg`, border tints to `--cat-tint`.
- Image scales `1.04` inside `overflow:hidden` container.

### Featured-first variant
- Only applies to **the first card of the unfiltered list when there are 3+ items** (skipped on filter results because the result set is the user's intent).
- `grid-column: 1 / -1` — spans the row.
- At ≥768px, becomes a horizontal layout: image takes 52% on the left, body takes the right with bigger padding and `--text-2xl` title.
- A small `lucide-sparkles + Featured` gold-gradient badge sits top-right of the image.

## Attend button (the only interactive primitive)

- Resting: tinted background (`--cat-tint`) with `--text-inverse`, pill-shaped, 32px min-height.
- Hover: lifts `-1px` with `--shadow-sm`. Active: `scale(0.96)`.
- **On click (only if authed):** flips to `is-attended` state — `--success-light` bg, `--success` text and border, icon swaps from `lucide-plus` to `lucide-check`. `aria-pressed="true"`.
- **Celebration animation:** brief `1 → 1.12 → 0.96 → 1` spring scale (600ms) cleared after, so the resting state is calm. `requireAuth('attend events')` gates the action — guests see the standard sign-in CTA.

The `is-attended` state is **non-reversible from the card** (no "leave event" toggle here). Removing attendance lives in the user's own event list, not on the listing page. This is a deliberate cap on the card's surface area.

## Empty state

When a filter returns zero events:
- `lucide-calendar-x` icon in `--accent-light` chip.
- Headline tailored to the filter: "No music events on the calendar".
- Body: "Check back soon — new ones land here as the community shares them."
- **"Show all events" button** that programmatically re-clicks the "All Events" filter (zero-friction recovery).

The skeleton state on first paint uses the same shimmer formula as Feed / Explore / Mood (200% gradient sweep on `--surface-hover` → `--surface-active`). Reduced-motion safe.

## Accessibility

- Filter strip is `role="tablist"` + `role="tab"` + `aria-selected`.
- Each card is a real `<article>` (semantic outline).
- Attend button uses `aria-pressed` for state.
- Featured badge is decorative (no role, hidden from SR via the icon `aria-hidden`).
- The cinematic eyebrow icon is `aria-hidden`.

## Anti-patterns specific to this page

- Don't add a 7th category. The 6-pill row already hits the discomfort line on mobile scroll.
- Don't make the attend button toggle off from the listing. The card is "save" surface, not management.
- Don't drop the date-block's tint strip. It's the visual cue that ties the card to its category before the user reads the pill.
- Don't apply the featured-variant when filtering. The featured slot is editorial; filter results are user-driven.
- Don't move the category pill **outside** the image. The image is the chrome that lets the pill use a tinted-saturated background without contrast issues.
- Don't use raw hex anywhere — the `categoryColors` map was already token-based and that's been preserved into the new `CATEGORIES` array.

## Files

- Page: [web/src/pages/events.ts](../../web/src/pages/events.ts)
- Styles: [web/src/styles/events.css](../../web/src/styles/events.css) (loaded after `pages.css`)
- Mock data fallback: `web/src/data.ts` (used when `api.getEvents()` fails or returns empty).

## Related

- [explore.md](explore.md) — same category-tint pattern (`--cat-tint`) used for Explore's category strip and card hover.
- [mood.md](mood.md) — same brand-token palette (Lucide icons + OKLCH tints).
