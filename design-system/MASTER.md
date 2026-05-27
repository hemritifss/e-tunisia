# e-Tunisia — Design System (MASTER)

> Source of truth for visual & interaction design across the e-Tunisia web app.
> Generated with `ui-ux-pro-max` skill v2.5 and reconciled against the existing
> `web/src/styles/tokens.css` (v2.0). When a page needs to deviate, create
> `design-system/pages/<page-name>.md` — page rules override Master.

---

## 1. Product context

**What it is:** Community-driven tourism platform for Tunisia — discovery, sharing, gamification (passport, badges, levels), interactive map, social feed.

**Pattern (validated):** **Community/Forum + Travel hybrid**
- Conversion focus: show active community (members, posts today), preview content, easy onboarding.
- CTA placement: Join button prominent + after member showcase.
- Color strategy: warm, welcoming. Member photos add humanity. Topic badges in brand colors. Activity indicators green.
- Section order (landing): Hero → Popular topics → Active members → Join CTA.

**Stack:** Vite + React 19 + TypeScript + Tailwind 3 + Framer Motion + Lucide React + Leaflet. **Not React Native** — desktop + mobile browsers.

---

## 2. Style direction

Two style layers coexist and are selected per surface:

### 2a. Nature Distilled (primary, content surfaces)
Warm, earthy, handmade-feeling — terracotta + sand + olive + cream. Used on feed, explore, profile, place cards, passport stamps. Confirmed by `--design-system` search as the correct match for cultural tourism / community products.

### 2b. Cinematic / Aurora Mesh (hero, landing, premium, passport showcase)
Dark mesh-gradient backgrounds, atmospheric glow, mediterranean blue + violet + gold accents. Used for hero, premium upsell, passport share screen, AI Travel Planner. Tokens: `--gradient-hero`, `--gradient-mesh`, `--gradient-dark-mesh`, `--neon-*`.

### 2c. Glassmorphism (overlays & navigation)
Frosted-glass surfaces with `--glass-bg`, `--glass-blur`, `--shadow-glass`. Used on nav, dropdowns, modals, sheet overlays. **Always verify 4.5:1 text contrast** against the live blurred backdrop — this is the #1 glass failure mode.

### 2d. Sleek (opt-in via `data-design="sleek"`)
Quiet, hairline-bordered, ~10% brand budget. Apply on pages where information density dominates (admin, settings, inquiries, dashboards). Already tokenized as `--sleek-*`.

### What we do NOT mix
- Don't use Aurora mesh on dense list pages (feed, explore, search) — it competes with content.
- Don't apply glassmorphism on read-heavy text blocks — only on chrome (nav, sheets, modals, dropdowns).
- Don't combine neon glow (`--neon-*`) with Sleek surfaces — they belong to different layers.

---

## 3. Color tokens (canonical)

All colors live in OKLCH in `web/src/styles/tokens.css`. **Never inline raw hex/oklch values in components** — always use the semantic token.

### Brand
| Role | Token | Use |
|------|-------|-----|
| Primary brand | `--terracotta` / `--accent` / `--primary` | CTAs, brand emphasis, active states |
| Secondary brand | `--mediterranean` | Links, info, water/sea cues |
| Tertiary brand | `--gold` / `--amber` | Achievements, premium, passport stamps |
| Supporting | `--olive`, `--sand`, `--coral`, `--violet`, `--cyan` | Category badges, mood chips, accents |

### Semantic
`--success` (olive-green), `--warning` (amber), `--error` (coral-red), `--info` (mediterranean), `--upvote` (olive-green), `--downvote` (terracotta-red).

### Surfaces / text
`--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--surface`, `--surface-hover`, `--surface-active`, `--surface-elevated`, `--border`, `--border-light`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-muted`, `--text-inverse`.

### Dark mode pairing rule
Dark theme is **already defined** in `tokens.css` under `[data-theme="dark"]`. When adding a new color: define both modes in `tokens.css` — never branch in component code. Verify dark mode contrast independently; don't infer from light mode.

---

## 4. Typography

| Role | Token | Family |
|------|-------|--------|
| Display (h1–h3, hero, landing) | `--font-display` | Outfit (fallback: Plus Jakarta Sans → Inter) |
| Body / UI | `--font-sans` | Inter (fallback: Noto Kufi Arabic for RTL → system-ui) |
| Mono (data, timers, prices) | `--font-mono` | JetBrains Mono → Fira Code |

**Scale tokens:** `--text-xs` (11px) → `--text-7xl` (80px). Use `--text-base` (15px) for body. **Minimum body 15px** — never go below.

**Weights:** display 800 / headings 600–700 / body 400 / labels 500 / mono 400–500.

**Tabular figures:** use `font-variant-numeric: tabular-nums` for prices, vote counts, passport stats, leaderboards — prevents layout shift on changing numbers.

**RTL:** Arabic content auto-uses Noto Kufi Arabic via the body font stack. `[dir="rtl"]` increases `--leading-normal` to 1.7. Don't add inline `direction` overrides — set on the root `<html>`.

---

## 5. Spacing, radius, elevation

- **Spacing:** 4-based scale via `--space-1` (4px) → `--space-32` (128px). Stick to this rhythm; never invent values like `13px` or `27px`.
- **Radius:** `--radius-sm` 6px (chips, inputs) / `--radius-md` 10px (buttons) / `--radius-lg` 16px (cards) / `--radius-xl` 22px (sheets, modals) / `--radius-2xl` 32px (hero feature cards) / `--radius-full` (avatars, pills).
- **Elevation scale:** `--shadow-xs` → `--shadow-2xl` for ambient; `--shadow-glow*` for branded emphasis; `--shadow-glass` for glass surfaces; `--shadow-card-hover` on interactive cards. **Pick one scale per surface and stay consistent.** Don't author one-off `box-shadow:` in components.

---

## 6. Motion

Use the defined `cubic-bezier` curves — never `linear` for UI motion, never `ease` (browser default is bland).

| Token | When |
|-------|------|
| `--ease-out` | Element enters, hover, expand |
| `--ease-in-out` | Position/size transitions |
| `--ease-spring` | Press feedback, card lift, badge pop |
| `--ease-elastic` | Celebratory moments (badge unlocked, level up) |
| `--ease-bounce` | Sparingly — toast appear, FAB appear |

| Duration | When |
|----------|------|
| `--duration-instant` 80ms | Press-down feedback (scale 0.97) |
| `--duration-fast` 150ms | Color, opacity, small transforms |
| `--duration-normal` 280ms | Modals, sheets, page transitions |
| `--duration-slow` 450ms | Hero reveals, multi-element stagger |
| `--duration-slower` 700ms | Reserve for hero/landing only |

**Rules:**
- Exit ~60–70% of enter duration ("exit faster than enter").
- Only animate `transform` and `opacity` (never `width`/`height`/`top`/`left`).
- Respect `prefers-reduced-motion` — `tokens.css` already zeros sleek motion; **apply the same pattern** for any new component motion.
- Modal motion: animate from the trigger (scale 0.95 + opacity) or slide from edge — never appear out of nowhere.
- Stagger lists 30–50ms per item; don't all-at-once.

---

## 7. Iconography

**One family, one stroke.** Use `lucide-react` (already in deps). Stroke width 1.5 or 2 — pick one app-wide. Sizes: 16 / 20 / 24 px (data tokens: `icon-sm` / `icon-md` / `icon-lg`).

**Never use emoji for structural icons** (nav, settings, action buttons). Emoji are fine in user-generated content (posts, comments, reactions) but not chrome.

**Brand logos** (partners, places): use official SVG. If only a raster exists, request the partner-provided SVG before shipping.

**Touch hit area:** if the visual icon is <44px, expand the surrounding button to at least 44×44.

---

## 8. Components — global rules

| Rule | Why |
|------|-----|
| One primary CTA per screen | Forces visual hierarchy; secondaries are ghost/outline |
| Buttons disabled during async (with spinner) | Prevent double-submit; visible feedback |
| Forms: label above input, error below, helper text persistent | Placeholder-as-label is the #1 form a11y failure |
| Inline validation on blur (not keystroke) | Don't yell while user is still typing |
| Toasts auto-dismiss 3–5s; never steal focus; `aria-live="polite"` | Screen-reader announceable, non-blocking |
| Confirm destructive actions; provide Undo where possible | Especially for: delete post, leave trip, remove from passport |
| Skeletons (not spinners) for >300ms loads | `--bg-secondary` skeleton blocks; shimmer optional |
| Empty states with action + guidance | Never a blank screen |
| Modals: visible close (X) + ESC + backdrop click; confirm dismiss if unsaved | Sheet swipe-to-dismiss on mobile |

---

## 9. Layout & responsive

- **Mobile-first.** Breakpoints: 375 / 768 / 1024 / 1440 (Tailwind defaults are fine).
- **Container max-widths:** `--content-max` 700px (article/feed), `--page-max` 1280px (page shell).
- **Page padding:** `--page-padding: clamp(1rem, 4vw, 2rem)` — already token-driven; use it.
- **Safe areas:** `env(safe-area-inset-*)` is wired in `.main-content`; honor it on any fixed/bottom nav.
- **`min-h-dvh`** for full-height containers (not `100vh` — mobile address bar bug).
- **No horizontal scroll on mobile.** Verify at 375px before merging.
- **z-index scale:** `--z-base` 1 / `--z-raised` 10 / `--z-dropdown` 50 / `--z-sticky` 100 / `--z-overlay` 200 / `--z-modal` 300 / `--z-toast` 400 / `--z-tooltip` 500. Never use raw z-index numbers.

---

## 10. Accessibility (non-negotiable)

1. **Contrast:** body text 4.5:1 minimum; large text and UI glyphs 3:1. Verify glass surfaces independently — backdrop contrast lies.
2. **Focus rings:** keep them visible (`--sleek-focus-ring` or 2–4px outline with brand). **Never remove `outline:none`** without replacing it.
3. **Keyboard nav:** Tab order matches visual order. All interactive elements reachable. Modals trap focus and return it on close.
4. **Screen reader:**
   - Icon-only buttons → `aria-label`.
   - Toasts → `aria-live="polite"`.
   - Form errors → `aria-live` region or `role="alert"`.
   - Images with meaning → descriptive `alt`. Decorative → `alt=""`.
5. **Color isn't the only signal.** Upvote/downvote, success/error: pair with an icon or text.
6. **Reduced motion** respected (already handled for sleek; **extend to all new animated components**).
7. **Heading hierarchy** sequential, no skipping h1→h6.
8. **Form labels** use `<label for="…">` — placeholder is helper text, never the label.

---

## 11. Performance

- **Images:** WebP/AVIF, `loading="lazy"` below the fold, explicit `width`/`height` or `aspect-ratio` to prevent CLS. Use `srcset` for hero/place images.
- **Fonts:** `display=swap` (already set on the Google import). Don't preload every weight — pick critical only.
- **Code split** by route (already configured via Vite). Lazy-load heavy components (Leaflet map, AI Travel Planner, charts).
- **Virtualize** any list >50 items (feed, leaderboard, place lists). Consider `@tanstack/react-virtual` (compatible with the existing `@tanstack/react-query`).
- **Reduce reflow:** batch DOM reads then writes; never animate layout-affecting properties.
- **CLS budget:** <0.1 — reserve space for skeletons and async content.

---

## 12. Domain-specific patterns (e-Tunisia)

### Feed (Reddit-style)
- Compact mode (1 line per post) vs comfortable mode (preview) — already supported.
- Vote buttons: `--upvote-bg` / `--downvote-bg` with icon + count (color-not-only).
- Optimistic UI on vote and comment — already wired via React Query.

### Place card
- Hero image with explicit aspect ratio (16:9 or 4:3) — no CLS.
- Rating stars: filled = `--gold`, empty = `--border`. Always include numeric rating + count nearby for SR users.
- Category chip in supporting color (`--olive`, `--cyan`, `--violet`).

### Map (Leaflet)
- Markers in brand colors. Cluster at low zoom.
- Popups: use the same card chrome (`--surface-elevated`, `--shadow-md`, `--radius-lg`) so the map feels native to the app.
- Provide a list view fallback — map alone fails a11y.

### Passport / gamification (current branch focus: `feat/passport-phase-1`)
- Badge cards use `--gradient-gold` or `--gradient-brand` only for **earned** badges; locked badges desaturate to `--bg-tertiary` with reduced opacity (0.5).
- Stats counters use `font-variant-numeric: tabular-nums`.
- Stamp/badge unlock animation: `--ease-elastic` + scale 0.6→1.0, `--duration-slow`, with `prefers-reduced-motion` fallback to opacity-only.
- Level-up celebration is the *one* place to use a brief confetti burst — keep ≤600ms, dismissible.

### Charts (XP graphs, leaderboards, analytics)
- Trend: line chart. Comparison: bar. Distribution: bar (avoid pie for >5 categories).
- Always: legend visible near chart, tooltip on hover/tap, axis labels with units, table fallback for SR.
- Data lines vs background ≥3:1 contrast. Use shape/pattern in addition to color for colorblind users.

---

## 13. Anti-patterns to avoid

From the skill audit + recurring issues in this codebase:
- Generic stock photos for Tunisia content — use real partner / community photos.
- Emoji as nav/settings icons.
- Glass surfaces over images without verifying contrast.
- Multi-stop neon glow on small UI (buttons, chips) — reserve for hero/showcase.
- Custom shadows authored per component — always use a `--shadow-*` token.
- Hardcoded hex/oklch in `.tsx`/`.ts` — always route through `tokens.css`.
- Mixing filled and outline icon styles at the same hierarchy level.
- Booking flows buried under decoration — keep complex flows simple, save flair for landing/passport.

---

## 14. Pre-delivery checklist (per page or component)

Visual:
- [ ] All colors come from `tokens.css` (no inline hex/oklch)
- [ ] Icons from `lucide-react`, consistent stroke width, no emoji as chrome
- [ ] Glass surfaces verified for ≥4.5:1 text contrast on live backdrop

Interaction:
- [ ] One primary CTA per screen
- [ ] Tap/click feedback within 100ms; spring or fast easing
- [ ] Async buttons disable + show spinner
- [ ] Touch targets ≥44×44 (use `hitSlop` equivalents on small icons)

Light/Dark:
- [ ] Both themes tested live, not inferred
- [ ] Primary text ≥4.5:1, secondary ≥3:1 in both modes
- [ ] Modal scrim opacity strong enough (40–60% black) in both modes

Layout:
- [ ] Tested at 375 / 768 / 1024 / 1440 px
- [ ] No horizontal scroll at 375
- [ ] Safe areas respected; fixed bars don't overlap content
- [ ] 4/8-based spacing rhythm

Accessibility:
- [ ] Keyboard reachable, focus visible, tab order matches visual
- [ ] Icon-only buttons have `aria-label`
- [ ] Color is never the only signal
- [ ] `prefers-reduced-motion` honored
- [ ] Heading hierarchy sequential
- [ ] Form labels visible (not placeholder-only); errors near field with `role="alert"`

Performance:
- [ ] Images sized + lazy below fold + WebP/AVIF
- [ ] No CLS from late-loading content
- [ ] Lists >50 items virtualized
- [ ] Heavy components lazy-loaded by route

---

## 15. How to use this file (for AI agents)

When asked to build or modify a UI surface in this project:

```
1. Read design-system/MASTER.md (this file).
2. Check if design-system/pages/<page-name>.md exists.
   - If yes → its rules OVERRIDE Master.
   - If no → use Master exclusively.
3. Generate code that uses tokens from tokens.css — never raw values.
4. Run the Pre-delivery checklist (section 14) before reporting done.
```

When creating a new page that deviates from Master (different style layer, density, etc.), add the deviation to `design-system/pages/<page-slug>.md` with only the overrides — don't restate Master.
