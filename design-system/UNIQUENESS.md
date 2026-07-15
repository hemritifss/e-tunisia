# e-Tunisia — Uniqueness Plan ("One Living Carnet")

> Art-direction & UX enhancement roadmap. Goal: make the product visually and
> experientially unmistakable — no competitor, template, or AI generator produces this.
> Companion to `MASTER.md`; when phases below ship, fold the outcomes back into MASTER.

---

## 1. Diagnosis — where uniqueness lives, where it leaks

**What is already unique (protect at all costs):**
- The **Carnet de Voyage editorial layer** (paper/ink tokens, ephemera components, film
  grain, letterpress buttons, rotation etiquette, banned-AI-tells list) — currently
  quarantined on the landing page (`.ej-*`).
- **Tunisian OKLCH palette** (terracotta / mediterranean / sand / olive / gold) — real
  place-derived color, not a Tailwind preset.
- **Arabic as a graphic voice** (hero watermark, stamp centers) — not just translation.
- **Passport/stamps/check-in gamification** — a product mechanic that *natively* matches
  travel-ephemera visual language. This alignment is rare and is the core brand asset.

**Where it leaks (the generic 60%):**
- In-app surfaces still run on 2023–24 template layers: Aurora mesh gradients, `--neon-*`
  glows, glassmorphism chrome, Outfit display type. A visitor sees a hand-made editorial
  brand on the landing, logs in, and lands in a generic SaaS. The brand promise breaks at
  the login boundary.
- **Five parallel style layers** (Nature Distilled / Cinematic / Glass / Sleek / Editorial)
  = no single voice. Uniqueness is a function of *consistency* × *distinctiveness*; we have
  distinctiveness on one page and consistency nowhere.
- Outfit + Inter is the default "AI app" pairing; Fraunces + Caveat + mono is ours.
- Generic feedback furniture: gray shimmer skeletons, standard toasts, confetti, spinner
  buttons — all interchangeable with any product.

**Thesis:** don't invent a new identity. **Promote the carnet from a landing-page costume
to the product's operating system**, translated into a quieter dialect that survives
daily, dense use.

---

## 2. Brand thesis

**"Every screen is a page in Tunisia's shared travel journal."**

Five principles (test all future design decisions against these):

1. **Print logic over screen logic.** Hairline rules, folios ("Nº 04"), mono kickers,
   ink on paper, mastheads — not cards floating on gradients.
2. **Ephemera as UI, earned.** Stamps, tickets, postcards, tape appear where the *content*
   is a travel artifact (a check-in, an itinerary, a badge) — never as random decoration.
3. **Arabic is a design element**, not a locale. Dual-script wordmark, Arabic numerals as
   watermarks, stamp centers, section accents.
4. **The hand of the maker.** Caveat margin notes, ±tilt on prints, film grain, honest
   static numbers. Digital-perfect = anonymous; slight imperfection = ours.
5. **Quiet chrome, loud moments.** Density surfaces whisper (paper + ink + rules);
   achievement moments shout (stamp slam, gold leaf). ~85/15 budget.

---

## 3. Two dialects of one language

The scrapbook aesthetic cannot carry a feed with 200 posts. Split the carnet into two
registers, both drawing from the same tokens:

### 3a. "Journal" dialect — expressive
Full ephemera language: tape, tilts, stamps, postcards, Caveat, grain, `--paper-warm`.
**Surfaces:** landing (done), passport, badges, check-in moment, gem discovery/submit
celebration, trip cover pages, onboarding, share/OG cards, level-up, Pro upsell,
404/empty/goodbye pages, seasonal campaigns.

### 3b. "Field Notes" dialect — functional
Print discipline without the scrapbook: `--paper` surfaces, `--ink` text hierarchy,
hairline `--rule` separators instead of borders/shadows, mono uppercase meta labels,
letterpress buttons (reduced: 1px border, 2px offset shadow), underline inputs,
Fraunces **only** on page titles, zero tape/tilt/stamps in list rows.
**Surfaces:** feed, explore, search, place detail, messages, settings, profile edit,
admin, inquiries, notifications, leaderboards (almanac styling), map chrome.

**Mechanics:** new root attribute `data-design="carnet"` (same pattern as `sleek`),
defining surface/text/border/motion aliases in `tokens.css`. Pages opt in one at a time —
reversible, no big-bang migration. `sleek` remains for admin-class pages until Phase 2,
then merges into Field Notes.

---

## 4. De-generification (retire the AI tells app-wide)

Extend the landing's banned list to the whole app (grandfather Partner/About `.tn-*` until
their redesign):

| Retire | Replace with |
|---|---|
| Aurora mesh / `--gradient-mesh` backgrounds | `--paper` / `--paper-deep` ink sections |
| `--neon-*` glows | `--paper-shadow-lift` on hover; gold leaf for premium |
| Glassmorphism nav/modals | Paper masthead nav; paper sheet modals with ink scrim |
| Gradient text | Fraunces italic terracotta accents |
| Gray shimmer skeletons | Pencil-sketch placeholders (faint dashed strokes on paper) |
| Confetti (generic) | Stamp slam / wax seal / paper-scrap confetti (level-up only) |
| Pill announcement badges | Rubber-stamp or sticker labels |
| Count-up animated stats | Static mono tabular figures ("almanac honesty") |
| Outfit display font | Fraunces (display), Inter stays for UI body |

**Font consolidation (perf + identity in one move):** drop Outfit and Plus Jakarta Sans
from the Google Fonts import → Fraunces / Inter / Noto Kufi / Caveat / JetBrains Mono.
Fewer families, faster load, and every heading becomes brand-recognizable.

---

## 5. Identity systems

### 5.1 Typography roles (app-wide)
| Role | Face | Rules |
|---|---|---|
| Display / page titles / pull quotes | Fraunces (optical sizing on, 420–640) | Italic accents in `--terracotta`; never below 20px |
| UI body / controls | Inter 400/500 | Unchanged; min 15px |
| Kickers, meta, data, prices, folios | JetBrains Mono uppercase letter-spaced | `tabular-nums`; min 11px; `--ink-faint` allowed ≤11px only |
| Human annotations (captions, margin notes, signatures, empty-state prompts) | Caveat | **Never for essential info or controls** |
| Arabic | Noto Kufi | First-class: watermarks, stamps, dual-script headings |

### 5.2 Color
Palette unchanged (it is already ours). Work is **surface mapping**: under
`data-design="carnet"`, alias `--bg-primary→--paper`, `--surface→--paper-print`,
`--border→--rule`, `--text-*→--ink*`. Dark mode = existing "night edition" (already
defined — not an inversion). Semantic/vote/status tokens untouched.

### 5.3 Motion — "paper physics" (replace generic fades)
| Event | Motion |
|---|---|
| Element enters | *Settle*: translateY(8px) + rotate(±1°) → rest, `--ease-out`, 280ms |
| Card hover | *Print lift*: straighten tilt to 0°, `--paper-shadow-lift` |
| Button press | *Letterpress sink*: translate(2px,2px), offset shadow collapses, 80ms |
| Confirmation (check-in, save, submit) | *Stamp thunk*: scale 1.35→1 + rotate −8°→−3°, ink ring ripple, ≤350ms `--ease-out` |
| Destructive | Pencil-line strike-through, then slide out |
| Toast | Paper slip sliding from edge, settles with 0.5° tilt |
| Modal | Sheet of paper laid on desk: scale 0.97 + settle; scrim = ink wash 50% |
| Level-up / badge | Wax-seal press or stamp collection moment, ≤600ms, dismissible |
All respect `prefers-reduced-motion` (opacity-only fallback, tilt frozen).

### 5.4 Ephemera component library (the ownable kit)
Promote from landing one-offs to reusable components: **PhotoPrint** (matte, tape,
caption), **BoardingPass** (itineraries/trips), **Postcard** (testimonials, shares,
messages preview), **RubberStamp** (check-ins, statuses, "MOST LOVED"), **PostageStamp**
(badges, governorates), **Postmark** (dates/locations), **TicketStub** (events, pricing,
louage), **Almanac** row (stats), **MarginNote** (Caveat annotations), **FieldNote** card
(gems). All SVG-based, tokenized, both themes.

### 5.5 The collectible crown jewel: 24 governorate stamps
Design a **philatelic set — one postage stamp per governorate** (Tunis, Sfax, Djerba/Médenine,
Kairouan, Tozeur, Le Kef…): geometric vector art from local motifs (Sidi Bou Said blue
door, zellige tiles, Berber symbols, El Jem amphitheater, desert dunes), Arabic + Latin
name, denomination = the governorate's number. Earned by checking in ("Kont houni") within
the governorate. Displayed in the passport as a stamp album page. Ties gamification,
tourism spread (visit all 24!), share cards, and Ambassador titles into one collectible
visual system **no competitor can copy without copying Tunisia itself**.

### 5.6 Iconography
Keep lucide (1.75 stroke, one weight app-wide) for utility. Add a small bespoke set of
brand glyphs (stamp, ticket, postmark, route doodle, louage van, chechia) as owned SVGs —
these appear in nav accents, empty states, markers. Map markers become mini rubber stamps.

### 5.7 Photography treatment
All user/place photos render as **prints**: consistent aspect ratio (4:3 or 16:9), white
matte on Journal surfaces, thin `--rule` frame on Field Notes surfaces, mono caption line.
Uniform treatment turns wildly varying UGC photos into a coherent brand surface — and the
enforced `aspect-ratio` kills CLS as a side effect.

### 5.8 Brand mark
Dual-script wordmark lockup: Fraunces "e-Tunisia" + Noto Kufi Arabic, stacked masthead
style. App icon / favicon / OG default = circular rubber-stamp version. Use the stamp as
loading indicator identity (subtle ink-fill animation).

---

## 6. Signature UX moments (ranked by uniqueness ROI)

1. **Check-in stamp slam** (`PassportPage`, place detail "Kont houni") — the single most
   ownable interaction. Rubber stamp thunk + ink bleed + governorate stamp progress toast.
2. **Passport as a real passport** — album pages, governorate stamp grid, founder passports
   get gold-leaf page edges (`#0001–1000` already exist), visa-page share card.
3. **Gems: pencil → ink lifecycle** (`SubmitGemPage`) — unverified gem renders as a pencil
   sketch card (dashed strokes, gray); at 2-confirm→live it "inks in" (strokes solidify,
   color fills, stamp "CONFIRMED"). The moderation mechanic becomes a visible, delightful
   metaphor. Discovered-by credit in Caveat handwriting.
4. **OG postcard generator** — shares render as postcards: place photo print + city
   postmark + governorate postage stamp + user's caption in Caveat + dual-script wordmark.
   Every share becomes a brand artifact in the feed of every social network. (Extends the
   existing ogShareUrl pipeline.) **✓ SHIPPED Jul 14 2026 (place shares):**
   `GET /api/v1/og/place/:id/image.png` → carnet postcard via satori/resvg
   (`OgService.renderPlacePostcard`): warm paper, tilted photo print (white matte + shadow),
   Caveat "wish you were here" caption, Fraunces name, terracotta "TUNISIE Nº<gov>" postage
   stamp, city postmark, drawn gold stars, review count, dual-script wordmark. The place OG
   HTML now points `og:image` at it (raw-photo 302 fallback on render failure). **Caveat:
   Arabic is omitted — satori's opentype.js crashes on Noto Kufi's ligature tables; all
   Arabic stays guarded on a `kufi` buffer that's intentionally not loaded.** Fonts
   (Fraunces/Caveat) vendored via the existing loadFont CDN-cache path; Wikimedia photos
   fetched with a policy-compliant UA (generic UAs get 429'd).
   **✓ Post shares too (same day):** `GET /api/v1/og/post/:id/image.png` →
   `renderPostPostcard` = "a postcard from a traveler" (their photo, "greetings from <city>"
   caption, post title in Fraunces, "— @handle · Name" as sender, governorate stamp from the
   post's location). The layout is now a shared `buildPostcard(opts)` + `rasterize(node)`;
   place/post both compose opts through it (title font steps down by length so it never
   overflows). Post OG HTML points `og:image` at it when the post has a photo (avatar else).
   **✓ Trip shares too:** `GET /api/v1/og/trip/:slug/image.png` → `renderTripPostcard` =
   the route as a postcard (first stop's cover, "Tunis to Djerba" caption from the distinct
   stop cities, "N days · M stops" meta, stamp from the start city's governorate).
   **Glyph rule for OG cards — the loaded faces (Inter/Fraunces/Caveat) have NO `★`, `→` or
   emoji: they render as tofu boxes.** Stars are drawn as SVG (`starsSvgDataUri`); routes say
   "to", not "→". Em-dash `—` and `°` are safe. User postcards: the passport card covers it.
5. **Trips as boarding passes** (`TripPage`, `ItinerariesPage`, `DiscoverTripsPage`) —
   already designed on landing; bring the BoardingPass component in-app. Collaborative
   trips: co-editors sign the manifest (Caveat signatures).
6. **Leaderboard as Almanac** (`LeaderboardPage`) — hairline-ruled ledger, mono tabular,
   Ambassador titles as embossed seals per city.
7. **Louage tickets** (`LouagePage`) — the transport lookup renders results as real louage
   tickets (stub + perforation). Peak Tunisia; zero competitors.
   **✓ SHIPPED Jul 13 2026** — see `design-system/pages/louage.md` (mode stripes match
   real louage livery; TripPage keeps the compact list).
8. **Empty states = blank journal pages** — faint page rules + Caveat prompt
   ("This page is still blank…" / "هذه الصفحة مازالت فارغة") + one letterpress CTA.
9. **Pencil-sketch skeletons** — loading states as faint pencil layout drawings.
10. **404 / error = lost letter** — returned-to-sender envelope, stamped "ADDRESS UNKNOWN".
    **✓ SHIPPED Jul 13 2026** — `NotFoundPage.tsx` + `not-found.css`; router previously
    dumped unknown paths on the feed/blank, now falls through to the lost letter
    (island catch-all in main.ts; known routes regression-checked). Reads the route via
    `currentRoute()` (hash is normalized onto pathname). Tracks `404_view`.
11. **Onboarding = "Start your carnet"** — pick interests as sticker sheet, first check-in
    tutorial ends with the user's first stamp.
    **✓ SHIPPED Jul 15 2026 (the ceremony):** `PassportOnboarding` step 3 no longer ends on
    a Star badge + rainbow confetti (both retired). It stamps the card **CARNET OUVERT** with
    the traveler's first name + today's date, then "Your carnet is open." over a Caveat
    "page one — the rest of Tunisia is yours to fill." **Design note: the stamp thunks onto
    the card, NOT via the full-screen `stampSlam` — that idiom is for check-ins; here the
    card sits centre-screen and the slam lands right on top of the copy (caught by driving
    the real signup).** Reuses `renderStampSVG` + the shared `stamp-thunk` keyframes;
    reduced motion gets the settled stamp. `stampSlam()` gained a `top` option so moments can
    re-voice the arc (defaults to KONT HOUNI). Interests-as-sticker-sheet: still TODO.
12. **Pro upsell = First Class** (`ProUpgradePage`) — gilt-edged page, gold ticket, no neon.

---

## 7. UX craft baseline (runs through every phase)

Non-visual quality gates from the skill's CRITICAL/HIGH tiers — uniqueness dies if the
product feels broken:
- **Contrast:** ink-on-paper ≈12:1 is excellent; re-verify every Journal artifact (tape,
  stamps over photos) and both themes independently. `--ink-faint` ≤11px mono only.
- **Focus:** keep the 3px `--mediterranean` outline everywhere (blue ink = on-brand AND
  WCAG-visible).
- **Touch:** ≥44px targets; letterpress press-state gives built-in <100ms feedback.
- **Reduced motion:** every paper-physics animation ships with an opacity-only fallback.
- **Performance:** font consolidation (§4), print treatment enforces `aspect-ratio`
  (CLS<0.1), grain overlay is one inline SVG (no images), virtualize feed/leaderboard.
- **RTL:** every ephemera component mirrored and QA'd in Arabic — tilt directions, stub
  positions, postmark placement.

---

## 8. Rollout roadmap

### Phase 0 — Foundation (≈2–3 days)
- `tokens.css`: add `[data-design="carnet"]` alias layer (§5.2) + reduced-motion zeroing.
- Retire Outfit + Plus Jakarta from the font import; `--font-display: 'Fraunces', …`.
- Extract grain overlay into a shared utility class.
- `components.css`: letterpress button (2 intensities), underline input, paper toast,
  paper modal, pencil skeleton, blank-page empty state.
- Update `MASTER.md`: editorial becomes the primary layer; Aurora/neon/glass moved to
  "legacy — do not extend"; banned-tells list promoted app-wide.
- **Gate:** landing unaffected; both themes pass contrast; no page opted in yet.

### Phase 1 — Chrome (≈1 week)
- Nav → masthead (dual-script wordmark, date strip, mono links) — `nav.css`.
- Feed + Explore + Place detail + Search opt into Field Notes dialect (rules not borders,
  print photo treatment, mono meta).
- Toasts/modals/empty/skeletons swapped globally.
- **Gate:** a logged-in session is visually continuous with the landing; 375px no
  h-scroll; light+dark verified.

### Phase 2 — Signature moments (≈1–2 weeks)
- Check-in stamp slam + governorate stamp SVG set (24 designs — start with 6 pilot
  governorates, template the rest).
- Passport album redesign; gems pencil→ink; boarding-pass trips; almanac leaderboard;
  louage tickets.
- **Gate:** stamp interaction ≤350ms, reduced-motion fallback, RTL verified.

### Phase 3 — Growth surfaces (≈1 week)
- OG postcard generator (server-rendered, reuses stamp/postmark SVGs).
- Onboarding "start your carnet"; Pro "First Class"; 404 lost letter; error pages.
- Seasonal "editions" system (night edition already exists; Ramadan, summer, JCC film
  festival editions = masthead + stamp variants only, cheap to produce).

### Phase 4 — Experience arc (≈2–3 weeks, needs product + backend work)
- **My Carnet** view: chronological journal auto-assembled from existing events
  (check-ins, gems, trips, posts, badges — the data already exists in analytics_events
  and domain tables); private margin notes on places.
- **Trip recap** ("your pages are ready") 48h post-trip + postcard-set share.
- **First-stamp ceremony** folded into onboarding; travel mode "today's page".
- **Sunday Dispatch** weekly digest (blocked on Tier-1.3 email infra) and
  **Yearly Edition** recap.
- Haptics + optional stamp sound on Journal moments.
- **Gate:** a 3-month-old account's carnet is emotionally worth sharing unprompted.

### Backlog / experiments
- Bespoke brand glyph set (§5.6) beyond the initial 6.
- Partner/About migration off legacy `.tn-*`.
- Print-your-passport PDF; partner-site QR stamps (§9.6).

---

## 9. The Experience Layer — from platform to lived experience

Sections 1–8 make the product *look* unmistakable. This section makes it *feel* like an
experience: a platform is something you use; an experience is something that accumulates,
has a narrative arc, and engages more senses than sight. Three tests every quarter:
**Does the product remember me? Does it have a rhythm? Does it pay me back emotionally?**

### 9.1 The personal carnet (the emotional core)
Reframe: the features are pens — **the user's own carnet is the product.** Every action
already generates a memory (check-in, gem discovered, trip taken, photo posted, badge
earned); today those are scattered across profile/passport/activity. Assemble them into
**"My Carnet"**: a chronological, paginated journal that writes itself as a byproduct of
use. Day pages with the user's photos as prints, check-in stamps in the margin, trips as
pasted boarding passes, gems as field notes, private margin notes (Caveat) the user can
add to any place. After six months, a user opens their carnet and sees *their* Tunisia —
that artifact is unleavable. No competitor mechanic survives against "my memories live
there."

### 9.2 The trip lifecycle arc (before / during / after)
Travel platforms serve only "before." Emotion lives in all three acts:
- **Anticipation** — a planned trip's boarding pass visually fills in as the itinerary
  completes; a countdown postmark ("14 days to Djerba"); collaborative trips get
  co-editor signatures on the manifest.
- **Presence** — travel mode when a trip is active: "today's page" (day route, nearby
  gems, weather almanac line, one-tap stamp). Chrome recedes; the journal is open on
  today.
- **Memory** — 48h after the trip ends, the recap page is "developed": *"Your Djerba
  pages are ready"* — auto-assembled spread of stamps earned, gems found, photos as
  prints, route doodle, shareable as a postcard set. The after-act is where loyalty
  forms and where shares are most emotional.

### 9.3 Rituals and chapter moments
Rhythm = the difference between an app you check and a place you return to.
- **First-stamp ceremony**: onboarding ends with the user's first real stamp — not a
  tutorial tooltip, a moment.
- **Album-page completion**: finishing a governorate's stamps fills a visible page spread.
- **The Sunday Dispatch**: weekly digest styled as a small newspaper front page (new gems
  near you, your week's line in the almanac). One email/notification, print-styled,
  never more.
- **The Yearly Edition ("Vol. II — 2027")**: annual recap as a bound journal edition —
  stamps collected, kilometers, rarest gem found. The wrapped-style share moment, but as
  print, not neon.

### 9.4 Sensory depth (promoted from backlog)
Signature moments must be felt, not only seen: haptic tap on stamp slam (mobile),
optional ink-thunk sound (off by default, one setting), paper micro-texture on drag
surfaces. Scope strictly to Journal-dialect moments — Field Notes surfaces stay silent.

### 9.5 Inhabited, not populated
An experience needs hosts. Surface the humans everywhere content appears: "Discovered by
Amine" in handwriting on every gem (already designed — enforce it), city pages open with
a short **letter from the local Ambassador** (Caveat signature, postmark), onboarding
welcome is a signed note from a real person, not copy. UGC photos credited as
"photograph by —" print captions.

### 9.6 The real-world bridge
The carnet should escape the screen: print-your-passport PDF (stamp album as printable
booklet), partner-site QR stamps (scan at a café in Sidi Bou Said → physical-location
exclusive stamp), postcard printing/sending later. Each bridge makes the digital artifact
feel like a real possession — and is a physical-world growth loop.

---

## 10. Governance

- Every new page: check `design-system/pages/<page>.md`; new pages default to **Field
  Notes dialect**; Journal dialect requires a page spec declaring which artifacts it earns.
- The banned-tells list (§4) applies to **all** surfaces; PR checklist line: "no new
  `--neon-*`, `--gradient-mesh`, glass chrome, gradient text, emoji chrome".
- New ephemera components must: use tokens only, ship both themes + RTL, carry
  `aria-hidden` on decorative SVG, and respect reduced motion — before merge.
- Fold shipped phases back into `MASTER.md` so it stays the single source of truth.
