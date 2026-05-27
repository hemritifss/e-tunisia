# Tips page (`#/tips`)

> Page-level overrides to `design-system/MASTER.md` for the community-tips listing. Inherits everything not listed here.

## Relationship to `events.md`

Tips is the **textual sibling** of Events. Same scaffolding:
- Cinematic mesh hero (MASTER §2b).
- Brand-token category palette propagated via inline `--cat-tint`.
- `role="tablist"` filter strip with Lucide icons.
- Auto-fill responsive grid.
- Empty state with double-CTA recovery.
- Reduced-motion-safe celebration on the like button.

The differences sit in the **shape** of the content, not the chrome:
- **Cards are text-first** (no hero image) — they're personal advice, not images of places.
- **The hero CTA is a Share-your-tip action** (gold gradient pill with `--shadow-glow-gold`), not just a passive headline.
- **The page exposes a submit modal** for user-generated content. Modal is part of this page's surface and styled here.
- **Like + Share are inline outline pills**, not a single colored button — tips have no "RSVP" affordance.

## Section order

1. **Hero** with eyebrow, headline (gradient on "smarter"), description, **Share-your-tip CTA**.
2. **Category filter strip** — 6 tinted pills (All + 5 categories; `general` exists as a fallback category but isn't rendered as a pill).
3. **Grid** — auto-fill 320px columns of tip cards.
4. **Submit modal** — hidden by default, opens via the hero CTA or the empty-state recovery button.

## Category palette (loop with Events / Explore / Mood)

| Category | Lucide icon | Tint token |
|----------|-------------|-----------|
| All Tips | `sparkles` | `var(--text-secondary)` (neutral) |
| Cultural | `landmark` | `var(--coral)` |
| Transport | `bus` | `var(--mediterranean)` |
| Money | `banknote` | `var(--olive)` |
| Safety | `shield-check` | `var(--gold)` |
| Food | `utensils` | `var(--accent)` (terracotta) |
| General (fallback only) | `compass` | `var(--violet)` |

`general` is the fallback category for any tip whose `.category` field doesn't match. It's not surfaced as a filter pill but is shown in the modal select (so users can submit "general" tips) and styled with violet in the card if it appears. **Don't** promote `general` to a top-level filter — the 6-pill strip is at its mobile-density ceiling.

## Hero

- `--gradient-hero` + `--gradient-dark-mesh` overlay.
- **Two orbs**: gold + olive (vs Events' coral + mediterranean). The gold/olive pair signals "wisdom + earth" — the Tips palette.
- **Headline gradient on "smarter"** uses `gold → olive → gold`. Different from Events' `gold → coral → gold` and Landing's `gold → terracotta-light → gold` — each page's headline gradient ties to its hero orb palette.
- **Share-your-tip CTA** uses `--gradient-gold` background with `--shadow-glow-gold`. It's the **only** filled gold-gradient CTA in the app — Tips is the page where we explicitly ask users to give back, so the affordance gets the most attention.

## Tip card

### Chrome
- `--surface-elevated`, `--border` 1px, `--radius-xl`, `--shadow-sm` resting.
- **3px tint strip across the top** (via `::before`) — the signature primitive that mirrors the Events date-block tint strip. Both pages use this to declare category at-a-glance.
- Hover: lifts `-4px` with `--shadow-lg`, border tints to `--cat-tint`.

### Header row
- 40px avatar (with `data-user-*` attrs so the global `UserActionMenu` activates on right-click / long-press of the author).
- Author name + relative `timeAgo` (now / Xm / Xh / Xd / "Mon D" for ≥7d). Tabular-nums.
- Category badge: tinted glass pill with Lucide icon + uppercase label. Background uses `color-mix(in oklch, <tint> 14%, transparent)`.

### Body
- Title in display font (`--text-lg`, 700).
- Content paragraph clamped to 4 lines (`-webkit-line-clamp: 4`) with `--text-base` body + `--leading-relaxed` and 60ch measure cap.

### Footer
- **Like button** + **Share button**, both outline pills.
- Like hover/active: coral. Share hover/active: mediterranean. Different from the card's `--cat-tint` to give the actions their own identity (not tied to the tip's category).
- Like button celebrates with a `1 → 1.18 → 0.94 → 1` spring scale (600ms) **only on activation**, not on un-like (un-liking should feel decisive, not festive).
- Reduced-motion disables the celebration.

## Filter strip

Same primitive as Events: `--cat-tint` per pill, tinted rainbow at rest, tinted active state via `color-mix`. `role="tablist"` + `aria-selected`. Horizontally scrollable, edge-to-edge on mobile via negative `margin-inline`.

## Submit modal

A real `<dialog>`-style overlay (CSS-driven, no `<dialog>` element because the rest of the app modals don't use it either — consistency wins).

- **Scrim**: `oklch(0% 0 0 / 0.5)` with `backdrop-filter: blur(4px)`.
- **Content card**: `--surface-elevated`, `--radius-2xl`, `--shadow-2xl`, animated entry (`translateY(12px) scale(0.96) → 0/1` with spring 280ms).
- **Inputs**: 44px min-height (touch-friendly), `--bg-secondary` resting → `--surface-elevated` on focus with a 3px tinted `--accent` ring via `color-mix(in oklch, var(--accent) 18%, transparent)`.
- **Character counter** below the content textarea (`0 / 1000`, tabular-nums) — updates on input.
- **Submit button** uses `--gradient-cta` (terracotta gradient) with `--shadow-glow` — visually distinct from the hero CTA's gold gradient. Hero CTA = "share with the community" (gold); submit = "commit your tip" (brand action).
- **Open** triggers `requireAuth('share tips')` — guests get the standard sign-in flow before the modal even opens.
- ESC closes the modal. Clicking the scrim closes the modal. Both set `document.body.style.overflow` back to default.
- **Focus management**: 80ms after opening, the title input receives focus.

## Empty state

When a filter returns zero tips:
- `lucide-sparkles` icon in `--accent-light` chip.
- Headline tailored to the filter: "No food tips yet".
- Body: "Be the first to share one — your tip helps the next traveler."
- **Two CTAs**: primary "Share your tip" (opens modal) + outline "Show all tips" (re-clicks the "All" filter).

This is the **only empty state in the app with two CTAs**. Reason: when a user filters into an empty category, they have two equally valid recoveries — broaden the search, or *be the first*. Most pages only need one CTA because the action is unambiguous. Don't generalize this pattern; it's specific to UGC-emptiness.

## Accessibility

- Filter strip is `role="tablist"` + `role="tab"` + `aria-selected`.
- Each card is a real `<article>`.
- Like button uses `aria-pressed`. The `aria-label` flips between "Like this tip" and "Unlike this tip" so SR users hear the *future action*, not the current state.
- Submit modal is `role="dialog" aria-modal="true" aria-labelledby="tips-modal-title"`.
- Form labels are explicit `<label for="...">` (no placeholder-as-label).
- Character counter is updated on input but not announced aria-live — it's a non-critical helper.
- Author avatars carry `data-user-*` for the global `UserActionMenu`.

## Anti-patterns specific to this page

- Don't add an image field to tip cards. Tips are written wisdom; an image turns them into posts.
- Don't make the card title or body clickable to "expand". The 4-line clamp is the design; if the tip needs more space, the author should split it. A click-to-expand creates two states for the same primitive and reads as friction.
- Don't reuse the Events `attend` button vocabulary for tips. Like + Share is the correct shape — no commitment, no inventory.
- Don't promote the `general` fallback category to a pill. The 6-pill strip is at mobile-density ceiling.
- Don't replace the submit-modal scrim with a sheet-from-bottom on mobile. The modal pattern matches the rest of the app (post composer, donate modal); breaking it here is a one-off cost without payoff.
- Don't change the hero CTA's gold-gradient. It's intentionally the **only** filled gold gradient in the app — Tips is where we ask users to give back, and the standout treatment is deliberate.

## Files

- Page: [web/src/pages/tips.ts](../../web/src/pages/tips.ts)
- Styles: [web/src/styles/tips.css](../../web/src/styles/tips.css) (loaded after `pages.css`)
- Mock data fallback: `web/src/data.ts`.

## Related

- [events.md](events.md) — textual sibling; shares the filter strip + tint propagation primitives.
- [explore.md](explore.md), [mood.md](mood.md) — same category-tint vocabulary.
- [messenger.md](messenger.md) — the `data-user-*` contract used on tip author avatars.
