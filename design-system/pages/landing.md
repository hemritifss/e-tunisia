# Landing page (`#/hero`)

> Page-level overrides to `design-system/MASTER.md` for the unauthenticated landing experience. Anything not listed here inherits from MASTER.

## Style layer (deviation)

This page uses **MASTER §2b — Cinematic / Aurora Mesh** as its base layer (dark mesh-gradient background, atmospheric glow), not Nature Distilled. The reason: a landing page is brand-statement chrome, not a content surface. Nature Distilled is reserved for feed/explore/passport where dense content needs quiet surfaces. Below the fold, individual sections (Discover, Itineraries, Why, Testimonials, Pricing) drop back to Nature-Distilled cards on the standard `--bg-secondary` background — the cinematic treatment is the hero alone.

## Section order

1. **Hero** — slideshow + canvas particles + 3 floating mesh orbs + headline (gradient on "Tunisia") + Arabic accent + CTA pair + social-proof avatar stack.
2. **Live Pulse strip** — overlapping the hero/below-fold seam (`margin-top: -space-12` desktop). Tabular-num counters animate up on scroll-into-view. Always rendered even pre-auth.
3. **Stats** (existing) — refined with mesh-gradient background + gradient-text numbers.
4. **Discover places** (existing) — refined with hover-shine and lift.
5. **Itineraries** (existing).
6. **Mood Bento** — 5-tile asymmetric grid linking to `#/mood/<slug>` routes. The 1st tile is 3×2, two are 3×1, two are 1×1, and the 5th spans the full row. On mobile collapses to 2 columns.
7. **Governorate Marquee** — kinetic typography strip cycling 24 governorate names with gold `✦` separators. Pauses on hover. Disabled (wraps + stops) under `prefers-reduced-motion`.
8. **Why** (existing) — refined with gradient borders.
9. **Testimonials** — 6 community quotes in a glass-card grid; 2 are Pro-styled.
10. **Partner CTA** (existing).
11. **Logos** (existing).
12. **Pricing** (existing) — popular card gets Pro flair (gold gradient border + glow).
13. **Final CTA** (existing) — refined with mesh background + gradient headline.
14. **Footer** (existing).

## Override-specific rules

### Hero
- **Headline gradient** uses `.tn-grad` — animated linear gradient (gold → terracotta-light → gold) cycling 6s. Apply to one or two words max — never the entire headline.
- **Arabic accent line** uses Noto Kufi Arabic at 85% opacity on `oklch(85% 0.06 80)` — warm parchment, not stark white.
- **Mesh orbs** (3) sit at `z-index: 1` below the slideshow overlay (`z-index: 2`) but above the slideshow itself. Sizes: 520px / 460px / 380px. Filter: 80px blur. Opacity 0.4–0.55. 18s float animation with staggered delays.
- **Hero meta avatar stack** uses dicebear placeholders — replace with real user avatars when an authenticated public-stats endpoint exists.

### Live Pulse strip
- **Position:** `z-index: 3`, `margin-top: -space-12` on desktop (overlaps hero by ~6rem), `-space-8` on mobile.
- **Layout:** 3-column grid (online indicator · stats · avatar stack) on desktop; single-column stacked + centered on mobile.
- **Counters:** `font-variant-numeric: tabular-nums` to prevent layout shift mid-animation. Animation triggered only when `intersectionRatio ≥ 0.4`.
- **Online dot:** breathing animation (1.8s) on a `--success` core with expanding `oklch(57% 0.15 155 / 0.x)` ring. Disabled under `prefers-reduced-motion`.

### Mood Bento
- **Grid:** 6 cols × 200px rows desktop, 2 cols × 180px mobile. Asymmetric span: `3-3-2-1-6` desktop, `2-2-1-1-2` mobile.
- **Tiles:** image fills tile, dark-gradient overlay bottom-half, body text bottom-left, icon top-right in a glass pill.
- **Hover:** tile lifts `-4px`, scales `1.01`, image scales `1.06`. Spring easing.
- **Linking:** routes to `#/mood/<slug>`. If a slug has no MoodPage match yet, the page should fall through to `#/explore?mood=<slug>` — but that fallback is the router's job, not this page's.

### Governorate Marquee
- **Stroke text:** `-webkit-text-stroke: 1.5px var(--text-tertiary)` with `color: transparent`. On hover/active, both flip to `--accent`. This is the *only* place in the app where we use `-webkit-text-stroke` — don't generalize it.
- **Loop:** doubled list, scrolls `0% → -50%` over 60s. Hovering the section pauses the animation. `prefers-reduced-motion` removes the animation and wraps items.
- **Separator:** gold `✦` (filled), font-size matches the items, no stroke.

### Testimonials
- **Reuse the `.is-pro` convention** from MASTER §12 → Pro flair: gradient gold border + ribbon + avatar ring. **Don't invent** `.tn-testimonial-premium` or similar.
- **Decorative quote mark** is a CSS-only `\201C` glyph at `opacity: 0.08` — purely decorative, hidden from screen readers because it's a CSS pseudo-element.
- **Stagger:** 50ms per tile on scroll-reveal.

### Pricing (refresh)
- **Popular card** now uses MASTER's Pro-flair pattern: padding-box surface + gold gradient border-box. The "Most Popular" badge is gold gradient text on display font.
- Other cards stay neutral — the contrast is what makes "popular" pop.

### Final CTA
- Background: `--gradient-hero` + `--gradient-dark-mesh` overlay.
- **One word gets the gradient** ("real Tunisia"), not the whole headline.

## Motion budget for this page

The landing has more motion than any other surface in the app. To keep it from feeling chaotic:
- **Continuous loops:** at most 4 simultaneously (mesh orbs, marquee, particle canvas, hero slideshow). Counters and shine are one-shot, not loops.
- **Trigger budget per fold:** no more than 2 hero-grade animations visible at once. The mesh orbs + slideshow share the hero; below the fold each section gets at most one moving thing.
- **Reduced-motion:** disables marquee, orb float, gradient text, place-card shine, presence pulse. Particle canvas remains (it's gentle and atmospheric — if a user truly hates motion they can also stop the particle init via a `data-still` flag, but that's a future improvement).

## Accessibility

- All decorative SVGs and gradients are `aria-hidden="true"`.
- The Live Pulse strip is `aria-label="Community activity"` — counters are read as their final number, not the animated values.
- Testimonial cards are real `<article>` elements with quote + cite-style user block.
- Mood tiles are `<a>` not `<button>` — they're navigation.
- Marquee items are unlabeled decorative text; the section as a whole is `aria-label="Governorates of Tunisia"`.

## Anti-patterns specific to this page

- Don't add a fifth continuous-loop animation. The page already runs at the motion budget ceiling.
- Don't tokenize `-webkit-text-stroke` — it's a one-off here.
- Don't replace the mesh orbs with a CSS background image — the orbs are the cheapest way to get atmospheric depth at 60fps.
- Don't show the Live Pulse strip with `0` values while data loads — if a real backend endpoint hooks up later, render static placeholder numbers first, then animate on scroll (the current implementation does this).
- Don't extend the gradient-headline pattern to body text. It's reserved for hero/CTA headlines.
- Don't reuse `.tn-*` classes outside this landing — they're page-scoped chrome, not a shared system.

## Files

- Markup: [web/src/pages/hero.ts](../../web/src/pages/hero.ts)
- Refinement styles: [web/src/styles/landing.css](../../web/src/styles/landing.css) (loaded after `pages.css`)
- Original styles: `web/src/styles/pages.css` lines 7830–8500 (kept intact as the foundation `landing.css` builds on)
