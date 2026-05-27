# Map page (`#/map`)

> Page-level overrides to `design-system/MASTER.md` for the Leaflet-driven map. Inherits everything not listed here.

## Style direction

**Distinct from every other page.** The map is the surface — there's no hero, no Nature-Distilled grid, no mesh + orbs. The tiles fill the viewport edge-to-edge, and our brand UI floats over them as **two horizontal control bars** at the top + a slide-in **info panel** on the right (or sheet-from-bottom on mobile).

This is the **one page** where we *override* the global `.main-content` padding via a negative-margin trick — the map needs `100dvh` of edge-to-edge real estate.

## Leaflet integration

- Tile layer: **CartoDB Voyager** (warm, elegant, no API key).
- A subtle vignette + terracotta corner-tint sits over the tiles via a `::after` pseudo on `.map-leaflet-container` — soft cinematic feel without obscuring the data.
- Zoom control moved to bottom-right and re-styled with `--surface-elevated` chrome + `--shadow-lg`.
- Attribution restyled to a `--surface-elevated` pill at low opacity in the bottom-right corner.

## Category palette (OKLCH literals)

Leaflet stamps colors into inline SVG `fill` attributes and inline `style="background:..."` strings. **CSS variables don't resolve there** — so the palette has to be inline color strings.

The fix: the `categoryColors` map in `map.ts` uses **OKLCH literals matching the brand tokens**:

| Category | OKLCH literal | Matching token |
|----------|---------------|----------------|
| Culture | `oklch(58% 0.2 290)` | `--violet` |
| Historical | `oklch(80% 0.1 75)` | `--sand` |
| Beaches | `oklch(72% 0.18 200)` | `--cyan` |
| Adventure | `oklch(55% 0.16 30)` | `--terracotta` |
| Nature | `oklch(57% 0.13 145)` | `--olive` |
| Food & Drink | `oklch(67% 0.19 25)` | `--coral` |

**Rule:** if you change the OKLCH triple of a brand token in `tokens.css`, mirror it in this map. There's no automated link; keep them in sync manually.

## Controls overlay

A two-row floating control block, max-width 720px, centered:

### Search wrapper
- Pill-shaped, `oklch(100% 0 0 / 0.92)` background (or dark variant), `--shadow-xl`.
- On focus-within: `--shadow-2xl` + 4px gold ring (`oklch(78% 0.17 80 / 0.25)`).
- Search results dropdown reuses the same chrome (`--surface-elevated` + `--border` + `--shadow-xl`).

### Filter chips
- Horizontally scrollable, glass background matching the search.
- Each chip carries `--cat-tint` inline (from the `mapCategories[].tint` references — these are CSS variable strings like `var(--cyan)` since the chip is rendered in normal DOM).
- **Resting state** shows a small tinted **dot** (8px) next to the label — never a colored chip. This reads as a legend at rest.
- **Active state**: background fills with `color-mix(in oklch, var(--cat-tint) 18%, transparent)`, text turns to `--cat-tint`, weight bumps to 600. Same primitive as Events/Tips filter pills.

The two rendering paths (Leaflet markers using OKLCH literals + DOM chips using `var()`) are **intentionally separate** but produce identical colors. Don't try to unify them with `getComputedStyle` — it adds runtime cost for no real benefit.

## Custom markers

- 40×52 SVG pin built from CSS pseudos (`::before` for the teardrop body, `::after` for the ground shadow). Inner SVG icon is rendered via the `categoryIcons` map (Lucide path data).
- **Pulse animation**: 2.4s scale-out from `0.6 → 2.2` with opacity fade. **Disabled** under reduced-motion.
- **Entry animation**: drop-in from `-24px` with spring on initial mount; re-triggered when filter changes.
- Stagger: 80ms per marker on initial mount (set in `initMapPage`).

## Popup

Leaflet popups are re-skinned to match the rest of the app's card chrome:
- Wrapper: `--surface-elevated` + `--border` 1px + `--radius-xl` + `--shadow-2xl`.
- Content: 280px wide, image at the top (16:9), category badge on top-left of image, body below.
- Card body: title (display font 700) + rating row + clamped 3-line description + stats row + 3 community-comment quotes + tinted CTA.
- The CTA picks up the place's category color from the `color` parameter inline — same OKLCH literal that drives the marker.

**Anti-pattern:** Don't restyle the close button to use a Lucide icon. The default Leaflet close `×` is sized and positioned for click-target compliance; replacing it costs more than it saves.

## Side info panel

A 420px panel that slides in from the right when a marker is clicked.

- On desktop: `position: absolute; right: 0; transform: translateX(100%)` resting → `translateX(0)` open.
- On mobile (`<640px`): sheet-from-bottom (`width: 100vw; height: 70dvh; transform: translateY(100%)` → `translateY(0)`). Border radius switches to top-rounded.
- Content: full-resolution version of the popup, with bigger image, more comments, and a full-width tinted CTA.
- Close button: 36px circle, top-right, `--surface-hover` on hover.

The panel and the popup both exist intentionally:
- **Popup**: quick glance on hover/tap, dismissible by clicking elsewhere.
- **Side panel**: dedicated reading surface for users who want detail.

If you simplify to one, keep the side panel (it's the higher-fidelity surface).

## Accessibility

- Filter chips are `role="tab"` + `aria-selected`. The `aria-label` on the chip group is "Place category filter".
- Search input has `placeholder="Search places…"`; semantic `<input>` carries enough context.
- Each marker is keyboard-focusable via Leaflet's default behavior (`tabindex` set by Leaflet on `.leaflet-marker-icon`).
- Marker pulse is decorative; the visible label in the popup carries the place name.
- The map container is **not** screen-reader friendly — there's no good way to read a Leaflet map. The category filter chips + search-results dropdown serve as the SR-friendly index. If you need a fully accessible map experience, hook in a list-view fallback (out of scope for this redesign).

## Performance

- Tile layer keeps `maxZoom: 19` to support deep zoom; cap not lifted.
- Marker entry animations are staggered 80ms × N. With ~6 markers that's 480ms total — safe.
- The `::after` vignette over tiles is a **single repaint cost** on map pan; cheap.

## Anti-patterns specific to this page

- Don't add the cinematic mesh + orbs hero pattern. The tile layer is the visual.
- Don't replace OKLCH literals in `categoryColors` with hex. Hex would drift from `tokens.css`.
- Don't unify the marker color delivery path with the chip CSS-variable path via `getComputedStyle`. Two independent paths are simpler and faster.
- Don't dismiss the side panel via outside-click while a popup is open. They're separate surfaces with separate dismiss models.
- Don't increase the marker pulse opacity past 0.5. Higher reads as "loading" rather than "this is here".
- Don't replace Carto Voyager with a darker tile set without verifying brand pill contrast against the new tiles. The current vignette + warmth assume light tiles.

## Files

- Page: [web/src/pages/map.ts](../../web/src/pages/map.ts)
- Styles: [web/src/styles/map.css](../../web/src/styles/map.css) (loaded after `pages.css`)
- Leaflet styles: imported in `map.ts` via `import 'leaflet/dist/leaflet.css'`; can't be reordered, so `map.css` is written to override Leaflet defaults via specificity (`.leaflet-container .x` selectors).
