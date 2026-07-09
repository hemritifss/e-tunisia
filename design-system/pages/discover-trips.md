# Discover trips page (`#/discover-trips`)

> Page-level overrides to `design-system/MASTER.md` for community-shared trip plans. Inherits everything not listed here.

## Style direction

Cinematic mesh hero (mediterranean + coral orbs) + Nature-Distilled card grid. The page is the public-facing companion of My Trip — anyone can browse, save, or clone community-built plans.

## Filter rail

Below the hero, two stacked rows:

1. **Sort tabs** — segmented pill, two values: Popular (`Flame` icon) + Newest (`Clock` icon). Active state uses `--accent` background with `--accent-text`.
2. **Search row** — two pill inputs side-by-side:
   - City filter (`MapPin` icon) — debounced text input, 250ms.
   - Days select (`CalendarDays` icon) — 1–3 / 4–7 / 8–14 / 15+ / Any.

Both pill inputs use a wrapper with rounded `--radius-full` + hairline border, with focus-within glow.

## Card

A real `<a>` (navigates to `#/trip/<slug>`).

- **Cover collage**: flex row of up to 3 stop-cover images (140px tall). Fallback is a terracotta→mediterranean gradient.
- **Stop chip** floats over the cover bottom-left in a dark glass pill (`MapPin` + "N stops").
- **Body**: title (display-font, 2-line clamp) + cities preview (single-line truncated) + meta row at the bottom border (days · travelers · views · updated-time).

## Empty state

Shown when filters return zero results: `SearchX` icon in `--accent-light` chip + headline + "Try a different city or duration — or build the first trip yourself" + Browse-places CTA.

## Anti-patterns

- Don't show a Save button on the card. Saving lives on the trip-detail page.
- Don't let the city filter accept multiple cities. The data-model is single-city right now; multi-city would require a backend change.
- Don't make the meta row clickable. Each item is a stat, not a navigation target.

## Files

- Page: [web/src/pages/discover-trips.ts](../../web/src/pages/discover-trips.ts)
- Styles: [web/src/styles/discover-trips.css](../../web/src/styles/discover-trips.css)
