# Circuits — `#/itineraries` and `#/itineraries/<slug>`

> The old "Itineraries" page shipped five hardcoded Unsplash brochures whose only
> action was a toast. It is now the **carnet de circuits**: curated routes
> hydrated from the live place catalog, remixable to the traveller's real
> constraints, and exportable into the trip cart. Overrides `design-system/MASTER.md`;
> inherits everything not listed here.

## Style direction

Carnet Journal dialect (UNIQUENESS §6), **not** the old cinematic-mesh hero. Both
views opt in via `data-design="carnet"` + `.cn-grain` on the page root, so every
color resolves through the paper/ink token remap and the dark "night edition"
follows for free. **No orbs, no glass, no gradient text.** Editorial serif
(`--font-editorial`) for titles, handwritten (`--font-hand`) for taglines, mono
(`--font-mono`) for labels and stats, hairline `--rule` dividers, letterpress
offsets on the sticky bars.

## Data model — everything is real

Circuits are **not** stored records. `backend/src/itineraries/circuits.data.ts`
holds editorial templates (anchors: a city + governorate + tag hints + a "why"),
and `circuits.service.ts` resolves each anchor against the live `places` table:
preferred slug → best tag match in the city → best in the city → best in the
governorate, skipping anything already used so a route never repeats a place. A
template that resolves to fewer than 3 real places is hidden, never shipped as a
broken 2-pin route. Cached 10 min. Every stop the traveller sees therefore has
real coordinates, a real cover and its own `/place/:id` page.

Endpoints (declared **before** the `:id` route so the uuid matcher doesn't eat them):
- `GET /itineraries/circuits` — card summaries (no stops/knowHow/packing).
- `GET /itineraries/circuits/:slug` — full detail with resolved `stops`.

## Directory (`#/itineraries`)

- **Masthead** + toolbar: search, "I have N days" pills, sort
  (`Best for <month>` / least driving / cheapest / longest).
- **Filter chips**: theme, region, "no car needed", "in season now", "saved (n)".
- **Cards** are field-notes prints, not hero images: a photo plate tipped onto
  paper, a city chain (`Tunis → Carthage → …`), a 12-cell **season strip**
  (filled = prime month, struck = avoid, ringed = the visitor's current month),
  facts row, and — only when the traveller has stamps on that route — a carnet
  overlap bar. Cards carry save + compare actions.
- **Compare**: sticky tray (max 3) → side-by-side sheet.
- "Recommended" sort = what you could actually enjoy *this* month first.

## Detail (`#/itineraries/<slug>`)

The whole page is one live document driven by `plan.ts` (`buildPlan`), which
re-plans instantly on every control change. Sections, in order:

1. **Header** — title, handwritten tagline, summary, season verdict + strip.
   Actions: save, share, copy-as-text, print, save-offline.
2. **Remix bar** — days slider (clamped to the circuit's `dayRange`), pace
   (relaxed/balanced/packed → daily active-minute budget), transport
   (car/louage/driver → speed + cost model), start date (→ real dates + weather),
   travellers, reverse direction. Persisted per-circuit in localStorage.
3. **Overview** — stat boxes (days, stops, road km, drive time, on-site time,
   per-person cost, stamps) + a "longest hop is brutal" warning when ≥ 200 km.
4. **Map** — the real `TripRouteMap` (Leaflet, road geometry) with day chips.
5. **Timeline** — day cards with arrival clocks, weather badge, "sleep in <city>"
   base, per-stop swap/add/remove (nearby catalog picker, 35 km), slot warnings
   (arrives at the wrong time of day), transport warnings (no transit to a
   trailhead). Between days in different cities, a **louage-ticket connector**
   (`TransportOptions`).
6. **Budget** — entry (from place records) + transport + stay + food, with stay
   and food tier toggles; per-person and per-person-per-day. Assumptions are
   shown, never buried.
7. **Know-how + packing** — editorial notes and a persisted checklist (theme
   items + a universal set).
8. **Commit bar** (sticky) — "Send to my trip" loads the plan into the real
   `trip-cart` (keeps day + arrival time per stop); "Save & share a link"
   persists it server-side via `saveTrip`.

## The planner (`plan.ts`)

Pure, client-side, no invented facts. Distances = haversine on catalog coords ×
`ROAD_FACTOR` (1.25). `splitIntoDays` binary-searches a daily minute budget to
hit the requested day count, with a hard rule that a ≥ 90 km hop always ends the
day. `fitToDays` cuts priority-3 then priority-2 stops (never priority-1) when
the days are too few, and reports what it cut so the UI can say so out loud.

## Difficulty / priority

Anchors carry `priority` 1–3: 1 = the reason the circuit exists (never cut),
3 = first to drop when short on time. This replaces the old easy/moderate/hard
*difficulty tint* as the structural signal (difficulty still exists on the
circuit as a whole, shown as a plain word in compare).

## Anti-patterns

- **Don't reintroduce the mesh/orb hero or gradient-text title.** This page is
  carnet now; the cinematic hero belongs to other surfaces.
- **Don't hardcode place data into a circuit template.** Anchors resolve against
  the catalog — that is what keeps every stop clickable and current. Add a slug
  hint or a tag, not a coordinate.
- **Don't call the auth-only `getVisitedIds` for anonymous users.** A 401 there
  triggers the global `/hero` redirect in the api wrapper; gate the query on
  `api.isLoggedIn()`.
- **Don't present the cost as a single hidden number.** The tier toggles and the
  assumptions note are the honesty; keep them.

## Files

- Page entry: [web/src/react/pages/ItinerariesPage.tsx](../../web/src/react/pages/ItinerariesPage.tsx) (routes directory vs detail)
- Directory: [web/src/react/pages/itineraries/CircuitsDirectory.tsx](../../web/src/react/pages/itineraries/CircuitsDirectory.tsx)
- Detail: [web/src/react/pages/itineraries/CircuitDetail.tsx](../../web/src/react/pages/itineraries/CircuitDetail.tsx)
- Planner: [web/src/react/pages/itineraries/plan.ts](../../web/src/react/pages/itineraries/plan.ts)
- Local state: [web/src/react/pages/itineraries/store.ts](../../web/src/react/pages/itineraries/store.ts)
- Shared bits: [web/src/react/pages/itineraries/bits.tsx](../../web/src/react/pages/itineraries/bits.tsx)
- Styles: [web/src/styles/itineraries.css](../../web/src/styles/itineraries.css) (carnet; the shared modal chrome moved to collections.css)
- Backend data: [backend/src/itineraries/circuits.data.ts](../../backend/src/itineraries/circuits.data.ts)
- Backend service: [backend/src/itineraries/circuits.service.ts](../../backend/src/itineraries/circuits.service.ts)
