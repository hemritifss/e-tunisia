# Place detail (`#/place/<id>`)

> Page-level overrides to `design-system/MASTER.md` for the place detail page — the destination of every Explore click. Inherits everything not listed here.

## Style direction

This page is content-first, not chrome-first. The user lands here to **decide whether to go to a place**, so the visual treatment is:
- **Hero photo** dominates (no mesh, no orbs — the place's own image is the hero).
- **Info section + CTA row** are Nature-Distilled cards on light surfaces.
- **Reviews list** uses the same article-card vocabulary as Tips, with hairline borders + tinted verified-badge.

The cinematic mesh primitive we use on landing/explore/passport/events/tips would compete with the hero image here. Don't add it.

## Hero

- Height: `clamp(280px, 50vw, 480px)`.
- Image fills with `object-fit: cover` and gets a **gentle Ken Burns drift**: `1 → 1.06` scale + `-1% / -1%` translate over 22s alternating. Disabled under `prefers-reduced-motion`.
- **Layered overlay**: top fade `oklch(0% 0 0 / 0.4) → transparent` (gives the floating action buttons legibility) + bottom fade `transparent → oklch(0% 0 0 / 0.55)` (preps the eye for the info section below) + radial terracotta tint bottom-left for warmth.
- **Floating action buttons** (back / save / share) are 40px frosted-glass circles with backdrop-blur. Save flips to `--rose` filled when active.

## Info section

- `display: flex; flex-direction: column; gap: var(--space-3);` — semantic stack, no grids needed.
- **Category chip** at the top: `--accent-light` background, `--accent` text, uppercase 11px with wide letter-spacing — same chip vocabulary as Tips and Events.
- **Place name** in display font, fluid `clamp(2rem, 4vw, 3.5rem)`. Bigger than other pages because this is the page about *this one thing*.
- **Rating row**: stars + tabular-num rating value (`--font-display` 800) + review count in `--text-tertiary`.
- **Description** clamped at 65ch measure — the natural reading width.

## CTA row

A self-contained card with `--surface-elevated` + `--border` + `--shadow-sm` chrome. Holds:

1. **Primary**: "Request a quote" — `--gradient-cta` with `--shadow-glow`. The only filled-gradient CTA on this page.
2. **Outline siblings**: Call · WhatsApp · Website · Directions · Add to trip. Each is a hairline pill that tints to `--accent-light` background + `--accent-light` border + `--accent` text on hover.
3. **Ghost tertiary**: Review (least visual weight — it's an action the user takes *after* visiting, not before).

The hierarchy here matters. The primary action is the host-conversion path; secondaries are alternate contact channels; ghost is post-visit. **Don't promote Review to outline** — it would compete with the actions that drive bookings.

## Reviews list

- Each review is a real `<article>` with `--surface-elevated` + `--border` chrome that lifts to `--shadow-md` on hover.
- 44px avatar wrapped in a `data-user-*`-bearing span → global `UserActionMenu` activates on right-click / long-press of the reviewer.
- **Verified-booking badge** when present: `--success` color in a `color-mix` 14%-opacity background + 30%-opacity border. Communicates trust without screaming.
- Star row uses 12px stars with `--gold` fill for active, `--border` for inactive.

### Host reply
- Indented block (no nested card chrome) with a **3px `--mediterranean` left border** — the "this is a host voice" cue.
- Background uses `color-mix(in oklch, var(--mediterranean) 8%, var(--bg-secondary))` so it tints subtly without screaming.
- Reply header in uppercase 12px wide-tracked mediterranean text.

### Inline reply form
- Activates from the owner-only "Reply as host" button.
- Textarea uses the same focus treatment as the rest of the app (terracotta border + tinted ring) and posts via the existing `apiService.replyToReview` flow.

## Star rating input

- 40px circle buttons with hover `--surface-hover` background, active `scale(0.92)`.
- Active star → `--gold` filled. The CSS uses the existing `.star-btn.active` selector pattern; sibling-trail dim handled by `:hover ~ :not(.active)` to give the input the "preview" feel.

## Verified hint banner (above review form)

When arriving from `?review=1&inquiry=<uuid>`, a small banner above the form announces "This review will show a Verified booking badge." Tinted `--success` with `color-mix` background.

## Loading + 404

- Loading: centered spinner (3px border, `--accent` top-color) + body text.
- 404 fallback is the same `place-detail-loading` chrome with a different message (handled by the existing JS fallback).

## Accessibility

- Review avatars carry `data-user-*` for `UserActionMenu`.
- Each review is `<article>` for semantic outline.
- Star row uses `aria-label="<rating> out of 5 stars"` on the container.
- Hero floating buttons have explicit `aria-label`.
- Verified hint uses `aria-live="polite"` semantics via the surrounding form (no separate region needed — the banner is decoration over an active form).

## Anti-patterns specific to this page

- Don't add the cinematic mesh + orbs hero treatment. The place's image is the hero; the mesh would fight it.
- Don't filled-button-style more than one CTA. The "Request a quote" is the conversion CTA; everything else is outline.
- Don't show the host-reply form to non-owners. The `isOwner` gate is mandatory.
- Don't make the Ken Burns drift faster than 22s. Anything quicker reads as "broken parallax" rather than ambient breathing.
- Don't put the rating input inside the review list — it's part of the *write a review* form, which lives at a fixed location above the list.

## Files

- Page: [web/src/pages/place-detail.ts](../../web/src/pages/place-detail.ts)
- Styles: [web/src/styles/place-detail.css](../../web/src/styles/place-detail.css)
- Inquiry modal markup is built inline in `place-detail.ts` (search for `openInquiryModal`). It uses generic `.sheet` chrome from `pages.css`, not custom modal CSS.
