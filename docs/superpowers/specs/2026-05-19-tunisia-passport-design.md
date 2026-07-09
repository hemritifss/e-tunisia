# Tunisia Passport — Phase 1 Design

**Date:** 2026-05-19
**Status:** Draft — pending user review
**Owner:** e-tunisia growth
**Phase:** 1 of 3 (Passport spine → Network graph → Trust tier)

---

## 1. Goal

Ship the unit of public identity that the rest of e-tunisia's growth loops (viral, activation, retention, trust) can attach to. The Tunisia Passport is a public, shareable traveler profile at `/#/u/:handle`. It turns every signed-up user into a marketing surface for Tunisia and into a returning user with ego ownership over their journey.

This phase delivers two of the four growth pillars natively (viral spread + activation) and seeds the other two (retention via badge auto-awards; trust via the public surface that endorsements/verification will live on in Phase 3).

## 2. Non-goals (Phase 1)

- Follow / unfollow social graph (Phase 2).
- Push notifications / weekly digest (Phase 2).
- Verified-locals tier / endorsements (Phase 3).
- Direct messaging from passport (existing messages module is separate).
- Multi-language passport view (English-only v1; i18n in Phase 2).

## 3. Identity primitive — the `handle`

Add a public, URL-safe identifier so we never expose UUIDs.

### Schema

`backend/src/users/user.entity.ts`:

```ts
@Column({ length: 30, unique: true, nullable: true })
@Index()
handle: string | null; // public-facing slug, e.g. "amine_t". Null for legacy rows until backfilled.
```

- Length 3–30, charset `[a-z0-9_]`, lowercase, must start with a letter.
- Reserved words blocklist: `admin`, `api`, `auth`, `me`, `settings`, `signup`, `login`, `discover`, `trip`, `place`, `feed`, `posts`, `messages`, `inquiries`, etc. Lives in `backend/src/users/reserved-handles.ts`.
- `nullable: true` only to allow the backfill migration on existing rows; new signups MUST set it (validated in `RegisterDto`).

### Backfill

One-time migration `backend/src/migrations/<timestamp>-add-user-handle.ts`:

1. Add column nullable.
2. Generate handle per existing user: slugify `fullName`, append `_<4 random alphanumeric>` if collision.
3. Add unique index.
4. (Do not mark NOT NULL — legacy rows keep their backfilled handle; new signups are validated at DTO layer.)

### Required at signup

`POST /auth/register` DTO gains `handle: string`. Frontend signup form has a dedicated handle field with debounced availability check via `GET /users/handle-available?h=:handle`.

## 4. Public passport endpoint

`GET /users/by-handle/:handle` (no auth required).

### Response DTO

```ts
{
  handle: string;
  fullName: string;
  avatar: string | null;
  country: string | null;
  bio: string | null;
  website: string | null;
  interests: string[];
  badges: string[];
  points: number;
  passportLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'; // derived from points
  role: 'user' | 'creator' | 'admin';
  joinedAt: string; // ISO date, month+year only on display
  stats: {
    citiesVisited: number;
    tripsPlanned: number;
    reviewsCount: number;
    savesCount: number;
  };
  visitedCities: string[]; // city names, deduped from visitedPlaceIds → place.city joins
}
```

**Explicitly excluded:** `email`, `password`, `phone`, `plan`, `subscriptionExpiresAt`, `isActive`, `favoriteIds` (sensitive), `updatedAt`, raw `visitedPlaceIds`.

### Caching

Wrap the endpoint in a 5-minute in-memory cache keyed by handle (NestJS `CacheInterceptor` with TTL 300). Invalidate on user update / review write / trip-plan publish via service-level cache.del.

### Adjacent endpoints

- `GET /users/handle-available?h=:handle` → `{ available: boolean }`. Rate-limited to 30 req/min/IP.
- `GET /trips/by-user/:handle` (Phase 1 reuses this) — list public TripPlans for the user. Reuses existing `trips.service` with a `userHandle` filter (joins on user.handle).
- `GET /reviews/by-user/:handle` — public reviews authored by the user. Adds a filter to existing reviews controller.
- `GET /users/:handle/saves` — saved places authored by the user. Adds endpoint to saved-post or saves controller (depending on which entity backs "saves"; verify at implementation time and choose the existing module).
- `GET /users/:handle/og.png` — OG image (see §6).

### Level mapping

```
Bronze    : 0–99 points
Silver    : 100–499
Gold      : 500–1999
Platinum  : 2000+
```

Derived on read. Stored only as `points`.

## 5. Public passport page (`/#/u/:handle`)

New route in `web/src/main.ts` and component `web/src/react/pages/PassportPage.tsx`. Vanilla page entry at `web/src/pages/u.ts` for SSR-friendly meta tags (matches existing pattern of dual vanilla/react pages).

### Layout (top to bottom)

1. **Hero band** (full-width gradient inspired by Tunisia flag — restrained, not gaudy):
   - Left: avatar (96px round), `fullName`, `@handle` (muted), country flag emoji + country, `passportLevel` chip.
   - Right (desktop) / below (mobile):
     - Viewer is owner → `Edit passport` button → `/#/profile-edit`.
     - Viewer is anon → `Claim your passport →` primary CTA → signup modal.
     - Viewer is other signed-in user → `Follow` button **stubbed** (opens "Coming in Phase 2" toast). Visible but inert — sets the expectation.
   - Bio paragraph below.

2. **Stat strip** — 4 tiles, equal width:
   - `🗺️ {citiesVisited}` Cities
   - `🧭 {tripsPlanned}` Trips
   - `⭐ {reviewsCount}` Reviews
   - `🔖 {savesCount}` Saves

3. **Tunisia map mini** — SVG component `web/src/react/components/TunisiaMap.tsx`.
   - Outline of Tunisia, ~12 named city dots (Tunis, Sousse, Sfax, Djerba, Tozeur, Tabarka, Mahdia, Kairouan, Bizerte, Hammamet, Matmata, Sidi Bou Said).
   - Visited cities lit in brand color with subtle pulse; unvisited muted.
   - Empty state (zero visited): map dimmed + overlay CTA "Start your journey →" linking to `/#/discover` or `/#/discover-trips`.
   - City coordinates hardcoded in `web/src/react/components/tunisia-cities.ts`.

4. **Badge grid** — 8 slots in a 4×2 grid.
   - Earned badges: full color + label + tooltip with how-earned.
   - Empty slots: locked icon + faded label (tease retention).
   - Badge definitions in `backend/src/badges/badge-definitions.ts` (single source of truth). Each: `{ id, label, icon, criteria, points }`.

5. **Tabs** — `Trips · Reviews · Saves`. Lazy-load each tab's data on click.
   - Trips tab: grid of user's public TripPlans (reuses `discover-trip-mini` card).
   - Reviews tab: list of recent reviews with place thumbnails.
   - Saves tab: grid of saved places (only if `saves` are public — guard with user setting; for v1, public by default).
   - Empty states for each tab nudge the relevant action.

6. **Share row** — `Share passport` button opens share sheet:
   - Copy link (default).
   - WhatsApp, X (Twitter), Facebook deep links.
   - Native share API where available.
   - Prefilled copy: `"Check out my Tunisia journey 🇹🇳 → {url}"`.

### Sticky activation pill (anonymous viewers only)

Bottom-fixed on mobile, top-banner on desktop:

> 🇹🇳 **Get your own Tunisia Passport** — track your journey, plan trips, earn badges. → [Sign up free]

Dismissible per-session via `sessionStorage.setItem('passport-pill-dismissed', '1')`.

## 6. Viral channel — OG image

Server-rendered postcard so every shared link looks like content, not a URL.

### Endpoint

`GET /users/:handle/og.png` (NestJS controller in `users.controller.ts`).

### Renderer

`satori` + `@resvg/resvg-js`:
- `satori` produces SVG from JSX-like layout primitives.
- `@resvg/resvg-js` rasterizes to PNG.
- Both pure JS, no native deps, work in Docker without headless Chromium.

### Visual design

1200×630 PNG (X / Facebook recommended).
- Background: dark navy → terracotta gradient (Tunisia palette).
- Top-left: round avatar + `@handle` + country flag.
- Center-left, large: `fullName`.
- Below name: `🇹🇳 Tunisia Passport · {passportLevel}`.
- Right side: 4 stat tiles, large numbers.
- Bottom strip: visited cities as a horizontal dotted-line route, ≤6 names shown.
- Bottom-right: `e-tunisia.com/u/{handle}`.

### Caching

- HTTP `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`.
- Bust by appending `?v={user.updatedAt.getTime()}` from passport page meta tags.

### Meta tags

`/#/u/:handle` (and its vanilla entry) injects:

```html
<meta property="og:title" content="{fullName}'s Tunisia Passport">
<meta property="og:description" content="🇹🇳 {citiesVisited} cities · {tripsPlanned} trips · {badgesCount} badges">
<meta property="og:image" content="{API_BASE}/users/{handle}/og.png?v={ts}">
<meta property="og:url" content="{WEB_BASE}/#/u/{handle}">
<meta property="og:type" content="profile">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{API_BASE}/users/{handle}/og.png?v={ts}">
```

Note: hash routing means crawlers may not see per-passport meta. Mitigation: add a static HTML pre-render fallback at the vanilla path `/u/:handle.html` served by NestJS that renders the meta tags + redirects to the hash route. Out of scope to fully prerender the body — meta alone is enough for the link preview.

## 7. Signup gate (LinkedIn activation move)

### Flow when anon visitor taps "Claim your passport"

1. Modal opens with email + password + handle field. Handle field has live availability check (debounced 350ms).
2. On submit → standard `/auth/register` with new `handle` field.
3. Post-signup interstitial (full-screen, single page):
   - Step 1: Country picker (default detected from IP if possible).
   - Step 2: Interest chips (Beach, Desert, Culture, Food, Adventure, Nightlife, Photography, History) — multi-select.
   - Step 3: "You earned the **New Explorer** badge" — confetti + badge animation.
   - Step 4: Lands on **own passport** at `/#/u/{handle}` with a share sheet auto-opened.
4. After this, `onboardingComplete = true` on the user record.

### Soft-passport for anonymous browsers

`web/src/passport-draft.ts` (new):
- Tracks `visitedCities` (any city-detail page they open), `savedDrafts` (any save attempt while anon), `interests` (inferred from category filters used) in `localStorage`.
- When signup completes, frontend POSTs this draft to `POST /users/me/seed` which seeds `visitedPlaceIds` and `interests` server-side.
- During anon browsing, sidebar shows "Your draft passport — claim it to keep it forever" with a count of pre-filled stats.

## 8. Badge auto-award hooks

Move badge-awarding from manual / unimplemented into event-driven.

`backend/src/badges/badges.service.ts` (new lightweight service):
- `awardIfEligible(userId, eventType, payload)` — checks rules for that eventType, awards if matched, increments `points`.

Wire into existing services:
- `posts.service.create` → check for first-post badge.
- `reviews.service.create` → first-review, 5-reviews, 10-reviews.
- `trips.service.create` → first-trip-plan, 3-trip-plans.
- `users.service.markPlaceVisited` (existing or new) → city-collector badges (3, 5, 10 cities).

Phase 1 badge set (8 starter badges, matching the 8-slot grid):
1. **New Explorer** — granted at signup.
2. **First Steps** — first place visited.
3. **Trip Planner** — first TripPlan created.
4. **Reviewer** — first review left.
5. **Saver** — first place saved.
6. **Medina Walker** — visited a city in the medina set (Tunis, Sousse, Kairouan).
7. **Desert Explorer** — visited Tozeur or Matmata.
8. **Beach Lover** — visited Hammamet, Djerba, or Sidi Bou Said.

Badge definitions live in `backend/src/badges/badge-definitions.ts`. Frontend mirror in `web/src/react/components/badge-definitions.ts` (just the display side: id → label, icon, color).

## 9. Components & files inventory

### Backend — new

- `backend/src/users/reserved-handles.ts`
- `backend/src/users/dto/passport.dto.ts`
- `backend/src/users/dto/seed-passport.dto.ts`
- `backend/src/badges/badges.module.ts`
- `backend/src/badges/badges.service.ts`
- `backend/src/badges/badge-definitions.ts`
- `backend/src/og/og.module.ts`
- `backend/src/og/og.service.ts` (satori + resvg)
- `backend/src/migrations/<ts>-add-user-handle.ts`

### Backend — modified

- `backend/src/users/user.entity.ts` (add handle)
- `backend/src/users/users.controller.ts` (add public endpoints + OG endpoint)
- `backend/src/users/users.service.ts` (passport assembly + cache)
- `backend/src/auth/auth.service.ts` (validate handle on register)
- `backend/src/auth/dto/register.dto.ts` (add handle)
- `backend/src/posts/posts.service.ts`, `reviews/reviews.service.ts`, `itineraries/trips.service.ts` (badge hooks — 1-line calls)

### Frontend — new

- `web/src/react/pages/PassportPage.tsx`
- `web/src/react/components/TunisiaMap.tsx`
- `web/src/react/components/tunisia-cities.ts`
- `web/src/react/components/BadgeGrid.tsx`
- `web/src/react/components/badge-definitions.ts`
- `web/src/react/components/SharePassport.tsx`
- `web/src/react/components/PassportPill.tsx` (anon sticky CTA)
- `web/src/react/components/SignupGate.tsx` (modal)
- `web/src/react/components/PassportOnboarding.tsx` (post-signup interstitial)
- `web/src/passport-draft.ts`
- `web/src/pages/u.ts` (vanilla entry — meta tags + redirect to hash route)

### Frontend — modified

- `web/src/main.ts` (route `#/u/:handle` → React mount)
- `web/src/react/pages/FeedPage.tsx` (link own avatar to own passport)
- `web/src/api.ts`, `web/src/shared/api.ts` (new methods: `getPassport`, `checkHandle`, `seedPassport`)
- `web/src/styles/pages.css` (passport page styles — scoped under `.passport-*`)
- `web/index.html` (default OG fallback for non-passport routes — unchanged for passport since vanilla entry handles it)

## 10. Data flow

```
Anon visitor                            Signed-in viewer
     │                                       │
     ▼                                       ▼
/#/u/:handle  ◄── shared link ────  /#/u/:handle
     │                                       │
     ▼                                       ▼
GET /users/by-handle/:handle      GET /users/by-handle/:handle
     │                                       │
     ▼                                       ▼
[Passport rendered]               [Passport rendered + edit/follow CTA]
     │
     │ user taps "Claim"
     ▼
SignupGate modal ──► POST /auth/register {handle, ...}
                                  │
                                  ▼
                          PassportOnboarding flow
                                  │
                          POST /users/me/seed (drafts)
                                  │
                          [Confetti + own passport + share sheet]
```

## 11. Error handling

- `GET /users/by-handle/:unknown` → 404 with body `{ error: 'passport_not_found' }`. Frontend shows friendly "This passport doesn't exist — but you can claim it" with the handle prefilled in signup.
- Handle collision at signup → 409, frontend keeps user on the handle field.
- Reserved-handle attempt → 400 `handle_reserved`.
- OG image render failure → fall back to static `og-default.png` (Tunisia hero image). Never block the page.
- Satori font loading failure → bundle one fallback font (`Inter-Regular.ttf`) inside `backend/src/og/fonts/`. No network fetches at render time.

## 12. Testing

Backend:
- `users.controller.spec.ts` — passport endpoint excludes sensitive fields, 404 on unknown handle, 200 on known.
- `users.service.spec.ts` — stats aggregation, level derivation, cache invalidation on update.
- `og.service.spec.ts` — renders a non-empty PNG buffer for a fixture user.
- `auth.service.spec.ts` — handle uniqueness, reserved-handle rejection, format validation.
- `badges.service.spec.ts` — eligibility rules per event type, points increment.

Frontend:
- `PassportPage.test.tsx` — renders for owner / anon / other signed-in user with correct CTAs.
- `TunisiaMap.test.tsx` — lights only visited cities; shows empty-state CTA when none.
- `SignupGate.test.tsx` — debounce, availability, error states.
- `passport-draft.test.ts` — local accumulation + seed POST on signup.

E2E (Playwright if present, otherwise manual checklist):
- Anon → visit shared passport → claim → onboarding → land on own passport → share copies the right URL.

## 13. Performance considerations

- Passport endpoint cached 5min in-memory. Stats query is at most 4 small COUNTs joined on indexed columns — fine.
- OG endpoint cached 24h at HTTP layer + `stale-while-revalidate` 7 days. Each user's OG re-renders at most a handful of times per day.
- TunisiaMap is a static SVG (≤8KB inline) + an array of 12 city coords. No runtime cost.
- Lazy-load tab content (Trips / Reviews / Saves) on tab click, not on initial paint.

## 14. Risks & open questions

- **Hash routing + OG previews:** crawlers don't run JS, so meta tags on a `#/u/:handle` URL are invisible to them. The static vanilla `/u/:handle.html` mitigates this but requires testing with X Card Validator + Facebook Sharing Debugger before declaring v1 done.
- **Handle squatting:** required at signup means people grab common names early. Acceptable for v1 — we can add a "verified locals get name priority" rule in Phase 3 if it becomes a problem.
- **Satori bundle size:** adds ~3MB to the backend image. Acceptable on Docker; flag if deployment target is serverless with tight bundle limits.
- **Privacy:** saves and visited cities are public by default in v1. Add a per-user "make passport private" toggle in Phase 1.5 if user feedback demands it; not blocking initial ship.

## 15. Success criteria

A user can:
1. Sign up with a unique handle and land on their own public passport.
2. Visit another user's passport via `/#/u/:handle` (anon or signed in).
3. Share their passport URL and the link preview renders the OG postcard on Twitter (X), Facebook, and WhatsApp.
4. Earn at least 2 starter badges by performing normal actions (e.g. save a place, plan a trip).
5. Anon visitors see a clear "claim your passport" path and complete onboarding in ≤ 60 seconds.

Phase 1 ships when these are all true.
