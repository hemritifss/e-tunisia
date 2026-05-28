# Premium page (`#/premium`, `#/pro`, `#/upgrade`)

> Page-level overrides to `design-system/MASTER.md` for subscription plans. Inherits everything not listed here.

## Live surface & source of truth (read this first)

The live page is the **React island `web/src/react/pages/ProUpgradePage.tsx`** (the vanilla
`web/src/pages/premium.ts` is dead code — the router early-returns the React route for `/premium*`).

**Prices are NOT defined on the page.** The single source of truth is the backend
`backend/src/billing/plan-catalog.ts`, served via `GET /billing/plans`. The page fetches it
(with a baked-in fallback that mirrors the catalog) and renders cards from it. Change a price
once in `plan-catalog.ts` and it propagates to the page, checkout, and subscription records.

## Style direction

The **most cinematic hero in the app** — a gold/terracotta/amber gradient (not the standard dark mesh). Reason: Premium is the conversion surface. The visual treatment is overtly aspirational. Below the hero, Nature-Distilled plan cards with one featured emphasis card.

## Emoji removal (the key fix)

Per MASTER §4 `no-emoji-icons`, this page previously used emoji as structural icons:

| Old emoji | New Lucide |
|-----------|-----------|
| 👑 hero icon | `Crown` |
| 💡 "How we earn" heading | `Lightbulb` |
| 💳 Subscriptions | `CreditCard` |
| 📍 Sponsored listings | `MapPin` |
| 🎫 Event tickets | `Ticket` |
| 💸 Creator tips | `HandCoins` |
| ✓ "Verified badge ✓" text | (removed, label rephrased to "Verified business badge") |
| 🎉 Post-upgrade alert | (removed, switched to toast) |

## Plan catalog

**3 tiles + a monthly/yearly toggle** (the old separate "Annual" tile is folded into the toggle).
Rendered from `GET /billing/plans` (source: `plan-catalog.ts`):

| ID | Name | Monthly | Yearly | Tint | Featured |
|----|------|---------|--------|------|----------|
| free | Free | 0 TND | — | `--text-secondary` | no (renders as `is-current`) |
| premium | Pro Traveler | 14.90 TND | 149 TND | `--gold` | **yes** |
| business | Verified Business | 74.90 TND | 749 TND | `--violet` | no |

Each card carries `--plan-accent` inline (from the catalog `tint`). The accent drives the plan
name color, feature-check icon color, and CTA button gradient.

**Don't hard-code prices anywhere.** Edit `backend/src/billing/plan-catalog.ts` only.

## Featured card

The Premium card gets the **gold gradient border** treatment (same primitive as Pro post variant, profile Pro flair, leaderboard top-1 row, badge earned state):
- Padding-box `--surface-elevated` + `--gradient-gold` border-box.
- Gold-tinted shadow: `0 8px 32px oklch(78% 0.17 80 / 0.18)`.
- A floating "Best value" sash badge with `Sparkles` icon sits at the top, centered, offset above the card.
- The CTA inside uses `--gradient-gold` background with `--shadow-glow-gold` — the only filled-gold CTA on this page.

## Feature check chips

18px circles next to each feature line, tinted with the plan's `--plan-tint` at 18% alpha. Inside: 10px `Check` icon at stroke-width 3 (visible at the tiny size).

## Revenue section ("How we earn")

A self-contained card grid with 4 revenue items:
- Each item has a 40px tinted icon chip + title + description.
- Each carries `--rev-tint` for the icon background (gold/mediterranean/coral/olive).
- Hover lifts `-2px` and tints the border to the item's revenue tint.

The eyebrow is "TRANSPARENT" in `--accent-light` chip — signals the page is explicit about monetization.

## Checkout flow (no modal)

The React page uses **inline segmented controls in the hero**, not a modal:
- **Cycle toggle** — Monthly / Yearly (reuses `.pro-page-cycle`).
- **Payment method** — Card / Bank transfer / Cash (a second `.pro-page-cycle` row, `role="radiogroup"`).

CTA behavior depends on the selected method:
- **Card → Stripe Checkout.** `POST /billing/checkout` returns `{ url, mock }`. If `mock` (no Stripe
  keys), the backend already flipped the plan and the page navigates to `#/premium/welcome`. Otherwise
  it redirects to Stripe's hosted checkout (`window.location.href = url`).
- **Bank transfer / Cash → manual pending.** `POST /billing/upgrade` writes a `PENDING` subscription;
  the plan does **not** activate until an admin confirms. The CTA shows a "we'll confirm payment" toast.

A current paid plan shows **Manage billing** (`POST /billing/portal` → Stripe portal) + **Cancel**.

### Post-checkout welcome (`#/premium/welcome`)

A celebration view inside the same island: gold hero, "Welcome to {plan}", refetches `/billing/me`,
fires an `achievement` toast, and offers "Back to feed" + "Manage billing".

## Hero

Gold/terracotta/amber gradient (not the standard `--gradient-hero` dark mesh). Two orbs (gold + amber-white) for atmospheric glow. The word "Premium" gets a `gold → near-white → gold` cycling gradient — different from every other page's headline gradient because the page itself is gold-themed.

## Toast over alert

The previous version used `alert(...)` for upgrade success/failure. The new version routes through the global `showToast` if available, falling back to `alert` if not. **Don't reintroduce alerts** — they're modal and break flow.

## Accessibility

- Hero icon is `aria-hidden="true"`.
- Each plan card is `<article>`.
- Modal is `role="dialog" aria-modal="true" aria-labelledby="premium-payment-title"`.
- Payment methods use real radio inputs (hidden visually, present for SR + keyboard).
- Confirm button has `ShieldCheck` icon as decoration; the label "Confirm payment" carries the SR cue.

## Anti-patterns

- Don't reintroduce emoji anywhere on this page. Premium is the page where polish counts most.
- Don't change the plan-tint mapping — gold = Premium is the cross-app convention.
- Don't add a 5th plan tile without revisiting the grid breakpoint (it's currently sized for 4 columns desktop).
- Don't make the Free plan look identical to paid plans. The `isCurrent: true` flag dims the card and locks the CTA — that's the deliberate visual hierarchy.
- Don't link Free's CTA anywhere. It's the user's current plan; clicking should do nothing.

## Files

- Live page: [web/src/react/pages/ProUpgradePage.tsx](../../web/src/react/pages/ProUpgradePage.tsx)
- Price book (source of truth): [backend/src/billing/plan-catalog.ts](../../backend/src/billing/plan-catalog.ts)
- Billing API: [backend/src/billing/billing.controller.ts](../../backend/src/billing/billing.controller.ts) · [billing.service.ts](../../backend/src/billing/billing.service.ts)
- Styles: `.pro-page*` / `.pro-plan*` in [web/src/styles/pages.css](../../web/src/styles/pages.css)
- Stripe price setup: [backend/scripts/stripe-setup.ts](../../backend/scripts/stripe-setup.ts)
- Legacy/dead: `web/src/pages/premium.ts` (vanilla, not routed)
