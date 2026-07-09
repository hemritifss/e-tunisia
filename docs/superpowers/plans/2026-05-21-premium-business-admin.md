# Premium · Business · Admin — Strategic Plan

**Date:** 2026-05-21
**Owner:** e-tunisia monetization
**Audience reading this:** future-you on a Monday morning. Decide phase, ship.

---

## 1. The strategic frame

The platform now has identity (Phase 1), graph (Phase 2), trust (Phase 3), discovery (mood + leaderboard + activity), and the polish pass is mostly done. The next surface to design is **monetization** — but designed in a way that doesn't break the social product, doesn't feel like a paywall, and gives real value at each tier.

Three customer segments, one Admin role:

| Tier | Who | Pays for | Why we win |
|---|---|---|---|
| **Free** | Casual travellers, anonymous browsers | — | Baseline product is genuinely usable. Conversion happens after they've built a network, not before. |
| **Pro Traveler** | Active travellers, content creators, would-be Local Guides | Status, unlimited caps, visibility | Identity + reach (gold badge, no caps, surfaced in suggestions). |
| **Verified Business** | Riads, restaurants, tour operators, hammams, agencies | Lead-generation, analytics, response tools | This is the *revenue engine*. Pro is brand; Business is dollars. |
| **Admin** (internal role) | e-tunisia staff | — | Moderates, verifies, schedules, manages. |

**Core monetization thesis:** Pro creates aspiration; Business creates revenue. Free is the funnel for both — Pro feeds Business with verified local guides, Business feeds Pro with featured content travellers actually want.

---

## 2. What each tier actually gets

### 🆓 Free (forever, no time limit)

- Full public passport at `/#/u/:handle`
- Up to **3** trip plans saved
- Up to **20** saved places + posts combined
- Standard reactions, comments, follows, endorsements (no limit on social actions — that's the engagement loop)
- 8 starter badges
- All discovery: mood pages, leaderboards, activity feed, search

### ✦ Pro Traveler ($4.99/mo or $39/yr — illustrative)

- **Everything in Free, plus:**
- **Gold ✦ Pro badge** on passport hero, in feed bylines, on leaderboards, in user-search results
- **Unlimited trip plans** (Free is capped at 3)
- **Unlimited saves** (Free is capped at 20)
- **3 custom passport themes** — Sahara (gold/terra), Mediterranean (cyan/navy), Medina (cream/blue) gradient choices for the hero
- **Passport analytics**: "Who viewed your passport this week", referring source (search vs activity feed vs direct), top 3 cities your visitors are from
- **Priority in suggestion feeds** — Pro users surface 2× more often in `/users/suggest/list` and the right-rail "People" tab
- **Pro-only content filter chips** on Explore: "Verified businesses only" + "Pro travelers' picks"
- **Trip-cart auto-save** to cloud (Free uses localStorage only)
- **Early access** to new features (a small "✦ Pro Beta" badge they can hide)

### ✓ Verified Business ($24.99/mo or $199/yr — illustrative)

- **Verified ✓ chip** on every place owned by this account
- **Owner dashboard** at `/#/owner`: charts for views, inquiry volume, response time, conversion rate, top-referring cities
- **Reply to reviews** as the business (existing host-reply feature gets owner-marked)
- **Boost listings** — paid placement in mood pages, search results, and the Tunisia Now right rail
- **Multi-language listing fields**: name + description in `fr`, `ar`, `en` (Free is single-language)
- **Direct inquiry queue** with auto-routing rules, response-time SLAs, status (new / replied / booked / lost)
- **Featured carousel slots** — 2 free slots per month, then $9 per additional slot
- **Bulk listing management**: CSV import/export, batch edit prices, batch close for low season
- **Custom branded passport** for the business account (logo, hero image, brand color)
- **Lead-export**: CSV of inquiries with traveller contact (after they opt-in)

### 🛡️ Admin (internal role only — not for sale)

- All routes under `/#/admin/*`
- **Creator-application review queue**: convert auto-approval to manual when we reach 1000 creators; everything we built with `applyLocalGuide` becomes a tool here
- **Flagged content queue**: posts/reviews/places marked by users
- **User management**: change role, suspend, ban, restore handle
- **Verification queue**: businesses request the ✓ chip, you approve
- **Featured scheduling**: who gets the homepage hero this week
- **Revenue + subscription dashboard**: MRR, churn, conversion funnel, by-tier breakdown
- **Platform-wide announcements**: bell-pushed broadcast to all users

---

## 3. How the difference VISUALLY SHOWS UP

This is the design challenge. A subscription platform that hides tier signals = nobody upgrades. A subscription platform that screams about its tiers = feels gross. Sweet spot:

### A. Status signals (everywhere, subtle)

| Surface | Free | Pro | Business |
|---|---|---|---|
| Passport hero | Bronze/Silver/Gold/Platinum level chip | Add **✦ Pro** chip with gold glow, right of level | Business name + **✓ Verified** cyan badge |
| Feed byline | `@handle · 2h` | `@handle · 2h · ✦` (small gold ✦ glyph) | n/a (businesses post via their place page, not feed) |
| Suggestion rows (right rail "People") | Plain row | Gold ✦ icon next to name | n/a |
| Leaderboard row | Plain | ✦ in the medal slot if top-3 AND pro | n/a |
| Place card | Plain | n/a | Cyan ✓ chip in the cover corner |
| Search results | Plain | ✦ next to name | ✓ next to name |
| Local Guide ✓ | Existing cyan check | Stacks with ✦ Pro (Pro+Guide = double chip) | n/a |

### B. Soft paywalls (inline, friendly)

Never pop-up. Always inline cards that match the surrounding card style. Copy is helpful, not pushy.

- **Trip plan limit hit**: at the bottom of the user's 3rd trip card on their passport: "_You've planned all 3 free trips. **Plan unlimited with Pro →**_"
- **Save limit hit**: on the save button: tooltip "20/20 — upgrade Pro for unlimited"
- **Locked feature visible**: on profile-edit, the "theme picker" section shows the 3 themes as cards but with a glass-blur overlay + "✦ Pro · Try" CTA
- **Passport analytics card** on owner's passport: shows a faded sparkline + "_See who's visiting your passport_ · ✦ Pro" — gives the value proposition by showing the shape of what they'd get
- **Boost CTA on a place a user owns**: "Boost this listing — appear in mood pages for 7 days · $9 · Verified Business required"

### C. Pro/Business-only filters and surfaces

- Explore page: new chip row at top — "All places" · "🇹🇳 **Verified ✓**" · "✦ **Pro travelers' picks**" · "🏅 Local guides"
- Leaderboard: new tab — "**Pro travelers**" alongside "Top Explorers" and "Top Reviewers by City"
- Tunisia Now panel: when viewer is Pro, a fourth tab "**For me**" shows curated suggestions
- Mood pages: when viewer is Business owner, an "Owner tip" card appears suggesting which mood matches their listing

### D. Status loops (the social part of upgrading)

- When a Pro user follows you, you see "**✦ Sara started following you**" — the badge in the notification makes it feel like a bigger event
- Pro-vs-Pro endorsements get a subtle ✦✦ in the endorsement chip
- Business places get a "**12 Verified Businesses near you**" widget on the Explore page
- When a non-Pro user wants to follow more than 100 people: "_You're following lots of travelers — keep up with everyone in your Pro Following feed_"

---

## 4. Implementation phases

### Phase A — Feature gating spine (foundation, 1 day)

Backend:
- New `backend/src/billing/billing.service.ts` with `userPlan(userId): Promise<UserPlan>` (checks `subscriptionExpiresAt`, downgrades expired Pro/Biz to Free)
- `featureCap(plan)` returns `{ maxTrips, maxSaves, customThemes, analyticsAccess, ... }`
- `assertFeature(userId, feature)` helper used by write endpoints — throws `ForbiddenException` with `code: 'pro_required'` so the frontend can show the right upgrade card
- TypeORM migration: add `subscriptions` rows for FREE users (lazy), index `subscriptionExpiresAt`
- Cron: nightly job downgrades expired plans, sends a "Your Pro expired — keep your perks for $4.99" notification

Frontend:
- New `useUserPlan()` hook — reads from `/users/me`, refreshes on subscription change
- `<ProGate feature="unlimited-trips">{children}</ProGate>` component — shows children OR the soft-paywall card
- `<TierBadge plan />` component — renders ✦ Pro / ✓ Business / nothing, used in 5+ surfaces

### Phase B — Pro Traveler tier (consumer monetization, 2-3 days)

Backend:
- `subscriptions.controller`: upgrade/downgrade/cancel flows already exist — wire to Stripe (test mode in dev)
- `/users/me/analytics` endpoint: who-viewed-passport, referring source, top visitor cities (use existing passport-view tracking if present, otherwise add a `passport_views` table)
- Enforce trip + save caps in their respective services
- Bump search/suggestion services to surface Pro users 2× weight

Frontend:
- TierBadge component wired into passport hero, feed bylines, leaderboard, search, suggested-users
- Passport theme picker on profile-edit (3 hero gradients to choose from, Pro-gated)
- Passport analytics card on owner's passport (Pro-gated)
- Soft-paywall cards at trip-3 and save-20
- Upgrade flow page at `/#/premium` (already exists — polish + Stripe Checkout wire)
- New `/#/premium/welcome` post-upgrade celebration page (achievement-toast variant)

### Phase C — Verified Business tier (revenue engine, 3-5 days)

Backend:
- `places/owner-dashboard` endpoint: aggregated views/inquiries/responses/conversion per place
- `place.verifiedAt` column + `place.verifiedBy` (admin id) — only Admin can set
- Multi-language listing: `place.nameI18n: { fr, ar, en }`, `descriptionI18n: {...}` — Business-only writable
- Boost endpoint already exists — extend to multi-place boost
- CSV import/export on `/places/owner/bulk`

Frontend:
- `/#/owner` dashboard: charts (recharts already in repo?), inquiry queue, place list with edit/boost buttons
- Verified ✓ chip on place cards everywhere (Tunisia Now Trending tab, mood pages, search, explore)
- Multi-language editor on place-edit (tabs: EN | FR | AR)
- Booking concierge widget on places — only shown when place owner is Business
- Brand customization on owner profile (logo upload, hero image, brand color → gradient mesh)

### Phase D — Admin tools (1-2 days)

Backend:
- All admin routes already gated by `AdminGuard` — just need real implementations
- `/admin/queue/creator-applications` — list pending applies (when we gate `applyLocalGuide`)
- `/admin/queue/flagged-content` — posts/reviews/places with reports
- `/admin/users` — search, suspend, role-change
- `/admin/verification` — businesses requesting ✓
- `/admin/analytics` — MRR, churn, conversion, by-tier user count

Frontend:
- `/#/admin` shell + child routes
- Queues use the same card style as the rest of the magazine
- Charts: simple SVG or recharts
- Bulk-action toolbar (approve all, reject selected, etc.)

### Phase E — Cross-cutting visible-tier rollout (1 day)

- Audit every place TierBadge should appear: passport, feed, leaderboard, search, suggestions, comments, reviews, place cards
- Add the Explore filter chips
- Add the leaderboard "Pro travelers" tab
- Add the Tunisia Now "For me" tab when viewer is Pro
- Add the "Pro started following you" notification variant

---

## 5. Pricing illustrative (not final)

- **Free**: $0 forever
- **Pro**: $4.99/mo · $39/yr (35% saving) · $99/lifetime (early-adopter slot, capped at 1000)
- **Business**: $24.99/mo per location · $199/yr · custom for chains
- **Featured slots**: $9/week per place (Business-only add-on)

For Tunisia specifically, prices should also be available in TND with regional psychology — e.g. **TND 14.90/mo for Pro**, **TND 74.90/mo for Business**.

---

## 6. What we DON'T do (yet)

- **No ads in the feed.** Repeatedly promised. Stays out.
- **No artificial scarcity.** Free stays usable forever — no "after 30 days, you lose your passport" tricks.
- **No demoting Free users**. Pro gets *boosted* (priority in suggestions); Free isn't *hidden*. The diff is signal-amplification, not signal-suppression.
- **No paywalled DMs.** Messaging works for everyone — it's the heart of the social product.
- **No deprecating existing features behind paywall**. Everything that's free today stays free.

---

## 7. Decision: what to ship first

Two real choices:

**Option A — Pro Traveler first** (Phases A + B + most of E)
*Pro:* fast revenue, validates the upgrade flow, easier to design (consumer UX I've been iterating on).
*Con:* lower ARPU, slower path to real revenue.

**Option B — Verified Business first** (Phases A + C + Admin verification piece)
*Pro:* 5× higher ARPU per customer, the actual revenue engine, has a clear sales pitch ("get more inquiries").
*Con:* more surfaces to build (owner dashboard is the biggest single page), needs a working Stripe + payments integration, depends on having real businesses to onboard.

**Recommendation: Option A first.** Ship Pro Traveler tier in a week. Use it to validate billing flow, soft-paywall design, badge system. Then Phase C builds on the same spine — Business tier is just bigger feature set + higher price.

---

## 8. What I need from you to start

1. **Pick A or B** (Pro first or Business first)
2. **Pricing real or illustrative for now?** If real, also pick the TND prices
3. **Stripe test keys** (if billing should actually work in dev) OR confirm we mock the payment step for now
4. **Brand-name decision**: I've been calling it "Pro Traveler" — alternative names: "e-Tunisia+", "Voyager", "Wanderer Plus". Pick one.
5. **Soft-paywall tone**: friendly+ helpful ("Plan unlimited with Pro →") vs. assertive ("Upgrade to continue")? My instinct is the first; confirm.

Once those five are answered I can start Phase A this turn.
