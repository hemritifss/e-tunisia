# Itineraries page (`#/itineraries`)

> Page-level overrides to `design-system/MASTER.md` for curated multi-day trip plans. Inherits everything not listed here.

## Style direction

Cinematic mesh hero (MASTER §2b — gold/cyan/terracotta orb palette) + Nature-Distilled card grid below. The card's signature primitive is the **photo cover with floating tag chips** + **per-difficulty tint** on the body.

## Difficulty palette

Each itinerary card carries `--diff-tint` inline based on `it.difficulty`:

| Difficulty | Tint token |
|------------|-----------|
| easy | `var(--success)` |
| moderate | `var(--amber)` |
| hard / challenging | `var(--coral)` |

The tint drives the card's hover border, the difficulty pill text, and the bottom of the modal's CTA. **Don't tokenize Pro as a difficulty** — Pro is a payment tier, not a difficulty level.

## Card chrome

- 16:10 cover image with overlay gradient + tag chips floating on top.
- **Tags**: duration (frosted glass with `CalendarDays`) + Pro (gold gradient with `Crown`). Pro replaces the old 👑 emoji.
- Title sits inside the cover on the bottom edge with text shadow for legibility.
- Body: difficulty chip (uppercase 11px, tinted) + 3-line clamped description + full-width outline "View full itinerary" CTA.

## Modal

Shared chrome with Collections — defined in `itineraries.css` and reused there:
- `--surface-elevated` card with `--radius-2xl` + `--shadow-2xl`.
- Spring entry animation (`translateY(12px) scale(0.96) → 0/1`, reduced-motion safe).
- Cover image with overlay + tag chips + title.
- Body with meta chips (difficulty + duration) + description + two-button action row (primary CTA + outline Save).
- Premium itineraries get a gold "Unlock with Pro" CTA pointing to `#/premium`; free itineraries get a terracotta "Start exploring" CTA pointing to `#/explore`.
- ESC closes. Scrim click closes. Focus trapped within.

## Accessibility

- Each card is `<article>` for semantic outline.
- Modal is `role="dialog" aria-modal="true"`.
- Difficulty pill carries visible text (no SR cue needed beyond the label).

## Anti-patterns

- Don't add a 4th difficulty level. The 3-tier system (easy / moderate / hard) is mental-model-aligned with hiking/travel grading; adding "very hard" or "expert" creates confusion.
- Don't show the "Unlock with Pro" CTA on free itineraries. The two-CTA branching is intentional.
- Don't replace the cover image's title with a separate `<h3>` outside the cover. The integrated title is the signature primitive.

## Files

- Page: [web/src/pages/itineraries.ts](../../web/src/pages/itineraries.ts)
- Styles: [web/src/styles/itineraries.css](../../web/src/styles/itineraries.css) (modal chrome reused by collections.css)
