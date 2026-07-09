# Badges page (`#/badges`)

> Page-level overrides to `design-system/MASTER.md` for the achievements page. Inherits everything not listed here.

## Relationship to `leaderboard.md`

Badges is the **collection sibling** of Leaderboard. Both are gamification surfaces that pair naturally:
- Same cinematic hero treatment.
- Same Nature-Distilled card grid below.
- **Same gold primary tint** (badges are achievements; gold is the achievement color across the app — passport-level Gold, Pro Traveler chip, Local Guide indicator).

What's different:
- Leaderboard's hero gradient is **gold + mediterranean**; Badges is **gold + violet** (the achievement-progress pair).
- Leaderboard is a list (vertical scroll, dense); Badges is a grid (visual, tiles).
- Leaderboard ranks people; Badges ranks accomplishments.

## Section order

1. **Hero** — eyebrow chip ("ACHIEVEMENTS"), gradient headline ("Badges & milestones" with gold→violet gradient), tagline.
2. **Stats section** — progress card + 3 stat tiles (Earned / Locked / Complete %).
3. **Grid** — auto-fill 200px tiles, **earned-first sorting**.

## Progress card

A self-contained card with a 30%-opacity `--gradient-mesh` overlay for warmth.

- **Header row**: stacked label ("N of M badges earned" + "Keep exploring to unlock more") on the left + giant **N%** percentage in `--gold` display-font on the right.
- **Progress bar**: 10px tall, `--gradient-gold` fill with `0 0 16px oklch(78% 0.17 80 / 0.4)` glow. Animates `width` change with `--duration-slow`.

This is the signature primitive of this page — the user's headline relationship with their badge collection is "how close am I to 100%?", and this card answers that question without any other UI.

## Stat tiles

3-column grid (stays 3-col even on mobile — at `<540px` it tightens the gap, doesn't collapse to single-column).

| Tile | Icon | Tint |
|------|------|------|
| Earned | `CheckCircle` | `--success` |
| Locked | `Lock` | `--text-tertiary` |
| Complete % | `TrendingUp` | `--gold` |

Same `color-mix(in oklch, <tint> 16%, transparent)` tile chip pattern as own-profile + user-profile.

## Badge card

Two states, both opaque (no overlap with `.is-locked` reduced-opacity treatment):

### Earned (`.is-earned`)
- Padding-box surface + `--gradient-gold` border-box (the same "gold gradient border" pattern used by Pro post variant, profile Pro flair, Tips premium hero CTA, leaderboard top-1 row).
- 80px gold-gradient icon chip with dark-on-gold icon color.
- Subtle gold-tinted shadow: `0 4px 18px oklch(78% 0.17 80 / 0.12)`.
- Hover lifts `-3px` to a stronger gold-shadowed `--shadow-lg`.
- Status pill at bottom: `--success` tint with `CheckCircle` icon + "EARNED".

### Locked (`.is-locked`)
- Opacity 0.62 resting, 0.85 on hover (gentle invitation, not a hard gate).
- Icon chip stays neutral with grayscale filter applied.
- **Lock overlay** on the icon: 35% black scrim over the chip with a `Lock` icon centered in white.
- Status pill at bottom: neutral `--bg-secondary` with `Lock` icon + "LOCKED".

### Category chip
- When `b.category` is set, a tiny pill appears between the description and the status. On earned badges it picks up a gold tint; on locked badges it stays neutral.
- **Don't tokenize category-to-tint mapping yet** — the data model for badge categories is mock-heavy and the categories (Exploration / Reviews / Travel / Content / Community) don't map cleanly to the brand-token palette. When this stabilizes, lift to the same vocabulary used by Explore + Mood + Events.

## Earned-first sorting

The grid sorts `earned: true` before `earned: false`. This means the user's first scroll-line is their accomplishments, not their gaps — a deliberate motivational choice. **Don't sort alphabetically or by category here**; alphabetical would bury earned badges and category would scatter them.

## Loading

Spinner with "Loading badges…" text, full-width via `grid-column: 1 / -1`.

## Accessibility

- Each badge is a real `<article>`.
- Lock overlay icon is `aria-hidden="true"` (the status pill carries the meaning).
- Progress card percentage is rendered as text (not just a bar) — SR users get the value.
- Earned/locked status pills use `aria-label` implicit via their text content (uppercase styled via CSS, not HTML).

## Anti-patterns specific to this page

- Don't replace earned-first sort with alphabetical. The motivational order matters.
- Don't add a "next achievable" callout — the user already sees what's locked via opacity, and a separate callout would clutter the grid.
- Don't tokenize badge categories until the data model stabilizes. The map you'd build today is the map you'd rebuild tomorrow.
- Don't hide locked badges. The visible-but-faded treatment is the carrot.
- Don't pulse the progress bar. The transition on width change is enough; a continuous pulse would read as "loading".
- Don't show the lock overlay on earned badges. The earned-state icon should breathe.

## Files

- Page: [web/src/pages/badges.ts](../../web/src/pages/badges.ts)
- Styles: [web/src/styles/badges.css](../../web/src/styles/badges.css)
- Mock data fallback: `web/src/data.ts`.

## Related

- [leaderboard.md](leaderboard.md) — sibling gamification page.
- [passport.md](passport.md) — embeds the `BadgeGrid` component for the badge subset on a user's passport. If you change anything here, mirror it there.
