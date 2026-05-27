# Feed page (`#/`)

> Page-level overrides to `design-system/MASTER.md` for the signed-in home feed. Inherits everything not listed here.

## Style direction

Feed is the canonical **Nature Distilled** content surface — quiet, content-dense, brand reserved for ~10% of the visual budget (CTAs, active sort, Pro variant, reactions). The cinematic / mesh treatments from MASTER §2b are explicitly **not** used here; the landing page owns those.

## Layout

- `.compass-shell` — page shell, max-width `--page-max` 1280px, horizontal padding `--page-padding` (clamped 1rem→2rem).
- `.compass-top` — band above the feed split (welcome strip, onboarding banner if applicable, Tunisia pulse, mood compass). Always full-width.
- `.compass-body` — 2-column on ≥1024px: `minmax(0, 1fr) 336px`. The 336px right rail is the discovery sticky panel (`TunisiaNowPanel`). On <1024px collapses to single column; the discovery content is injected above the sort bar via `.compass-discovery-mobile`.

## Sort bar (`FeedSortBar`)

Replaces the previous Tailwind utility row with a token-driven segmented pill control.

- **Position:** `position: sticky; top: calc(var(--nav-height) + var(--space-2))`.
- **Elevation on scroll:** an `IntersectionObserver` watches a 1px sentinel above the rail and toggles `.is-scrolled`. When scrolled, shadow lifts (`--shadow-sm` → `--shadow-lg`) and border tints to `--accent-light`. Cheaper than `position: sticky + scroll listener`, no layout thrash.
- **Active pill:** `--accent` background with `--accent-text`, `--shadow-sm`. Inactive pills use `--text-secondary`. Hover lifts to surface-hover.
- **Refresh button:** rotates 360° on click (CSS class toggle + 500ms timeout). The query invalidation fires immediately — the rotation is a *confirmation*, not a *gate*. Pre-existing fetch state is what makes the button feel responsive; the rotation tells the user the click registered.
- **Meta counter:** "{n} posts" at `--text-xs` `tabular-nums`, hidden on mobile to save space.
- **Hidden tabs:** `mine` and `following` are stripped when not authenticated.

### Anti-patterns
- Don't add more than 6 sort tabs — overflow scroll on mobile already hurts touch ergonomics.
- Don't move the refresh icon outside the rail — it loses spatial association with the sort it refreshes.
- Don't replace the IntersectionObserver scroll-state with a `window.scroll` listener — main-thread thrash on long feeds.

## Compose box (`.compose-v2`)

Top-of-feed composer. Most-tapped surface for logged-in users → gets a dedicated treatment but not a Pro-flair treatment (that's reserved for individual paying users' posts).

- Card chrome: `--surface-elevated`, `--shadow-sm`, `--radius-xl`.
- **Trigger pill:** fills available row width, looks like a search input but is a button (cursor `text`). The user-name strong-tag inside gives it identity.
- **Action chips:** Photo (green/success), Check in (mediterranean), Feeling (gold). Each chip's SVG inherits a colored icon while the label stays neutral until hover — this is **intentional**; the colored icons read as a legend, and hovering commits to the action.
- Avatar in row hovers with `scale(1.05)` spring.
- Card hover lifts shadow to `--shadow-md` and tints border to `--accent-light` — communicates "this is an action surface" without flashing color.

### Anti-patterns
- Don't add a fourth chip — three is the FB convention and fits one-handed reach on mobile.
- Don't make the trigger a real `<input>` — it would steal focus on every page load and trigger the mobile keyboard. Modal handles input.

## Post card (`.post-card-v2`)

The post card is the single most-rendered element in the app. Every visual decision here multiplies across hundreds of mounts per session.

- **Chrome:** `--surface-elevated`, `--border` 1px, `--radius-xl`, `--shadow-sm` resting, `--shadow-md` on hover (no transform on hover — would cause layout shifts on stacked cards).
- **Image scale on hover:** `transform: scale(1.02)` on inner `<img>`, not the card itself. Container has `overflow: hidden` so it doesn't bleed.
- **Title:** `--font-display` 700, `--text-lg`. Body: `--font-sans`, `--text-base`, max 65ch measure to keep scannable.
- **Action footer:** flex row of equal-flex buttons; min-height 40px (touch-friendly). At `<480px` labels collapse to icons-only **except** the Tip label (keep visible — it's the monetization affordance).
- **Pro variant** (`.is-pro`) — defined in MASTER §12 and `messenger.css`. **Don't redefine here.**

### Media grid
- 1 image: full-width 16:10 aspect.
- 2 images: 2-col 2:1 ratio.
- 3 images: 2fr 1fr asymmetric.
- 4 images: 2x2 square.
- 4+: shows first 4 with `+N` overflow badge.

## Empty / error / end states

- `.feed-empty` — 72px circle icon in `--accent-light` + display-font headline + 42ch body + single primary CTA. Tone shifts by sort: "Your story starts here" (mine), "Follow people…" (following), "Be first" (default).
- `.feed-end` — small "You've reached the end" mark flanked by 36px hairlines. Lower visual weight than the empty state — it's a punctuation mark, not a destination.

## Skeleton

Shimmer skeleton uses `--surface-hover → --surface-active → --surface-hover` gradient, 200% width, 1.6s linear loop. Disabled under reduced-motion.

## Accessibility

- Sort bar is `role="tablist"` with each pill `role="tab"` + `aria-selected`.
- "{n} posts" counter is `aria-live="polite"` — announces to SR users when sort changes.
- Action footer buttons each have `aria-label` matching their visible label; on `<480px` where labels collapse, the `aria-label` still names the action.
- Empty/end states use proper heading hierarchy (`h3`) — they're not just decorative paragraphs.

## Performance

- Posts are rendered by React Query with `refetchInterval: 60_000` background refresh — don't add a second poller.
- The infinite scroll uses a sentinel + IntersectionObserver at `threshold: 0.1`. Don't replace with `window.scroll`.
- The sort bar's elevation-on-scroll also uses an IntersectionObserver sentinel — same reason.
- When the list passes ~50 posts, consider switching to `@tanstack/react-virtual` (already a transitive dep). Currently safe up to ~50 items per session.

## Files

- Page: [web/src/react/pages/FeedPage.tsx](../../web/src/react/pages/FeedPage.tsx)
- Compose box: [web/src/react/components/ComposeBox.tsx](../../web/src/react/components/ComposeBox.tsx)
- Right rail: [web/src/react/components/FeedRightRail.tsx](../../web/src/react/components/FeedRightRail.tsx) (active conversations, top explorers, activity ticker)
- Styles: [web/src/styles/feed.css](../../web/src/styles/feed.css) (loaded after `pages.css`)
- Right panel widget: `TunisiaNowPanel.tsx` — not touched in this redesign, left for a focused follow-up.
