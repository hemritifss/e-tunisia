# Public user profile (`#/u/<handle>` or `#/user/<id>`)

> Page-level overrides to `design-system/MASTER.md` for the **other-user** profile (`web/src/pages/user-profile.ts`). Pairs with `design-system/pages/profile.md` (own profile) and shares its primitives.

## Relationship to `profile.md`

The own-profile page and the public-user-profile page are visually **twin surfaces** with different content:
- Same cover-banner treatment (cinematic mesh + 2 orbs).
- Same tier helper (`tierFor(level)` — Lucide-only, no emoji).
- Same Pro flair patterns (avatar gold ring + sparkles mark + cover variant).
- Same `data-user-*` contract on the avatar wrap for `UserActionMenu`.

The differences sit in the **content** of the sections, not their chrome:
- **Action row:** Edit profile / Credits (self) → Follow / Message / Tip / More (other, logged-in) → Sign-in CTA (guest).
- **Bio:** name + Lucide verified check + Pro sparkle inline.
- **Stats:** 4 tinted tiles — Posts / Followers / Following / XP. Followers tile is the only one that's clickable (opens follow list).
- **About card:** richer bio block with linkified `@`/`#` mentions + meta list.
- **Tabs:** Posts / Badges (+ Saved when isMe).

## Section order

1. **Cover banner** — bigger than own-profile (200–280px vs 180–240px) because the public-profile is the user's brand surface.
2. **Identity** — 128px avatar (vs 112px on own) + action buttons.
3. **Bio** — name + verified + Pro + handle + headline + meta chips.
4. **Stats** — 4 tinted tiles.
5. **About** — only renders if user has bio, country, or website.
6. **Tabs** — sticky below the global nav.
7. **Tab panels** — Posts grid (3-col desktop, 2-col mobile), Badges grid, or Saved (self-only).

## Cover differences from `profile.md`

- **Orb palette swap**: cover-orb-1 is `--mediterranean` + cover-orb-2 is `--terracotta` (vs `--terracotta` + `--gold` on own-profile). Both sets work over the dark mesh; mediterranean-first signals "discoverable / outbound" while terracotta-first signals "yours / inbound" — small but real distinction.
- **Tier badge sits bottom-left** (vs top-right on own-profile). The other user's level is meta context; on your own profile it's a self-status. The position cue matches the conceptual difference.
- **Verified users override tier icon** to `crown` regardless of level, with label "Verified". `isVerified` is true for `role === 'admin'` or `level >= 10`.

## Identity row

- Avatar overlap: `margin-top: -64px` (vs `-56px` on own-profile, scaling with the slightly bigger avatar).
- Avatar size: 128×128 inside a 4px wrap.
- **Pro mark** is 30px (vs 28px on own) — small uptick because the public profile lacks the own-profile context that says "this user is me", so the Pro signal has to stand on its own.

## Action row variants

| Viewer | Buttons |
|--------|---------|
| Self | Edit profile · Credits |
| Logged-in, other | Follow/Following · Message · Tip · ⋯ More |
| Guest | Sign in to follow |

The Follow button toggles styling:
- Not following → `--accent` primary fill.
- Following → `--surface-hover` background, `--text-primary` text. On hover, flips to `--error-light` background + `--error` text + "Unfollow" label (the hover-rename is handled in `wireActions` — see `user-profile.ts:312–334`).

**Anti-pattern:** Don't replace the Follow button's hover-rename with an explicit confirm dialog. The "Unfollow on hover" muscle memory matches Instagram/X/TikTok — a confirm dialog here breaks expected behavior.

## Stats tiles — palette

| Tile | Tint |
|------|------|
| Posts | `var(--accent)` (brand terracotta) |
| Followers | `var(--mediterranean)` (water = social pool) |
| Following | `var(--violet)` (you're orbiting them = different relationship vector) |
| XP | `var(--gold)` (achievement) |

Same `color-mix(in oklch, <tint> 16%, transparent)` pattern as own-profile with `@supports not` fallback to `--bg-tertiary`.

The Followers tile is the **only clickable stat** (opens the followers modal via `wireActions`). The cursor `pointer` is set just on it; the other three are `cursor: default`.

## Tabs

Sticky below the nav (`top: var(--nav-height)`) with a per-tab underline indicator that animates `width: 0 → calc(100% - space-6)` on active. Same indicator vocabulary as the top-nav links — consistency across the app.

Background is `--bg-primary` (not transparent) so when the rest of the page scrolls under it, the tabs remain readable.

The tab content uses `[hidden]` to toggle panels — semantic and works with no extra JS.

## Post tiles (Instagram-style 1:1)

- 3 columns desktop, 2 columns at `<540px`.
- Square aspect, `--radius-lg`.
- Hover lifts tile `-2px` with `--shadow-md`; inner `<img>` scales `1.05`.
- **Overlay** with upvote + comment counts fades in on hover only — the resting state shows just the image, matching the Instagram pattern.
- Text-only posts (no image) get a gradient placeholder with the title rendered in display font.

## Badge cards

- Min 140px tiles, auto-fill grid.
- 48px circular icon chip in `--gold` (badges = achievement → gold across the app).
- Hover lifts + tints border to `--gold`.

## Empty / loading / not-found states

- **Empty:** dashed-border card with icon + message. Used for posts panel, badges panel, and saved panel.
- **Loading:** centered spinner with `up-spin` animation. Slows to 2s under reduced-motion.
- **Not found:** large `lucide-user-x` icon + headline + body. No retry button — the user is gone or the link is invalid, retrying won't help.

## Accessibility

- Cover tier badge has `aria-label="Level X <tier>"` for SR users (icon is `aria-hidden`).
- Pro mark on avatar carries `aria-label="Pro Traveler"` or `"Verified Business"`.
- The bio Pro sparkle (inline next to the name) has a `title` for tooltip; it's decorative inside the `<h1>` and the name + handle already provide the identity.
- Tabs use `role="tablist"` + `role="tab"` + `aria-selected`.
- Post tiles are real `<a>` with descriptive alt text from the post title.
- `data-user-*` attrs on the avatar wrap activate the global `UserActionMenu` on right-click / long-press — but the visible action buttons (Follow / Message / Tip) provide the same affordances inline.

## Anti-patterns specific to this page

- Don't show the cover edit button to non-self viewers. The `isMe` check is mandatory.
- Don't add a 5th action button to the row. Use the `⋯ More` menu (already wired) for additional actions like Report / Block / Copy link.
- Don't tint the Followers stat tile as `--rose` or `--coral`. Mediterranean is the deliberate choice — followers are a "pool", not a "favorite".
- Don't make the Following stat clickable. Most platforms hide who you follow from other viewers; revealing it as a list is a privacy choice that should be a separate setting, not a default behavior.
- Don't replace the `:hover` reveal on post-tile overlay with an always-visible overlay. The Instagram pattern is intentional — image first, metadata on demand.
- Don't increase the avatar past 128px. The `-64px` overlap is tuned to that size; a 150px avatar would dip below the cover bottom edge and break the silhouette.

## Files

- Page: [web/src/pages/user-profile.ts](../../web/src/pages/user-profile.ts)
- Styles: [web/src/styles/user-profile.css](../../web/src/styles/user-profile.css) (loaded after `pages.css`)
- Foundation: `pages.css:2857+` (existing `.up-*` rules; we override most of the chrome rules in `user-profile.css`)
- Tier helper: `tierFor(level)` in `user-profile.ts` — **same shape and tier breakpoints as `profile.ts`**. If you change tier thresholds in one file, change them in the other (or extract into a shared module).

## Related docs

- [profile.md](profile.md) — own-profile page; this is its twin.
- [messenger.md](messenger.md) — the `UserActionMenu` data-attr contract that this page conforms to.
- [navigation.md](navigation.md) — the sticky-below-nav offset (`top: var(--nav-height)`) that the tabs depend on.
