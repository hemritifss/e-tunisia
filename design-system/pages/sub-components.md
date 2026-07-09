# Sub-components (combined doc)

> Polish pass over twelve sub-components that the larger pages embed. All styled via [web/src/styles/sub-components.css](../../web/src/styles/sub-components.css).

## Components covered

| Component | File | Used by |
|-----------|------|---------|
| PassportStats | `react/components/PassportStats.tsx` | Passport hero |
| TunisiaMap | `react/components/TunisiaMap.tsx` | Passport "journey" section |
| BadgeGrid | `react/components/BadgeGrid.tsx` | Passport + Badges page |
| PassportTabs | `react/components/PassportTabs.tsx` | Passport (Trips / Reviews / Saves) |
| EndorseModal | `react/components/EndorseModal.tsx` | Passport (Endorse button) |
| TopEndorsementsStrip | (same file) | Passport hero |
| FollowList | `react/components/FollowList.tsx` | Passport (followers/following sheet) |
| SignupGate | `react/components/SignupGate.tsx` | Passport 404 + anon CTA |
| PassportOnboarding | `react/components/PassportOnboarding.tsx` | Post-signup welcome |
| donate-modal | `donate-modal.ts` | Anywhere — credits, profiles |
| safety-menu | `safety-menu.ts` | User-profile, future post/comment menus |
| trip-cart-ui | `trip-cart-ui.ts` | Global floating cart |

## Emoji-removal summary (MASTER §4)

| Component | Old | New |
|-----------|-----|-----|
| BadgeGrid | `🌟 👣 🧭 ⭐ 🔖 🕌 🐪 🏖` (8 earned-badge emojis) | Lucide via `b.icon` (`star / footprints / compass / star / bookmark / landmark / sun / waves`) |
| PassportTabs | `★`.repeat(rating) text glyphs | Lucide `Star` row with `is-filled` class |
| EndorseModal | `t.emoji` next to every topic | Lucide via `t.icon` (extended in earlier round) |
| TopEndorsementsStrip | `meta.emoji` in compact chips | Same Lucide icon lookup |
| TunisiaMap | `rgba(212, 98, 58, ...)` raw color | `oklch(55% 0.16 30 / ...)` matching `--terracotta` |
| PassportOnboarding | 🇹🇳 in welcome + 🌟 celebrate badge | `MapPin` (welcome) + `Star fill` in gold-gradient circle (celebrate) |
| PassportOnboarding | `'#d4623a', '#1a3a73', ...` hex confetti | OKLCH literals matching `--terracotta / --mediterranean / --gold / --cyan / --violet` |
| SignupGate | `color="#0ea34c"` / `color="#d33"` inline | `data-status="ok|bad"` attribute resolved to `--success / --error` in CSS |

## Data-token additions

**`badge-definitions.ts`** — additive `icon: string` + `tint: string` fields on every badge. Legacy `emoji` + `accent` kept for back-compat. Tint maps each badge to a brand-token CSS variable.

**`FollowList`** — every list row now carries the full `data-user-*` attribute set so the global `UserActionMenu` activates on right-click / long-press.

## Per-component highlights

### PassportStats (4-tile grid)
Each tile carries a per-position tint via `:nth-child` (Cities=cyan, Trips=mediterranean, Reviews=gold, Saves=olive). Icon chips at 36px with `color-mix` 16% background. Hover lifts `-2px` with `--accent-light` border.

### TunisiaMap
SVG-driven outline of Tunisia with city dots. Visited cities flip to `--terracotta` with a `drop-shadow` glow. The empty-state CTA floats bottom-right as a pill chip.

### BadgeGrid
Earned badges get the **padding-box + gradient-border** Pro-flair pattern: white surface + per-badge tint gradient border. Icon chip switches to a tinted background with the badge's Lucide icon. Locked badges desaturate to 0.6 opacity with a `Lock` icon.

### PassportTabs
Three tabs (Trips / Reviews / Saves) with the **sliding underline** indicator pattern (`width 0 → calc(100% - space-6)` on active). Same primitive as Activity feed + Leaderboard tabs. Trip cards have a 3-image collage cover; reviews show a Lucide star row.

### EndorseModal
Topic picker — 12 buttons in an auto-fill grid. Each topic has a Lucide icon chip on the left, label in middle, state indicator on right. Active state tints background + border to `--violet` (endorsements are the violet thread across the app). Loading state shows a spinning `Loader2`. Toast no longer carries an emoji field (was 🌟 fallback).

### TopEndorsementsStrip
Compact chips below the passport hero. Each chip has a Lucide icon + label + count. Horizontally scrollable with edge-to-edge bleed via negative `margin-inline`.

### FollowList
Sheet showing followers/following. Each row carries `data-user-*` attrs.

### SignupGate
Frosted-glass modal with the passport-claim form. The handle availability indicator now uses `data-status` attribute on the status wrap to drive `--success` / `--error` text colors — removed inline `color="#0ea34c"` props that lived on Lucide components.

### PassportOnboarding
3-step wizard (Country → Interests → Celebrate). Final step shows a 80px gold-gradient circle with a filled Lucide `Star` icon (replaces 🌟). Welcome heading swaps 🇹🇳 emoji for a tinted `MapPin` chip. CSS-only confetti uses OKLCH brand-token literals.

### donate-modal
Tip / platform-support modal:
- Avatar wrapped in a gold-gradient padding-box ring (the "this is about money" cue).
- 4 preset amounts in a flex row, each becoming a gold-tinted active chip when selected.
- Custom amount input with gold focus ring.
- Submit button uses `--gradient-gold` with `--shadow-glow-gold`.

### safety-menu
Floating dropdown anchored to "more" buttons. `Report` and `Block` actions use `--error` icons; `Unblock` (when active) uses `--success`. Spring-in entry from top-right.

### trip-cart-ui
Floating FAB (bottom-right) → side-drawer (slides in from right on desktop, sheet-from-bottom on mobile <540px). FAB has accent-tint icon + tabular-num count badge. Drawer has structured header / controls / list / footer with gold-glow save button.

## Animation budget

Total continuous animations across sub-components when all are mounted simultaneously: 0 (everything is interaction-triggered or reduced-motion-safe one-shot). The confetti is a 60-piece one-shot that completes within 2.8s and removes itself with the parent. Spring entries are all under 280ms.

## Accessibility

- BadgeGrid badges have `aria-label="<name> — earned|locked"`.
- PassportTabs star rows have `aria-label="N out of 5 stars"`.
- EndorseModal topic buttons have `aria-pressed`.
- All modals have `role="dialog" aria-modal="true"`.
- All decorative SVGs and icon chips are `aria-hidden="true"` where the visible label carries the meaning.
- Reduced-motion disables: confetti, badge-pop celebration, drawer slide, modal spring entry, scrim fade.

## Anti-patterns specific to this layer

- Don't render `b.emoji` in any new code. The `icon` field is the canonical Lucide name.
- Don't use the legacy `accent` raw hex on new badge surfaces. Use `tint` (the brand-token CSS variable expression).
- Don't put inline `color="..."` props on Lucide components. Resolve via CSS classes / `data-*` attributes instead.
- Don't add a third row to the SignupGate handle status. The three states (`checking / ok / bad`) are exhaustive.
- Don't show the donate modal's gold ring on non-monetary contexts. The gold = money signal is reserved.

## Files

- Stylesheet: [web/src/styles/sub-components.css](../../web/src/styles/sub-components.css) (~900 LOC)
- Component sources: see table at the top of this doc.
