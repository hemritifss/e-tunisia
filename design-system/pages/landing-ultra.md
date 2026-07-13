# Landing ULTRA — "Le Carnet Vivant" (the journal that writes itself)

> **Status: SHIPPED (Jul 13 2026).** Supersedes the *motion & narrative* layer of
> [landing.md](landing.md); the visual identity (paper/ink tokens, ephemera
> components, banned-tells list) carries over 100% intact.
>
> **As built** — code in `web/src/react/pages/landing/` (LandingPage orchestrator +
> Scene* files + choreo.ts + TunisiaMap.tsx), styles in `web/src/styles/landing-ultra.css`
> (additive on landing-editorial.css), photos in `web/public/img/journey/` (12 Wikimedia
> shots + `night.jpg`). Deviations from plan: the final CTA gained a full-bleed
> ink-washed Grand Erg night photo (user request — the pure-ink page felt empty);
> postcards flip once on viewport entry (hover flip-back was cut as gimmicky); the
> odometer interpolates the stops' real cumulative road km so the number always agrees
> with the stop on screen; place-card covers always prefer the API's 960px thumb over
> the multi-MB original (LCP). QA'd via headless Edge: desktop/mobile/dark/reduced-motion,
> zero console errors, zero mobile horizontal overflow.
>
> **Polish pass (same day):** all landing photos re-encoded to sized WebP (~7 MB → ~1.3 MB;
> hero LCP print 1027 KB → 200 KB); every Wikimedia photo carries its real author + license
> in the caption (CC compliance as a design feature); Djerba's satellite lead image replaced
> with Djerbahood (Galerie Itinerrance); Traversée stops resolve to real catalog places at
> runtime (`?search=` → stretched link + "in the index →" chip, progressive enhancement);
> philatelic mini-stamps pop onto the map as the route passes each stop (governorate-stamp
> mechanic teased — note: SVG positioning must live on an outer group, CSS animation on an
> inner one, or the animation clobbers the transform attribute); scroll-depth funnel events
> (`landing_scene_view`, `landing_traversee_complete`, hero/final CTA clicks) via
> `analytics.track()`; hero P.S. marginalia randomizes per visit. Journey originals (.jpg)
> deleted — only .webp ships; PWA precache glob excludes jpg/webp so no SW bloat.

---

## 1. Diagnosis — why the current page feels "AI besla" despite the good identity

The carnet identity is right (it's ours, it's non-template). What's missing is everything
an expert art director adds *after* the visual system — and it's exactly the layer AI
output never has:

| Symptom | Root cause in code |
|---|---|
| Feels static / dead | One animation in the whole page: a generic `.ej-reveal` opacity+translateY fade on IntersectionObserver. Every section enters identically. |
| No story | Sections are a *list* (index, routes, moods, why, postcards, pricing…) not an *arc*. Nothing builds; scroll order could be shuffled and nothing would break. |
| Repetitive / cheap imagery | Only 3 photos exist (`hero1-3.png`) and they repeat across hero, index fallback, and all 5 moods. Expert pages are photo-driven; ours recycles. |
| Flat, no depth | Zero parallax, zero layering, zero pinning. Everything scrolls at 1:1 speed on one plane. |
| Timid typography | Hero caps at ~4rem. Award-level editorial pages commit to massive display type (6–9rem) and let it be the design. |
| Uniform rhythm | Every section = kicker + h2 + lede + grid. No full-bleed moments, no scene changes, no breathing. |
| Straight-line sections | Sections butt against each other with flat edges — no transitions between "scenes". |

**Thesis:** keep the carnet as the *set design*, add the *direction*: a scroll-driven
narrative where the journal assembles itself as you read — prints settle, routes draw,
stamps thunk, pages turn. Print logic, but alive.

Validated against the design DB (`ui-ux-pro-max`): *Scroll-Triggered Storytelling*
(chapter structure, progressive color per chapter, progress indicator, mobile
simplification), *Horizontal Scroll Journey* (one pinned horizontal track max, keep nav
visible), *Immersive Experience* (skip affordance, mobile fallback essential).

---

## 2. Narrative arc — one journey, nine scenes

The page is no longer a feature list. It is **one trip across Tunisia, told as a journal
being written**. Chapter numbers stay (`Nº 0X` folios) but now they mean something: the
reader travels north-coast → interior → desert → returns at night to write the last page.

**Progressive color script** (background drifts per chapter — slow, 400ms crossfades on
scroll, never a hard cut):
`--paper` (bright coastal morning) → `--paper-warm` (interior afternoon) → sand-tinted
warm (desert) → `--paper-deep` (ink night, final CTA). Dark theme = night edition
throughout, with the same *relative* drift.

### Scene 0 — The cover opens (load intro, one-time, ≤1.4s, skippable)
- Masthead date-strip letters stamp in (opacity steps, not fade), wordmark last.
- Hero title lines rise out of masks line-by-line (100ms stagger), the hand-drawn
  underline SVG draws itself (`stroke-dashoffset`) *after* the word "locals" lands.
- The 3 hero prints "toss" onto the desk: each settles with paper physics
  (translateY + rotate spring, 80ms stagger), tape appears, then the rubber stamp
  **thunks** last (scale 1.35→1, rotate −8°→−3°, ink-ring ripple).
- `prefers-reduced-motion` or a repeat visit (sessionStorage flag): everything renders
  instantly in final state. No exceptions.

### Scene 1 — The desk (hero, persistent depth)
- **Three depth planes:** watermark تونس (slowest, 0.15× scroll speed) / prints
  (0.85–1.1×, each print slightly different = the stack feathers apart as you scroll) /
  copy (1×). Subtle — max 40px total divergence.
- **Mouse tilt** on the print stack (desktop only): ±2° rotateX/Y toward cursor, spring
  smoothed. The desk feels physical. Off on touch + reduced-motion.
- Route doodle draws on first scroll tick (stroke scrub over the first 300px of scroll).

### Scene 2 — ✦ NEW CENTERPIECE ✦ "La Traversée" (Nº 00 — the crossing)
The one section that makes the page unmistakably expert. **A pinned map journey.**
- Full-viewport pinned scene (`position: sticky`, ~350vh of scroll driving it).
- Left/center: hand-drawn SVG outline of Tunisia (ink stroke on paper, film grain intact)
  with a dashed route that **draws itself as you scroll** (stroke-dashoffset scrubbed to
  scroll progress) through 6 real waypoints:
  Sidi Bou Said → Medina of Tunis → El Jem → Kairouan → Tozeur/Matmata → Djerba.
- At each waypoint: a **photo print slides in and pins** beside the map (new photo per
  stop — see §5 asset pass), with mono coordinates, Caveat caption, and a governorate
  mini-stamp that thunks when the route line reaches the pin.
- Background executes the color script (coast-bright → desert-warm) across the scene.
- Copy: one short line per stop ("Day 3 — the amphitheater before the crowds"), Fraunces
  italic, crossfading. Mini-CTA at final stop: "Chart your own crossing →" (#/itineraries).
- **Folio progress** during the scene: "km 0 — km 512" mono counter tied to scroll (this
  is scrubbed position, not a fake count-up stat — allowed).
- **Mobile:** map pins at 40vh sticky top, stops stack beneath and scroll past it;
  route still draws. No horizontal motion, no pinned copy.
- **Skip:** the scene is normal document flow — scrolling fast simply plays it fast.
  Never hijack wheel velocity.

### Scene 3 — Nº 01 The index (places)
- Prints **deal onto the page** like dealt cards: staggered 50ms, each arriving with its
  own `--tilt` and a 1-frame shadow bloom (paper physics settle, not a uniform fade).
- Category sticker "peels" on hover (slight rotate + shadow).
- Section head: chapter folio becomes oversized — "Nº 01" at ~120px, 6% ink opacity,
  positioned behind the h2 (print-shop confidence, replaces empty air).

### Scene 4 — Nº 02 Field routes (boarding passes)
- Each ticket enters flat, then gets **punched**: the notch holes pop (scale 0→1,
  60ms) and the barcode "scans" (a 1px ink line sweeps across it once, 300ms). Once,
  on entry — no loops.
- Hover: stub shears 1° from body along the perforation (torn-almost feel).

### Scene 5 — Nº 03 Moods — the postcard rack (horizontal journey)
- **Pinned horizontal track** (the DB's Horizontal Scroll Journey — used once, here
  only): section pins for ~200vh while the 5 mood postcards travel right-to-left,
  scrubbed to scroll. Cards overlap slightly like a rack being flipped through; the
  active card straightens to 0° and lifts.
- Governorate ticker relocates here as the rack's "rail" — it gains meaning as a strip
  of destinations instead of decorative filler between hero and stats.
- **Mobile:** native horizontal snap-scroll carousel (touch-idiomatic), no pinning.

### Scene 6 — Nº 04 Manifesto (typographic scrub)
- The pull-quote **inks itself in word-by-word scrubbed to scroll** (each word from
  `--ink-faint` 20% → full ink as it crosses the viewport center — the reading pace
  becomes the animation). This is the cheapest "expensive-looking" move in the plan.
- Terracotta quote mark drawn as SVG stroke on entry.
- The 3 columns keep drop caps; hairline rules **draw** (scaleX 0→1, 400ms, staggered).

### Scene 7 — Nº 05 Postcards (testimonials, CSS 3D)
- Postcards arrive **address-side up** (stamp + postmark + Caveat name only), then
  **flip to the message side** (rotateY 180°, 500ms, spring) when they cross 40% viewport
  — staggered so the grid ripples. Hover flips back to peek at the address side.
- Postmark wavy cancellation lines draw on flip (stroke-dashoffset, 250ms).
- Reduced-motion: message side rendered statically, address artifacts as flat ornaments.

### Scene 8 — Letter + Partners + Fares (calm valley)
- Deliberately QUIET. After three animated scenes the form section must read as "sit
  down and write". Entries are simple settles; the letter card gets a single tape-corner
  peel on entry. Partner logos: plain 200ms stagger fade. Fares: perforation tears
  slightly on hover of the featured stub; "MOST LOVED" stamp thunks once on entry.
- This is the ~85/15 quiet/loud budget applied *within* the page.

### Scene 9 — The last page (final CTA, night)
- Color script completes: paper → `--paper-deep` ink night across a 150vh approach
  (scroll-scrubbed crossfade, the "sun sets" as you approach the end).
- The big stamp thunks when the section pins into view; then a **signature writes
  itself** — "أهلاً وسهلاً" as an SVG stroke handwriting animation (1.2s, once).
- Footer = colophon, static, zero motion. The journal is closed.

### Persistent chrome
- **Folio bookmark** (replaces any generic progress bar): fixed at the right page edge,
  mono, rotated 90°: "p. 04 — Nº 02 Field routes", updating per scene + a 1px ink
  progress rule along the very edge. On mobile: just the ink rule.
- Masthead: unchanged, but gains a 0.5px bottom rule that fades in when scrolled (it
  already tracks `is-scrolled`).

---

## 3. Motion system — "paper physics", codified

Extends UNIQUENESS §5.3. All values become CSS custom properties + one shared TS object
(`web/src/react/lib/choreo.ts`) so every scene speaks the same dialect:

| Token | Value | Used for |
|---|---|---|
| `--dur-micro` | 120ms | hover states, sticker peel |
| `--dur-enter` | 280ms | settles, deals |
| `--dur-flip` | 500ms | postcard 3D flip |
| `--dur-draw` | 400–1200ms | SVG stroke draws (length-proportional) |
| `--ease-settle` | `cubic-bezier(.22,1,.36,1)` | everything entering |
| `--ease-thunk` | spring(500, 30) | stamps only |
| stagger | 50ms grid / 80ms heroes / 100ms text lines | groups |
| exit | 0.65 × enter duration | anything leaving |

**Scroll grammar (hard rules):**
1. **Enter-once** animations (settle, deal, punch, flip, thunk): play a single time,
   triggered at 15–40% viewport, never reverse on scroll-up.
2. **Scrubbed** animations (route draw, manifesto ink, color script, horizontal rack,
   parallax): purely position-mapped, `useScroll` + `useTransform` + spring smoothing —
   scroll fast = plays fast. **Never** animate on a timer while pinned, never adjust
   scroll velocity, never `preventDefault` a wheel. No scroll-jacking, ever.
3. Max **2 pinned scenes** per page (Traversée + Moods rack). Final CTA pin is a cheap
   sticky, doesn't count.
4. Transform/opacity/clip-path only. No width/height/top/left. `will-change` applied on
   scene mount, removed after enter-once completes.
5. Infinite loops: ticker only (existing, pauses on reduced-motion). Nothing else loops.

**Scene transitions:** sections meet on **deckle/torn-paper edges** (2 reusable SVG
`clip-path` masks, alternating) instead of straight lines — applied at the 3 biggest
scene changes only (into Traversée, into the calm valley, into the night CTA).

---

## 4. Depth system (the "3D" that fits print language)

No WebGL in phases A–D — depth comes from layered paper, which is both cheaper and
on-brand:
- 3-plane scroll parallax in hero (§Scene 1) and waypoint prints in Traversée (±20px).
- Mouse-tilt desk (hero only, ±2°, spring, desktop only).
- Real CSS 3D: postcard flips (Scene 7), perspective 1200px on the grid container.
- Shadow choreography: `--paper-shadow` → `--paper-shadow-lift` transitions do the depth
  work everywhere else. No new shadow values.
- **Backlog (Phase E, optional):** one WebGL flourish — paper-grain displacement on the
  hero title or a globe-to-map zoom opener. Only if A–D ship at 60fps on mid phones.

---

## 5. Art direction asset pass (as important as the code)

The single biggest "cheap" signal today is 3 recycled photos. Plan:
- **Curate 18–22 photos** via the existing Wikimedia pipeline (memory: photo pipeline
  ships 0-stock covers): 6 Traversée waypoints, 5 moods, 6 index fallbacks, hero 3
  (re-pick hero shots for morning coastal light), CTA night shot (medina lantern /
  desert stars).
- **Print treatment enforced** (UNIQUENESS §5.7): uniform 4:3 / 16:9 crops,
  `aspect-ratio` set (CLS 0), white matte, mono caption with REAL coordinates and
  attribution ("photograph by —" credit line — required by CC licenses anyway; we turn
  compliance into a design feature).
- Slight per-photo warm print grade (one shared CSS `filter: saturate(.92) sepia(.06)`)
  so wildly different sources read as one album.
- AVIF/WebP + `srcset`; hero print 1 is the LCP: preloaded, fetchpriority=high, never
  lazy. Everything below the fold lazy.

**Copy pass** (same discipline): every caption gets real data — coordinates, altitudes,
"est. 698 AD", distances between Traversée stops. Data density in the margins is the
editorial tell that says "humans researched this."

---

## 6. Tech plan — zero new dependencies

- **framer-motion 12 is already installed.** Everything above is `useScroll`,
  `useTransform`, `useSpring`, `useInView`, `motion.*` + CSS `position: sticky` for
  pinning. **No GSAP, no Lenis, no three.js.** (Native scroll + spring-smoothed
  transforms feel "buttery" without hijacking the scrollbar.)
- **File structure:** split the 556-line `HeroPage.tsx` into
  `web/src/react/pages/landing/` scenes:
  `LandingPage.tsx` (orchestrator + color script + folio bookmark) + `Scene*.tsx` per
  chapter + `choreo.ts` (tokens) + `TunisiaMap.tsx` (Traversée SVG, waypoint data with
  real place ids from the catalog).
- **CSS:** `landing-editorial.css` stays the base; new `landing-ultra.css` adds only
  choreography/depth/torn-edge layers (same `.ej-*` namespace, additive classes
  `.ej-scene`, `.ej-parallax-*`, `.ej-torn-*`).
- **Traversée map:** one hand-drawn-style SVG path of Tunisia (draw it from the real
  geo outline, simplified to ~80 points, roughened slightly so it reads as ink not
  GeoJSON). Route path length measured at mount → scrubbed via `pathLength`.
- Data: existing `hero-places` / `hero-itineraries` queries unchanged; Traversée
  waypoints link to real `#/place/:id` where the catalog has them.

---

## 7. Performance & accessibility gates (ship-blockers, not suggestions)

- **Reduced motion = a complete, beautiful static page.** Every enter-once renders in
  final state; scrubs render at 100%; pins become normal flow; parallax/tilt off. Test
  it as a first-class variant, not a degraded one.
- 60fps scroll on a mid-range phone (Moto G-class throttle in devtools). Any scene that
  can't hold it gets simplified on mobile, per the DB's "mobile: simplify animations".
- LCP ≤ 2.5s (hero print preloaded, intro animation doesn't block paint — it animates
  already-painted elements); CLS < 0.1 (aspect-ratio everywhere); no layout reads in
  scroll handlers (framer's motion values never touch layout).
- Keyboard/screen-reader: pinned scenes are ordinary DOM order; folio bookmark is
  `aria-hidden`; Traversée stops are a semantic `<ol>`; all decorative SVG stays
  `aria-hidden`; focus outline unchanged (3px `--mediterranean`).
- 375px: no horizontal overflow (the moods rack is the only horizontal surface and is
  native snap-scroll on mobile).
- The banned list from [landing.md](landing.md) still applies in full, plus new bans:
  **scroll-jacking, wheel hijack, autoplay background video, animated counters
  (scrubbed km counter in Traversée is position-mapped, thus exempt), loop-forever
  decoration.**
- QA gotchas carried over: unregister the PWA service worker before visual checks;
  `.ej-reveal`-style held-at-opacity-0 content makes full-page screenshots look empty.

---

## 8. Build order (each phase ships independently, page never breaks)

| Phase | Scope | Effort | Gate |
|---|---|---|---|
| **A — Choreography foundation** | `choreo.ts` + split scenes into `landing/`, upgrade all entries to paper-physics settles/deals (kills the uniform fade), Scene 0 intro, hero parallax + mouse tilt, folio bookmark, oversized chapter folios, big-type hero scale | ~2 days | Reduced-motion parity; 60fps; visual diff of static layout ≈ unchanged |
| **B — La Traversée** | Tunisia SVG, route scrub, waypoint prints + stamps, color script wiring, mobile stacked variant, asset pass for the 6 waypoints | ~2–3 days | Scene reads start-to-end on 375px; skip-by-fast-scroll works; LCP unaffected |
| **C — Scene dialects** | Moods horizontal rack (+ticker relocation), postcard flips, ticket punch/scan, manifesto ink scrub, torn-edge transitions | ~2 days | Only 2 pins on page; keyboard order intact |
| **D — Night ending + polish pass** | Color script completion, stamp+signature CTA, calm-valley tuning, full photo/copy asset pass, print grade, exit timings | ~1–2 days | Lighthouse ≥ 90 perf/a11y; CLS < 0.1 |
| **E — Backlog** | WebGL flourish experiment, seasonal edition variants of Traversée (winter route), A/B the intro | opt-in | only if A–D hold 60fps |

**Fold-back:** when D ships, update [landing.md](landing.md) (motion section) and
`UNIQUENESS.md` §5.3 with the shipped choreography tokens; this file then becomes the
record of the system.
