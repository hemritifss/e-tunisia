# Explore page (`#/explore`)

> Page-level overrides to `design-system/MASTER.md` for the place-discovery surface. Inherits everything not listed here.

## Style direction

Explore is a **hybrid** like the Mood page: the **hero band** uses MASTER §2b (Cinematic / Aurora Mesh — dark `--gradient-hero` + `--gradient-dark-mesh` overlay + two floating orbs in `--terracotta` and `--mediterranean`). **Below the hero** drops back to Nature Distilled — quiet `--surface-elevated` cards on the standard `--bg-secondary` background.

The page exposes a **per-active-category tint** through `--cat-tint` (set on the page root via inline style). Hovering or activating a category swaps that tint into hairline borders, pill backgrounds, and the place-card hover border — closing the loop with the mood-palette tokens.

## Category palette (intentional alignment with moods)

Every category maps to an existing OKLCH token. This is **not** decoration — it's how a user who explores via "Beaches" sees a coherent cyan-tinted journey that matches the `#/mood/beach` page they came from.

| Category | Icon | Tint token |
|----------|------|-----------|
| All | `Globe` | `var(--text-secondary)` (neutral) |
| Beaches | `Waves` | `var(--cyan)` |
| Historical | `Landmark` | `var(--sand)` |
| Food | `UtensilsCrossed` | `var(--gold)` |
| Nature | `Trees` | `var(--olive)` |
| Culture | `Library` | `var(--violet)` |
| Adventure | `Mountain` | `var(--terracotta)` |

**Don't** add a new category without picking a Lucide icon **and** a brand token. **Don't** invent a new color for it.

## Hero

- **Background:** `--gradient-hero` (dark mediterranean→violet→navy) + `--gradient-dark-mesh` overlay.
- **Two orbs:** terracotta (top-left, 360px, 70px blur) and mediterranean (bottom-right, 320px, 70px blur, `-8s` delay). 16s float. Reduced-motion disables.
- **Eyebrow pill:** `Compass` icon + "DISCOVER" in `--tracking-widest`. Frosted glass (12% white bg, 18% border, 10px blur).
- **Headline:** display 900, `clamp(2rem, 5vw, 3.5rem)`. The word "Tunisia" gets the **same `.explore-hero-grad` gradient** the landing uses for "Tunisia" — kinetic gold→terracotta-light loop, 6s. **Reduced-motion** kills the animation but keeps the gradient.
- **Subhead:** `oklch(90% 0.01 80)` over text-shadow for legibility across the mesh.

### Baked-in search
The search input lives **inside** the hero, not below it — this is the primary action and the hero exists to frame it.

- White rounded-pill (`0.95` opacity) with `--shadow-lg`. On dark mode: `oklch(20% 0.014 260 / 0.8)`.
- Focus state: gold ring (`oklch(78% 0.17 80 / 0.25)`, 4px) + `--shadow-xl`.
- The clear (X) button only renders when `searchQuery` is non-empty.
- `role="search"` + `aria-label="Search places"` on the input.

## Controls row

- **Filters button:** outlined pill, flips to `--accent` on active. A `--gold` dot appears when `minRating > 0` to signal a non-default filter without opening the panel.
- **Clear all** appears only when at least one filter is set. Underlined link style — destructive-style intent without using the destructive color.
- **View toggle:** segmented pill (grid / list), 32px buttons, active uses `--accent`. `role="tablist"`.

## Category strip (`.explore-cats`)

Horizontal scrolling row, **no scrollbar visible**, edge-to-edge on mobile (bleed-through via negative `margin-inline` to undo `--page-padding`).

- Each `.explore-cat` is a hairline-bordered pill. The icon color is the category's tint regardless of state — gives the strip "rainbow" energy without overwhelming any single pill.
- Hover swaps border to the tint.
- **Active state:** tinted background via `color-mix(in oklch, var(--cat-tint) 14%, var(--surface-elevated))` + tinted border + tinted text. The `@supports not` fallback uses `--surface-hover` so older browsers still get a visible active state.

## Place cards (existing `Card` component)

Card chrome inherits from MASTER. This page adds **per-category hover** — when the user hovers a card, the border tints to the **currently active category's** tint via `--cat-tint`. This is the cue that ties the visual journey together.

Cards lift `-4px` on hover, shadow shifts to `--shadow-lg`. Spring easing.

The page does **not** redesign the inner `PlaceCard` markup — that lives in `ExplorePage.tsx`'s `PlaceCard` function and is left as-is intentionally because:
1. It's complex (favorite state, list vs grid variants).
2. The chrome refinements above already lift the visual quality.
3. A full inner-card redesign would touch the `Card` primitive used elsewhere — out of scope for a single-page pass.

## Filters panel (`.explore-filters`)

Reveals via `framer-motion` height animation when the Filters button is active. Uses real `<fieldset>` + `<legend>` for accessibility.

- Currently only "Minimum rating" is shipped (matches existing logic). When you add more (price, distance, city), follow the same `.explore-filter-group` pattern.
- Pills toggle active state with `--accent-light` background, `--accent` text + border.

## Skeletons / empty / end states

- **Skeleton:** matches feed/mood `linear-gradient(90deg, --surface-hover → --surface-active → --surface-hover)` shimmer, 1.6s linear, reduced-motion safe. Reserves 280px height per tile.
- **Error state:** generic `<X>` icon in `--accent-light` chip + "Couldn't load places" headline + retry hint. Filters are explicitly mentioned as preserved.
- **Zero results (with filters):** `<Compass>` icon, headline "No places match your filters", body that suggests broadening, plus a "Clear all filters" CTA. Always renders the CTA when `hasFilter` is true.
- **End of feed:** small "You've seen every place" mark with hairlines (same pattern as `feed.css`).

## Accessibility

- Search input is `<input type="search">` with `aria-label`.
- Filter button has `aria-expanded` reflecting the panel state.
- View toggle pair is `role="tablist"` + each button `aria-selected`.
- Category strip is `<nav aria-label="Category filter">`. Each pill is `aria-pressed` (it's a toggle filter, not navigation).
- All icon-only buttons have `aria-label`.
- The decorative `.explore-hero-orbs` and the `Compass` eyebrow icon are `aria-hidden="true"`.
- Hero text-shadows are tuned for contrast over varied orb positions — verified on the 4 standard orb position phases.

## Anti-patterns specific to this page

- Don't use Tailwind utility classes for new chrome — token-driven CSS classes only. The legacy `PlaceCard` retains some utilities for now; new code should not add to that surface area.
- Don't add raw `rgba(...)` or hex anywhere — use `oklch()` literals only for one-off alpha tints derived from existing tokens (e.g. `oklch(78% 0.17 80 / 0.25)` for the gold focus ring). Even those should be rare.
- Don't replace `color-mix` with a tokenized blend — `color-mix(in oklch, var(--cat-tint) 14%, ...)` is the cleanest way to derive a category-specific surface tint and is well-supported.
- Don't make the search input live anywhere except the hero. The hero exists to frame it. If you ever need a sticky-while-scrolling search, add it as a *separate* mini bar below the controls — don't move the hero search.
- Don't add a third orb in the hero. Two is the budget; landing already has three, and Explore visually competes with landing if it matches that density.
- Don't drop the category strip to icons-only on mobile to save space. The label is what makes it scannable; horizontal scroll is fine.

## Files

- Page: [web/src/react/pages/ExplorePage.tsx](../../web/src/react/pages/ExplorePage.tsx)
- Styles: [web/src/styles/explore.css](../../web/src/styles/explore.css) (loaded after `pages.css`)
- Inner `PlaceCard`: defined in `ExplorePage.tsx` itself; visual chrome inherits from the shared `Card` component in `web/src/react/components/Card.tsx`.

## Loop with mood pages

If a user lands on `#/mood/beach`, sees the cyan-tinted hero + a city list, and then clicks "Browse all" → they arrive at `#/explore` with category `beaches` active → the strip pill is **cyan**, the place-card hover border is **cyan**, the hero gradient remains the same dark-mesh treatment. The cyan thread is the user's discovery memory. Don't break it by changing one mood's tint without also changing the matching Explore category.
