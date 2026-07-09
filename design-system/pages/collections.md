# Collections page (`#/collections`)

> Page-level overrides to `design-system/MASTER.md` for editor-curated themed place sets. Inherits everything not listed here.

## Relationship to `itineraries.md`

Collections is the **theme-grouping sibling** of Itineraries. Both surfaces are editor-curated, both use the cinematic mesh hero + Nature-Distilled grid pattern, both share modal chrome (defined in `itineraries.css`, reused in `collections.css`).

What's different:
- Itineraries are **plans** (multi-day with difficulty + duration).
- Collections are **sets** (themed grouping of places, no plan, no difficulty).
- Itineraries' modal has 2 CTAs (Unlock/Start + Save); Collections' modal has 2 CTAs (Explore places + View on map).
- Itineraries' hero orbs are gold + terracotta; Collections' are violet + gold (signaling editorial curation, not adventure).

## Card

The collection card is a **full-bleed image with overlay title** — different from the itinerary card's split layout. Reason: collections are pure visual curation; the image *is* the content. The description sits below the image as a separate paragraph rather than overlaid.

- 4:3 image with hover scale `1.05`.
- Bottom-anchored title + place count (with `MapPin` icon) over a dark gradient.
- Optional description paragraph below the image — quieter typography, `--text-secondary`.

The whole card is a real `<button>` (not `<a>`) because the click opens a modal, not a navigation. Use `aria-label` for the SR-only label.

## Modal

Identical chrome to itineraries (shared CSS). Differences:
- Tag shows place count, not duration.
- No difficulty chip in the body.
- CTAs: Explore places (primary, terracotta gradient) + View on map (outline).

## Anti-patterns

- Don't show place thumbnails inside the modal. A collection is a *promise* of a curated experience; teasing all the places defeats the editorial framing. Let the Explore page handle the place-level browse.
- Don't add a save/follow action on collections. They're editorial, not user-owned.
- Don't show difficulty on collections — that's an itinerary primitive.

## Files

- Page: [web/src/pages/collections.ts](../../web/src/pages/collections.ts)
- Styles: [web/src/styles/collections.css](../../web/src/styles/collections.css) (modal chrome inherits from `itineraries.css`)
