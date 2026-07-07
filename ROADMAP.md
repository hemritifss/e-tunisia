# e-Tunisia — Path to a Perfect Platform

Prioritized roadmap. Effort: **S** ≤ 1 day · **M** ≤ 1 week · **L** 2–4 weeks · **XL** > month.
Tiers are ordered: finish a tier before starting the next — each one compounds the ones after it.

---

## Tier 0 — Kill the remaining fakery (trust) 🔴

The audit rule: anything a user could discover is fake destroys everything else.

| # | Item | Where | Effort |
|---|------|-------|--------|
| 0.1 | **Fake review engagement numbers** — feed review cards compute upvotes/comments from `charCodeAt()` (`reviews.service.ts:151-153`). Replace with real reaction/comment counts (or hide the counters on review cards). | backend/src/reviews | S |
| 0.2 | **Unsplash fallback images** — `getImageUrl()` falls back to random Unsplash scenery for missing images (`web/src/api.ts`). Replace with branded local placeholder images (one per context: place/post/event/itinerary). | web | S |
| 0.3 | **Demo ads use stock photos** (`ads.service.ts`) — replace with real partner creatives or clearly-labeled house ads. | backend | S |
| 0.4 | **Duplicate places** in DB (Dougga, Great Mosque of Kairouan, Matmata, Ichkeul exist twice from different seed runs). Dedup script: merge reviews/saves onto the richer row, delete the other. | backend/seeds + SQL | S |
| 0.5 | **Trip share links have no OG route** — `/og/u`, `/og/place`, `/og/post` exist but TripPage still shares raw SPA URLs. Add `GET /og/trip/:slug` (title, stops count, days, cover) + use in saveAndShare/copyLink. | backend/src/og + TripPage | S |
| 0.6 | **Mock events/tips fallbacks** — when API returns empty, pages show hardcoded demo content (partially fixed for city filter). Remove mock fallbacks entirely once real content exists. | web pages | S |

## Tier 1 — The growth engine (retention & virality) 🚀

| # | Item | Notes | Effort |
|---|------|-------|--------|
| 1.1 | **Ranked feed** — `posts.service` is chronological. Score = reactions×3 + comments×5 + saves×7 + author-affinity×10, × time-decay `1/(hours+2)^1.5`, + 15% discovery injections (gems, trending tags). Keep "Recent" toggle. Single biggest engagement lever. | M |
| 1.2 | **Finish notifications** — web push plumbing exists (`push-notifications.ts`, VAPID?) but only DM/tips fire. Add: streak-about-to-expire, weekly digest, new-follower. Strict budget: max 2 push/day. | M |
| 1.3 | **Email digest** — "Your Tunisia week": reactions received, new followers, streak status, 1 hidden gem. Nest cron + template (email module exists). The only re-engagement channel that works without an open tab. | M |
| 1.4 | **Inline gamification feed cards** — when someone earns a badge/level, render a celebratory card IN the feed others can react to. Converts private dopamine into social proof. Popups stay for the earner. | M |
| 1.5 | **Friend-finding after onboarding** — "7 friends in 10 days": SuggestedUsers step at end of onboarding wizard + follow prompts after each meaningful action. | S |
| 1.6 | **Popup budget** — enforce max 1 interrupt per session in popup-store; overflow goes to the activity feed as unread. | S |
| 1.7 | **Referral program v2** — `ref` param exists at register. Add: referral dashboard (invites, converts, credits earned), reward both sides, share via the OG passport card. | M |
| 1.8 | **Analytics dashboard UI** — events flow into `analytics_events` but nobody can see them. Admin page: DAU/WAU, D1/D7/D30 cohort table, funnel signup→first-post, per-event daily chart (endpoint `events/summary` already exists). | M |

## Tier 2 — The perfect tourist companion 🧳

| # | Item | Notes | Effort |
|---|------|-------|--------|
| 2.1 | **Trip dates & scheduling** — trips have day numbers but no calendar dates or times. Add startDate → each day gets a real date; per-stop time slots; "Today" auto-highlights during the trip. This turns the plan into a live companion. | M |
| 2.2 | **Opening hours & practical info per place** — hours, entry price, ticket links, avg visit duration. Schema + admin editing + surfacing on place page/trip stops ("closes at 17:00 — go before 15:30"). | L |
| 2.3 | **Offline trip mode** — tourists roam without data. PWA already precaches the shell; add: cache the active trip JSON + its place pages + map tiles along the route (tile prefetch on wifi). Killer differentiator. | L |
| 2.4 | **Transport modes** — OSRM profile is driving-only. Add louage/train/bus estimates between cities (static matrix is fine to start), walking profile for medina routes. "How do I get there" is THE tourist question. | M |
| 2.5 | **AI concierge chat** — the planner exists; add a conversational "ask anything about Tunisia" concierge grounded on the places DB (LlmService + tool-use; roadmap memory says Claude planned). Gate heavy usage behind Pro. | L |
| 2.6 | **Real booking payments** — inquiries work but money doesn't move. Stripe checkout for bookable packages + commission %, payout ledger for owners (Stripe Connect or manual payouts first). Revenue engine. | XL |
| 2.7 | **Weather on trip days** — free API (open-meteo), badge per trip day + "pack for rain" hints. Small effort, big "it thinks of everything" feel. | S |
| 2.8 | **Safety & essentials page** — emergency numbers, pharmacies, embassies, taxi fare norms, connectivity/eSIM guide, Ramadan/holiday calendar awareness. Static content, huge tourist trust. | S |
| 2.9 | **Marker clustering on the map** — now that all ~800 real places render, add `leaflet.markercluster` so dense areas (Tunis, Djerba) stay readable. | S |
| 2.10 | **Currency & prices** — TND everywhere; add EUR/USD/GBP toggle with daily rate for tourists. | S |

## Tier 3 — Platform quality (the invisible 20% that feels like 80%) 🛠

| # | Item | Notes | Effort |
|---|------|-------|--------|
| 3.1 | **Tests** — effectively zero coverage. Priority order: backend unit tests for billing/credits/routing/og (money + external APIs first), then Playwright e2e for the 5 golden flows (signup, post, save, trip build, share). | L |
| 3.2 | **CI/CD** — GitHub Actions: typecheck + build + tests on PR; deploy on main. Stop shipping from a laptop. Also: remove committed `backend/dist` from git (build artifact). | M |
| 3.3 | **Error monitoring** — Sentry (or GlitchTip self-hosted) for web + Nest. You currently learn about crashes from users. | S |
| 3.4 | **Image pipeline** — uploads go to MinIO raw. Add sharp resize on upload (thumb/medium/large + WebP), serve responsive `srcset`. Biggest real-world perf win after CSS. | M |
| 3.5 | **pages.css teardown** — 463KB monolith with documented specificity wars. Migrate to `@layer` + split per-page chunks into their lazy routes (pattern already established for 17 files). | L |
| 3.6 | **RTL pass** — Arabic flips direction but physical CSS (`margin-left`) breaks layouts. Codemod to logical properties (`margin-inline-start`) + audit top 10 pages in `dir=rtl`. Unlocks the Arabic market properly. | L |
| 3.7 | **i18n coverage** — infrastructure done; migrate remaining hardcoded strings (pages, popups, empty states) to `t()`. Mechanical, incremental. | L (incremental) |
| 3.8 | **Accessibility audit** — focus traps in modals, aria-live on toasts (partially done), keyboard nav on map/carousels, contrast check in dark mode. Run axe on golden flows in CI. | M |
| 3.9 | **Security hardening** — JWT lives in localStorage (XSS-exfiltrable): move to httpOnly cookie or add refresh-token rotation; add email verification on signup; 2FA for admin/owner accounts; audit rate limits on auth + AI + routing endpoints; dependency audit in CI. | L |
| 3.10 | **SEO** — SPA is invisible to Google. Prerender public pages (places, trips, passports) via the existing OG infrastructure → full static HTML for bots; sitemap.xml from DB; canonical URLs. Organic traffic = free acquisition. | M |
| 3.11 | **Performance budget** — PWA precache is 10.9MB (too fat for Tunisian mobile). Trim precache list, lazy-load Leaflet CSS, self-host fonts (drops Google Fonts render-block), set bundle-size CI check. | M |

## Tier 4 — Scale & business 🏢

| # | Item | Notes | Effort |
|---|------|-------|--------|
| 4.1 | **Production infra** — real deployment story: web hosting (Vercel config or nginx container), managed Postgres backups + restore drill, Redis persistence, self-hosted OSRM container (public demo server won't survive launch traffic), CDN for media. | L |
| 4.2 | **Owner dashboard v2** — owners see inquiries; give them analytics (views, saves, conversion), review-reply prompts, package management polish, and a "boost" (paid placement) button → self-serve sponsor revenue. | L |
| 4.3 | **Moderation queue** — reports exist (`safety/report.entity`); build the admin queue UI + AI pre-triage (ModerationService exists) + strike system. Required before scale. | M |
| 4.4 | **Nav consolidation** — 9 top-level links is 2005. Consolidate to 5 destinations (Home, Explore, Plan, Passport, You) with tabs inside; old routes stay as deep links. | M |
| 4.5 | **Mobile app decision** — `frontend/` (Flutter) is dead weight. Decide: delete it and ship the PWA hard (install prompts, iOS meta), or wrap web in Capacitor for store presence. Don't maintain a corpse. | M |
| 4.6 | **Legal & compliance** — Privacy/Terms pages exist; add cookie/analytics consent, data export + account deletion (real deletion, not localStorage.clear()), GDPR-ready processing register (EU tourists = EU data subjects). | M |
| 4.7 | **Status page + uptime monitoring** — even a simple healthcheck pinger + public status page. | S |

---

## Suggested execution order (90-day view)

1. **Week 1–2:** all of Tier 0 (six S-size fixes) + 1.5, 1.6, 2.7, 2.8, 2.9, 2.10 — the quick wins.
2. **Week 3–6:** ranked feed (1.1) + notifications/digest (1.2, 1.3) + analytics dashboard (1.8) — the retention loop, measured.
3. **Week 7–10:** trip dates (2.1) + transport modes (2.4) + offline mode (2.3) — the tourist companion story.
4. **Continuously from week 1:** tests + CI (3.1, 3.2) and Sentry (3.3) — every new feature lands with a test.
5. **Quarter 2:** booking payments (2.6), SEO (3.10), RTL (3.6), owner dashboard (4.2), production infra (4.1).

**One rule:** every item ships with its analytics event, and every feature that adds an interrupt takes one away.
