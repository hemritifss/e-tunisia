# Navigation chrome

> Page-level overrides to `design-system/MASTER.md` for the global nav surfaces — top bar, mobile bottom nav, avatar dropdown, hamburger drawer. Inherits everything not listed here.

## Why this is in `pages/`

Navigation isn't a page, but it's a coherent system that touches every page. Putting it here lets future pages see one place to find nav rules without having to skim through the giant MASTER doc.

## Surfaces

1. **`#main-nav`** — fixed top bar (desktop + tablet). Hidden in `body.guest-mode` (legacy rule in `pages.css`).
2. **`#mobile-nav`** — fixed bottom tab bar (mobile only, `<769px`). Hidden in `body.guest-mode` (added in `messenger.css` cleanup).
3. **`#user-dropdown`** — avatar menu inside `#main-nav`.
4. **`#mobile-menu-panel`** — side drawer triggered by the hamburger.

## Top nav (`.nav`)

### Glass background
- Rest: `oklch(100% 0 0 / 0.78)` light / `oklch(13% 0.011 260 / 0.72)` dark. Always with `backdrop-filter: blur(24px) saturate(180%)`.
- Scrolled: opacity bumps to 0.92 + `--shadow-md` + border tint darkens to `--border`.
- Scroll state is driven by the existing `initScrollNav()` in `main.ts` toggling `.scrolled`.
- The glass blur is intentional — it's the **only** place in the app where blur is decoration, because the chrome must always read as floating above content.

### Logo
- Scales `1.03` on hover with spring easing.
- Focus ring with 4px offset.

### Nav links — sliding underline indicator
Each link has a `::after` pseudo-element underline that animates:
- Rest: width `0`, centered.
- Hover: `16px`, color `--text-tertiary`.
- Active: spans the link width minus padding, color `--accent`.

This replaces the old `background: var(--accent-light)` chip — the indicator reads as "you are here" while keeping the link itself quiet and scannable. Spring easing makes the transition feel tactile.

**Anti-patterns:**
- Don't replace this with a Framer-driven sliding indicator across the whole link row. The per-link underline approach has zero JS overhead and re-renders cleanly when links change.
- Don't widen the underline beyond `100% - var(--space-4)` on active — it looks like a heavy bar instead of an indicator.

### Search trigger
- 38px pill, `--bg-secondary` background, `--border-light` 1px border.
- The `⌘K` kbd hint uses 2px bottom-border to suggest a physical key.
- Responsive collapse: `<1024px` shrinks min-width; `<900px` collapses to icon-only square; `<768px` hides entirely (mobile uses the icon-only `#search-toggle` next to it).

### Action icon buttons (`.btn-icon`)
- Circular (was `--radius-md`).
- `transform: scale(0.92)` on `:active` for press feedback.
- Focus ring on `:focus-visible`.
- Notif badge has a subtle 2.4s pulse that respects `prefers-reduced-motion`.

### Avatar button
- 38px circle with **`--gradient-cta` gradient ring** as the natural-state visual chrome (matches Pro flair vocabulary without claiming the user is Pro).
- Scales `1.04` on hover with `--shadow-md`.
- The image inside is `--surface-elevated` to mask the gradient ring when the avatar has transparency.

## Dropdown (`.dropdown`)

### Chrome
- `--surface-elevated`, `--border`, `--radius-xl`, `--shadow-2xl`.
- Animated entry: `scale(0.96) translateY(-4px) opacity:0 → 1` over `--duration-fast` with `--ease-spring`. Origin `top right`.
- `max-height: calc(100vh - var(--nav-height) - var(--space-6))` with `overflow-y: auto`. The menu can be longer than the viewport and scrolls internally — never push the page.

### Header
- Pill-shaped pseudo-card at the top using `--bg-secondary`. Name + level inside.

### Section labels (`.dropdown-section`)
- 4 sections introduced: Profile / Library / Achievements / Business.
- Tiny uppercase labels (`10px`, `--tracking-widest`, `--text-tertiary`). Visually quiet but break the 13-item list into scannable chunks per MASTER §9 `overflow-menu`.

### Items (`.dropdown-item`)
- 9px vertical padding, `--radius-md`.
- Icons in `--text-tertiary`, switch to `--accent` on hover/focus.
- Danger items (`.text-danger` for logout) use `--error` + `--error-light` hover background.

### Anti-patterns
- Don't add a 5th section without removing one. 4 is the cognitive cap before the list feels like a list again.
- Don't put destructive actions inside a section. Logout sits below a divider, alone, for muscle memory.
- Don't tie the dropdown's max-height to a fixed px value — viewport height varies; use the `calc` formula.

## Mobile bottom nav (`.mobile-nav`)

### Chrome
- Glass background (matches top nav) + `--shadow` upward (`0 -4px 16px oklch(0% 0 0 / 0.04)`).
- 1px hairline top border (`oklch(0% 0 0 / 0.06)`).
- `padding-bottom: env(safe-area-inset-bottom)` so the home indicator on iOS doesn't overlap tabs.

### Tab items (`.mobile-nav-item`)
- `min-height: 56px`, `min-width: 56px` — touch-friendly per MASTER §2.
- Each tab has its own **top-indicator bar** via `::before` pseudo-element:
  - Rest: width `0`, height `3px`, color `--accent`.
  - Active: width `28px`, rounded bottom corners.
- Icon scales `1.08` + lifts `-1px` on active. Spring easing.
- Color shifts: `--text-tertiary` → `--text-secondary` (hover) → `--accent` (active).

### What the 5 tabs are
The 5 tabs are: **Feed · Explore · Events · Saved · Profile**. **Don't change this without a follow-up doc** — the limit is 5 per MASTER §9 `bottom-nav-limit`. The conversations launcher already lives as a separate floating button (mobile-left), so the bottom nav doesn't need a Messages tab.

### Anti-patterns
- Don't replace one of the 5 tabs with "More". The hamburger already exists; collapsing primary nav into a menu hurts discoverability.
- Don't make the indicator a full-width line — `28px` is the cap; longer reads as a separator.
- Don't show badges on more than one nav item at a time. The user already has the notif bell + the conversations FAB for unread signals.

## Mobile drawer (`.mobile-menu-panel`)

### Chrome
- Solid `--surface` (not glass — content visibility matters more than chrome polish at this size).
- Left border + `--shadow-2xl` for elevation.
- Overlay uses `oklch(0% 0 0 / 0.5)` + 2px backdrop blur.

### Sections
- Header with avatar + name + level. Header has a divider.
- Sections use `.mobile-menu-section-label` (same micro-typography as the dropdown section).
- Items are 48px tall (touch-friendly) with the same icon-tints-to-accent-on-hover pattern.

### Active state
- `--accent-light` background + `--accent` text — louder than the dropdown active state because the drawer is the user's "where do I go" surface, not an "I know where I'm going" shortcut menu.

## Accessibility

- Logo and all icon-only buttons have `aria-label`.
- The notif badge is decorative — the bell button's `aria-label` should include the unread count when implemented (already a TODO in main.ts).
- `prefers-reduced-motion` disables the sliding underline transition, the badge pulse, the indicator-bar slide, and the dropdown spring.
- Active tabs in the mobile nav announce via `.active` class + colored indicator — color isn't the only signal because the indicator bar is also visible.
- Focus rings are present on every interactive element (`:focus-visible`).

## Anti-patterns specific to this system

- Don't add a third tier of navigation (top + bottom is enough — adding a sidebar would conflict with MASTER §9 `avoid-mixed-patterns`).
- Don't show the glass background on a `position: static` nav — the blur effect requires `position: fixed` over content.
- Don't reach for `position: sticky` on the top nav — fixed + scroll listener is what makes the `.scrolled` shadow elevation work cleanly.
- Don't put a search input *inside* the dropdown. Search lives in the search trigger + command palette only.

## Files

- Markup: [web/index.html](../../web/index.html) — `#main-nav`, `#mobile-nav`, `#user-dropdown`, `#mobile-menu-panel`.
- Foundation styles: `web/src/styles/components.css:7-152` (top nav) + `:1094-1117` (mobile nav).
- Refinements: [web/src/styles/nav.css](../../web/src/styles/nav.css) (loaded after `components.css`).
- Scroll-state JS: `initScrollNav()` in `main.ts` toggling `.scrolled` on `#main-nav`.
- Guest-mode hide rules: `pages.css:3730+` (top nav) + `messenger.css` guest-mode block (bottom nav + FABs).
