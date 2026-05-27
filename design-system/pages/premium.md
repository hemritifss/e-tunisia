# Premium page (`#/premium`)

> Page-level overrides to `design-system/MASTER.md` for subscription plans. Inherits everything not listed here.

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

The page renders from a `PLANS` array — 4 plans declaratively defined:

| ID | Name | Price | Tint | Featured |
|----|------|-------|------|----------|
| free | Free | 0 TND forever | `--text-secondary` | no (marked as `isCurrent`) |
| premium | Premium | 10 TND/mo | `--gold` | **yes** |
| annual | Premium Annual | 100 TND/yr | `--olive` | no |
| business | Business | 49 TND/mo | `--violet` | no |

Each plan card carries `--plan-tint` inline. The tint drives the plan name color, feature-check chip background, and CTA button color.

**Don't hard-code prices in the JSX.** Update the `PLANS` constant — the modal title and price label are derived from it.

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

## Payment modal

- **Scrim**: `oklch(0% 0 0 / 0.55)` with `backdrop-filter: blur(4px)`.
- **Card**: centered via `transform: translate(-50%, -50%)`, opens with spring + opacity transition.
- **Header**: title + close button.
- **Price** in display-font 28px, `--accent` color, tabular-nums.
- **Payment methods**: real `<fieldset>` + `<legend>` with 3 `<label>` rows. Each label holds a hidden `<input type="radio">` for accessibility + an icon chip + label + check icon. Active state tints background to `--accent-light` + border + icon chip flips to filled `--accent`.
- **Confirm button**: full-width `--gradient-cta` with `--shadow-glow` + `ShieldCheck` icon. Disabled state during async.

ESC closes the modal. Scrim click closes the modal. `aria-modal="true"` + `aria-labelledby`.

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

- Page: [web/src/pages/premium.ts](../../web/src/pages/premium.ts)
- Styles: [web/src/styles/premium.css](../../web/src/styles/premium.css)
