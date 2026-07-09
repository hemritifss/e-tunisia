# Profile edit page (`#/profile-edit`)

> Page-level overrides to `design-system/MASTER.md`. Inherits cover + avatar chrome from `user-profile.css`.

## Style direction

The page intentionally **mirrors the public profile layout** so users see exactly how their changes will look. The cover + avatar wrap come from `user-profile.css` unchanged; what's new here is the editing affordances (editing chip on the cover, avatar-edit overlay, completeness meter, section cards, sticky save bar).

## Editing chip

Top-right of the cover (where `user-profile` shows the edit-cover button on self), a frosted-glass "Editing profile" chip with `Pencil` icon. Static — doesn't animate, doesn't dismiss.

## Avatar edit overlay

The existing 128px avatar wrap from `user-profile.css` gets an overlay button on hover (or focus):
- 100% inset darkening (`oklch(0% 0 0 / 0.45)`).
- `Camera` icon centered in white.
- Opacity 0 resting → 1 on hover/focus.

Clicking opens a hidden `<input type="file">` for image upload. Files >5MB are rejected with a toast.

## Completeness meter

A self-contained card with a 30%-opacity `--gradient-mesh` overlay (same pattern as the passport's profile-completion bar and the badges progress card).

- **Header row**: stacked label "PROFILE STRENGTH" (uppercase 11px tracking-wide) over a percentage + tier pill.
- **Tier pill** has 3 variants:
  - 90%+ (`great`): `--gradient-gold` background with `Star` icon → "ALL-STAR" (replaces the old ⭐ emoji).
  - 60%+ (`good`): `--accent` tinted background with `TrendingUp` icon → "STRONG".
  - <60% (`low`): `--bg-tertiary` with `Sprout` icon → "JUST STARTING".
- **Missing items** ("Add: avatar · bio · …") shown on the right when score < 100.
- **8px progress bar** with `--gradient-cta` fill; flips to `--gradient-gold` when tier is "great". Animates `width` change with `--duration-slow`.

The meter recomputes on every input change — the user gets immediate feedback as they fill the form. Reduced-motion respects via the `width` transition only (no animated mesh).

## Section cards (`.pe-section-card`)

3 cards in an auto-fit grid (`minmax(340px, 1fr)`):

1. **Basic info** — `UserCircle` icon, terracotta accent. Full name (required asterisk) + bio textarea with character counter.
2. **Location & links** — `Globe2` icon. Country + website + phone.
3. **Account** — `ShieldCheck` icon. Email (read-only, disabled state visible).

Each section header has a 40px `--accent-light` icon chip + title + subtitle. Body uses the standard `.input-group` + `.input-label` + `.input` primitives (page-scoped to avoid leaking into other pages).

## Inputs

- 44px min-height for touch-friendliness.
- `--bg-secondary` resting → `--surface-elevated` on focus.
- Focus state adds a 3px `--accent` tinted ring via `color-mix(in oklch, ...)` with fallback to `--accent-light`.
- Disabled state: `--bg-tertiary` + `--text-tertiary` + `cursor: not-allowed`.

## Sticky save bar

On `<768px`, a sticky bar at the bottom with full-width Cancel + Save buttons. Desktop uses the inline Edit + Cancel pair in the cover identity row (inherited from `user-profile.css`).

## Loading + error states

- **Loading**: centered spinner with "Loading…" text in `pe-loading` chrome.
- **Error** ("Could not load your profile"): same 72px `--accent-light` icon chip pattern as feed/explore empty states + headline + body + back-to-profile button.

## Accessibility

- `aria-label` on the back floating button.
- Editing chip uses `aria-live="polite"` so SR users hear the state.
- Input `aria-label` is implicit via the visible `<label>` for each field.
- Character counter for bio is updated on input but not announced (non-critical helper).
- Required asterisk uses `<span class="input-required">*</span>` — visible only, with the actual `required` attribute on the input doing the SR work.

## Anti-patterns

- Don't replace the avatar-edit overlay with a separate "Change photo" button below the avatar. The overlay pattern is what makes the page feel like *editing the same surface* the public profile shows.
- Don't add a confirm dialog on save. Profile fields are non-destructive — confirm dialogs add friction without preventing harm.
- Don't show the completeness meter on the public profile. It's an owner-only encouragement, not a public score.
- Don't change the tier labels arbitrarily. The 3-tier progression (Just starting → Strong → All-star) maps to the user's emotional journey with their profile.

## Files

- Page: [web/src/pages/profile-edit.ts](../../web/src/pages/profile-edit.ts)
- Styles: [web/src/styles/profile-edit.css](../../web/src/styles/profile-edit.css)
- Foundation: `web/src/styles/user-profile.css` (cover + avatar wrap)

## Related

- [user-profile.md](user-profile.md) — the public version of the same chrome.
- [settings.md](settings.md) — paired utility page.
