# e-Tunisia — Creative Idea Bank

> Companion to `UNIQUENESS.md`. Maximal-creativity backlog: every idea is carnet-native,
> Tunisia-specific, and mapped to systems that already exist. Ratings: Impact ★1–5
> (uniqueness + emotion + growth), Effort S/M/L. "Slot" = which UNIQUENESS phase it joins.

---

## Collection A — The map as a national treasure

### A1. Parchment fog-of-exploration ★★★★★ · M · Phase 2 — ✓ SHIPPED Jul 14 2026
> Built as `web/src/react/components/FogMap.tsx` + `styles/fog-map.css`, replacing the
> old city-dot `TunisiaMap` (removed — it carried a terracotta glow AI-tell) in the
> passport "Tunisia journey" section. Geometry: geoBoundaries TUN ADM1 (24 governorates,
> simplified), projected onto the same plate-carrée transform as the passport outline
> (`x=17.42·lon−116.53, y=−21.01·lat+789.78`, max-err 1.4 in the 100×160 viewBox),
> Douglas-Peucker eps 0.35 → `web/src/react/components/tunisia-governorates.ts` (9.5 KB
> of path data). Unvisited = pencil-hatch parchment fog + faint name; a check-in inks the
> region terracotta (fill-opacity + fog-fade transition, 700ms) with white name + `Nº n`;
> `governoratesFromCities()` resolves visited cities→gov ids. Hover tooltip (name/Arabic/
> status), "N / 24 inked" counter matching the stamp album directly below it, progress bar,
> all-fog empty state. Both themes + reduced-motion verified.
The user's personal map: **unvisited governorates render as blank parchment** with faint
pencil hatching and their name in light mono; a check-in "inks in" the region — color,
label, tiny illustrated motif appear with an ink-bleed transition. The whole country
becomes a scratch-map you color by traveling. Pairs 1:1 with governorate stamps.
*How:* GeoJSON of the 24 governorates as a Leaflet overlay; per-user visited set already
derivable from check-ins. CSS filter/opacity per feature. Reduced motion: instant fill.

### A2. Ink route trails ★★★★ · M · Phase 4
"Where I've been": the user's real movement (sequence of check-ins, trip routes from the
existing OSRM pipeline) drawn as a **dashed fountain-pen line** across their map, with
tiny date postmarks at stops. The Yearly Edition replays it as one continuous stroke.

### A3. Vintage survey cartography ★★★★★ · L · Phase 3
Replace default tiles with a custom map style: sepia paper ground, terracotta roads,
serif/mono labels, hachure relief — "Carte de Tunisie, 1:200 000" aesthetic. This is the
single biggest surface still generic (every travel app shows the same OSM tiles).
*How:* MapLibre GL + custom style JSON (OpenFreeMap vectors) or a tinted raster fallback
(CSS filter on tile layer) as a cheap first step. Markers = mini rubber stamps (§5.6).

### A4. Compass rose spinner · S · Phase 1
Map loading indicator = hand-drawn compass rose that settles north. Kills the last
generic spinner.

---

## Collection B — Philately as a game system (deepen the crown jewel)

### B1. Misprint stamps ★★★★★ · S · Phase 2
Real-world philately's most valuable stamps are **errors**. Randomly, ~1 in 1,000
check-ins issues a *misprinted* stamp — inverted center, off-register color, doubled
impression. Ultra-rare, purely cosmetic, wildly collectible. One RNG roll + 3–4 SVG
filter variants of existing stamps. Collectors will check in obsessively.

### B2. First Day of Issue covers ★★★★ · S · Phase 2
The first 50 users to check into a **newly confirmed gem** get a "First Day of Issue"
postmark on their stamp. Directly rewards racing to fresh contributions — feeds the gems
engine's cold-start.

### B3. Se-tenant friendship pairs ★★★★ · M · Phase 4
Check in at the same place within the same hour as a friend → both receive a **joined
pair stamp** (se-tenant: two designs sharing perforation). The social check-in mechanic,
expressed philatelically.

### B4. Seasonal overprints ★★★ · S · Phase 3
Stamps earned during Ramadan, JCC film festival, summer season carry a small diagonal
overprint (like wartime overprints). Zero new art — a text layer on existing stamps —
and it timestamps memories ("earned during Ramadan 2027").

### B5. The National Collection ★★★★★ · M · Phase 3
A public "print run" per governorate: *"Le Kef — 786 / 1,000 stamps issued; the plate
retires when the run completes."* Community-wide collective goal that **drives traffic
to under-visited interior regions** (the platform's actual mission), creates urgency
(limited edition), and gives every check-in national meaning. Aggregate counter +
almanac page; ties into city leaderboards already shipped.

### B6. Community records almanac ★★★ · S · Phase 3
Beyond leaderboards: permanent **records** — "Longest day route: 31 km — A. Ben Salem,
Apr 2026" · "Most governorates in one month: 11". Records create folklore; folklore
creates community identity.

---

## Collection C — The Correspondent (AI with a soul)

### C1. AI as travel correspondent, not chatbot ★★★★★ · M · Phase 3
Rebrand the concierge as **The Correspondent** — a seasoned travel writer who lives in
your carnet. Same backend (ai.service), completely different frame:
- Answers render as **typed letters** (mono, dateline "Tunis, 11 July") not chat bubbles.
- Short tips appear as **pencil margin notes** in context: on a place page — *"you're
  12 km from the best brik in the country — worth the detour."*
- Voice guide: warm, wry, knows Tunisia like a local uncle; trilingual (Derja touches).
The chat UI is the most commoditized surface in software; a letter is unmistakable.

### C2. Telegram mode for quick answers ★★ · S · Backlog
One-line AI answers styled as telegrams — "MEDINA CROWDED BEFORE NOON — STOP — GO AT
16H — STOP". Charm feature; A/B for kitsch tolerance.

### C3. The developed photo ★★★ · M · Phase 4
Upload a photo → auto-enriched caption suggestion by AI in Caveat ("golden hour at Sidi
Bou Said, 19:42") the user can accept/edit. Makes every print feel curated.

---

## Collection D — Social objects (things people send, sign, keep)

### D1. Postcard DMs ★★★★★ · M · Phase 4
Send a friend a **real postcard** in-app: place photo print on the front, your Caveat
message on the back, postmarked with the place + date — **only sendable from a place
you're checked into.** Scarcity makes it meaningful and drives check-ins. Non-users
receive it via link → the postcard IS the referral. Reuses messenger + OG pipeline.

### D2. Livre d'or (guest book) on every place ★★★★ · M · Phase 3
Separate from reviews: a **signature book** — handwritten name, date, one line, no
ratings. "Kont houni ✍". Scrolling a famous café's guest book with 400 signatures is
pure presence and zero review-fatigue. Light moderation (short text, existing pipeline).

### D3. Crossed paths ★★★★ · M · Phase 4 (opt-in)
Checked into the same place on the same day as someone → a quiet carnet line: *"You
crossed paths with 3 travelers at Ribat de Monastir."* Optional wave/follow. Serendipity
is the oldest travel magic; privacy-first (opt-in, aggregate by default).

### D4. Boarding-pass invites ★★★★ · S · Phase 3
Referral links become **personalized boarding passes**: "SEAT 12A — TUNIS AWAITS —
issued by Amine". Reskins the existing referral system into an artifact people actually
post. (referral.css already exists.)

### D5. Trip manifest signatures ★★★ · S · Phase 2
Collaborative trips (already shipped): co-editors "sign" the trip cover in Caveat.
Group identity in one detail.

---

## Collection E — Shareability engineered, not begged

### E1. Screenshot-native pages ★★★★★ · S–M · Phase 1 onward
Design rule: every Journal artifact (stamp album spread, trip recap, yearly edition,
records) composes perfectly at **4:5 and 9:16** with a discreet dual-script wordmark
folio. People screenshot beautiful things unprompted — engineer for the screenshot
instead of adding share buttons.

### E2. OG postcard set (already planned) + stamp sheet share ★★★★ · M · Phase 3
Monthly auto-generated "stamp sheet" share image: your month's stamps as a philatelic
sheet with perforations. Wrapped-cadence sharing without waiting for December.

### E3. Embeddable Ambassador seal ★★★ · S · Backlog
Bloggers/hotels embed a small embossed-seal widget ("Ambassadeur e-Tunisia — Sousse").
Backlinks + status flex.

---

## Collection F — Material details (the last 5% that reads as luxury)

### F1. Sound identity kit ★★★★ · S · Phase 2
Exactly five sounds, off by default, one toggle: stamp thunk · page turn · pencil
scratch (note typing) · paper slip (toast) · seal press (level-up). Recorded/foley-real,
< 40 KB total. Sound is the most under-used uniqueness channel on the web.

### F2. Wet ink ★★★ · S · Phase 4
Entries under 24h old render with slightly darker "wet" ink and a faint sheen, drying to
normal. The carnet feels alive; costs one timestamp comparison + a CSS class.

### F3. Earned cover stickers ★★★★ · M · Phase 4
Your carnet cover collects **stickers earned by actions** (first gem, 5 governorates,
night-owl check-in) — laptop-lid energy, arranged with slight random tilt. Cannot be
bought; only Pro adds the leather cover + gilt edges (premium = material, not features).

### F4. `::selection` + cursor nib · S · Phase 1
Text selection = highlighter (sand-yellow light / ink-blue dark); optional pen-nib
cursor on Journal surfaces only. Two lines of CSS each; disproportionate craft signal.

### F5. Print stylesheet ★★★ · S · Phase 3
`@media print`: carnet pages, itineraries, and the passport album print beautifully
(black ink, hairlines, no chrome). "Print your trip" is on-concept, aids offline travel
(roaming!), and no competitor bothers. Pairs with printable-passport PDF.

### F6. 500 error = "ink spilled on the press" · S · Phase 1
Completes the lost-letter (404) family: press-jam illustration, mono apology, retry as
"reprint".

---

## Collection G — Arrival & belonging

### G1. Passport-control onboarding ★★★★ · M · Phase 3
Register = **"Issue my passport"**: name → stamped date of issue → choose interests as a
**sticker sheet** (peel & place) → first-stamp ceremony (tutorial check-in or "stamp of
intent" choosing your first dream destination). 60 seconds, zero forms-feeling.
Login = simply "opening your carnet" (cover flip, instant).

### G2. Welcome letter ★★★ · S · Phase 3
First carnet page is a short signed letter from a real team member (rotating), in the
Correspondent's voice, trilingual. Sets "inhabited, not populated" from minute one.

### G3. "Large Print Edition" ★★★ · S · Phase 1
Frame the accessibility text-size toggle as an edition of the journal. A11y as brand
feature, not a settings checkbox.

---

## Collection H — Rhythms (retention without notifications spam)

### H1. The Sunday Dispatch (planned §9.3) — plus Ambassador column ★★★★ · M · Phase 4
Each city's monthly Ambassador contributes one short column to the Dispatch. Status for
them (title already exists), editorial soul for the digest, zero content cost.

### H2. Today in Tunisia strip ★★★ · S · Phase 2
Masthead date strip gains one daily line: weather almanac + "this day" fact + featured
gem. The app feels *dated* — like a real periodical — for the cost of one Redis-cached
line. (Weather system already exists.)

### H3. Hidden stamp easter eggs ★★ · S · Backlog
Long-press the wordmark, visit at 3am, check in during rain → secret stamps ("The
Insomniac", "Under the Rain"). Communities form around finding them.

---

## Top 10 build order (impact ÷ effort, respecting phase gates)

| # | Idea | Slot |
|---|------|------|
| 1 | A1 Parchment fog map | Phase 2 |
| 2 | B1 Misprints + B2 First Day covers | Phase 2 |
| 3 | E1 Screenshot-native rule | Phase 1 (design rule, free) |
| 4 | F1 Sound kit + F4 selection/cursor + F6 500 page | Phases 1–2 (craft batch) |
| 5 | B5 National Collection | Phase 3 |
| 6 | D4 Boarding-pass invites | Phase 3 |
| 7 | C1 The Correspondent reframe | Phase 3 |
| 8 | D2 Livre d'or | Phase 3 |
| 9 | A3 Vintage cartography | Phase 3 (raster tint first, vector style later) |
| 10 | D1 Postcard DMs | Phase 4 |

Everything here obeys UNIQUENESS.md governance: tokens only, both themes + RTL, reduced
motion, banned-tells list, and the 85/15 quiet-chrome/loud-moments budget.
