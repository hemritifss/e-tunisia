# e-Tunisia — Cold-Start Growth System

Context: first launch, ~zero users. Two coupled goals:
1. **Acquire** the maximum people cheaply.
2. **Convert them into contributors** who map Tunisia's hidden gems.

The two goals are ONE system — the flywheel:

```
 borrowed audiences ──► visitors ──► single-player tool value ──► accounts
        ▲                                                            │
        │                                                            ▼
 shareable artifacts ◄── status & identity ◄── contributions (gems, photos, tips)
```

Every feature below either spins this wheel or doesn't ship.

---

## 1. The core insight: lead with the TOOL, not the network

A social feed with 50 users feels dead. A trip planner with 0 other users feels **complete**.
We already have the tool nobody else in Tunisia has:
- AI itinerary in 5 minutes
- Real road routes + drive times + optimizer
- Full map of real places with real photos
- Offline-ready PWA (roadmap 2.3)

**Positioning:** "Plan your Tunisia trip in 5 minutes — free, no account."
The account comes later, when they want to SAVE the trip (natural gate, high intent).
The community comes later still, via the passport. Tool → account → contributor.

## 2. Manufactured status: the Founders' Passports

Status is the cheapest currency we can mint, and it only exists NOW.
- First 1,000 accounts get a **numbered Founder passport** — "Passport №0042" printed on the share card, permanent gold trim, forever.
- Founder wall page (public, crawlable) with every founder's card.
- Numbers create urgency ("№213 already gone") and every share card advertises the scarcity.
- Effort: S — the passport card generator already exists; add a founder sequence + variant styling.

## 3. The contribution ladder (how gems actually get collected)

Nobody writes a review as their first act. Design a ladder where each rung is one tap harder:

| Rung | Action | Friction | Reward |
|------|--------|----------|--------|
| 1 | **"Kont houni"** — I've been here (one tap on any place) | zero | +5 XP, stamps passport |
| 2 | Confirm a gem ("still exists? still worth it?") | one tap | +10 XP, "Verifier" progress |
| 3 | Add a photo to a place | camera roll | +25 XP |
| 4 | One-line tip ("go at sunset, park at the mosque") | 10 seconds | +40 XP |
| 5 | Full review | 1 minute | +60 XP |
| 6 | **Submit a new hidden gem** (photo + map pin + one line) | 2 minutes | +200 XP + "Gem Hunter" badge track |

Key mechanics:
- **Gem submission must be dead simple**: photo → auto-GPS pin → one sentence. AI enriches it (category, polished description, dedup check against existing places by geo+name similarity). Moderation queue approves; contributor gets credited **by name on the place page forever** ("Discovered by @amine").
- **Two-confirmation rule**: community gems go live after 2 other users confirm — quality control that is itself an engagement loop (rung 2).
- The 120 seeded gems become verification bait: "Been to Chenini? Confirm it" — cheap first contributions that train the habit.

## 4. City pride: the completeness game

Tunisians' regional identity is a growth engine. Weaponize it (kindly):
- **Per-city progress bars**: "Kairouan is 34% mapped — 12 gems missing." Visible on the city filter, explore page, everywhere.
- **City leaderboards**: top contributors per governorate → the top one holds the title "**Ambassador of Le Kef**" (displayed on their passport, contested monthly).
- **Adopt your hometown** campaign for diaspora & students: your city looks empty next to Sousse? Fix it.
- Inter-city rivalry posts write themselves ("Sfax overtook Sousse this week 👀") — organic Facebook-group content.

## 5. Borrowed audiences (where the people already are)

Don't build an audience from zero — borrow existing ones:

1. **Facebook groups are the Tunisian internet.** Hiking/camping groups (100k+ members), "bons plans" groups, city groups. Don't spam them — give their ADMINS something: a free club page with event listings (events feature exists), their own collection, an "official group" badge. The group gets tools; we get their members.
2. **Student clubs** (photography clubs, Enactus, scouts): run an inter-university **mapping challenge** — club with most verified gems wins a sponsored trip. Clubs = organized armies of contributors with cameras.
3. **Micro-creators (5k–50k followers)**: 20–30 "Creator Ambassadors" — verified badge, feature placement, early access, their profile linked from every gem they publish. Cheap now, impossible later.
4. **Guesthouses & local guides** (supply side): free owner profile + they submit the gems around them (they know the real spots, and future bookings are their incentive).
5. **Diaspora — and the timing is NOW (July, return season)**: 1.5M Tunisians abroad, in France/Germany/Italy FB groups, planning the summer return. Campaign: "Coming home? Plan the summer trip / show your friends the real Tunisia." Diaspora shares hard and bridges foreign tourists.

## 6. Viral mechanics inside the product

1. **Collaborative trips** (the Figma trick): "Invite your travel buddies to edit this trip" — a trip is naturally a GROUP object; co-editing is the most honest referral loop possible. Every trip pulls 2–4 more users. **Highest-leverage build on this list.** (M)
2. **Share artifacts** (mostly built): passport cards, trip OG pages — plus a seasonal **"Your Summer in Tunisia" Wrapped** (September: stats + map + photos auto-composed). Wrapped is the most proven share-format on earth. (M)
3. **Animated route video export**: the trip's route draws itself across the map with photos popping at stops — 10-second MP4 for TikTok/Reels/Status. Nobody in the market has this; it advertises the product BY EXISTING. (L, but unique)
4. **Referral with meaning**: not generic credits — "Invite 3 friends → Founder's Circle badge + name engraved on their passports as sponsor." (S — `ref` param already works)

## 7. Micro-tools as acquisition magnets (standalone, shareable, zero-login)

Each is one page that ranks/shares on its own and funnels into the app:
- 🪼 **Jellyfish report** ("famma 9nadel?") — community-updated beach conditions per beach. In Tunisian summer this is a DAILY question asked by literally everyone. Could be the single biggest traffic hook we can build. (M)
- 🚐 **Louage fare & route lookup** — "Tunis → Douz: how, how long, how much." Massive search demand, zero good answers online. (M)
- ☀️ Best-sunset-spots near me / today's sunset time. (S)
- 🎭 Festival & events calendar (events exist — make the public calendar page crawlable). (S)
- 🧭 "Which Tunisian city are you?" personality quiz → shares result card → MoodCompass onboarding. (S)

## 8. The launch moment: The Great Tunisia Mapping Weekend

Don't soft-launch into silence. Manufacture an event:
- 48 hours, live national leaderboard, every club/city competing to map their region.
- Prizes per governorate + overall (partner guesthouse nights).
- Press angle writes itself: "Tunisians are mapping their country's hidden treasures."
- Everything above (ladder, city bars, ambassadors, founder passports) converges on this weekend.

## 9. Retention rhythm (keep what we catch)

- **Thursday push/email: "Win el weekend?"** — 3 picks near your city + weather. One habit anchor, not ten.
- Streaks + daily tasks exist — tie them to contribution rungs, not just check-ins.
- Weekly digest (roadmap 1.3) closes the loop.

## 10. Measure the flywheel (dashboards to build on analytics_events)

- **Contribution rate**: % of WAU that did any ladder rung (north-star for the gem engine)
- **K-factor**: invites sent × conversion (collaborative trips + referrals)
- Time-to-first-contribution for new signups (target < 24h)
- Gems per governorate (the completeness map IS the KPI visualization)
- D7 retention by acquisition source (FB group vs creator vs SEO vs diaspora)

---

## Build order (growth-specific, ~6 weeks)

| Week | Ship |
|------|------|
| 1 | Founder passports (numbered) · "Kont houni" one-tap · referral badge |
| 2 | Gem submission flow (photo+pin+line, AI enrich, moderation queue) · confirm-a-gem |
| 3 | City completeness bars + city leaderboards + Ambassador titles |
| 4 | **Collaborative trip editing** (invite co-planners) |
| 5 | Jellyfish report + louage lookup (magnet pages) · public events calendar SEO |
| 6 | Mapping Weekend event mode (live leaderboard) → **LAUNCH MOMENT** |

Parallel (non-code): recruit 25 creator ambassadors + 10 club partnerships + diaspora group posts — starting week 1, because relationships take longer than features.
