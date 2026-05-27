# Profile page (`#/profile`)

> Page-level overrides to `design-system/MASTER.md` for the logged-in user's own profile (`web/src/pages/profile.ts`). Inherits everything not listed here.
>
> **Scope:** own profile only. The other-user passport page (`web/src/pages/user-profile.ts`, routed via `#/u/<handle>`) has a separate doc.

## Style direction

Profile uses **MASTER §2b Cinematic** for the **cover banner** (dark mesh + 2 floating orbs) and drops to **§2a Nature Distilled** for everything below (quiet cards, tabular numbers, tinted icon chips). Same hybrid pattern as Explore + Mood.

The page is **opt-in to Sleek tokens** via `data-design="sleek"` on the root — but the refinements in `profile.css` work against the standard token system. Sleek is harmless here; the override CSS wins.

## Section order

1. **Cover banner** with frosted-glass level badge (top-right corner).
2. **Identity** — avatar (overlapping cover) + actions row (Edit profile, Settings).
3. **Bio** — name, handle, bio text, meta (country, website, joined).
4. **XP progress** — labeled bar with animated shine.
5. **Stats grid** — 4 tiles (XP, Ranking, Level, Tier).
6. **Pro flair card** — visible only when `user.plan ∈ {premium, business, admin}`.
7. **Quick links grid** — 7–8 tinted action cards.
8. **Public passport CTA** — only if `user.handle` is set.
9. **Logout / Sign in**.

## Tier system (the key fix)

The old profile used emoji as **tier markers** (🏆⭐🧭🌱) — direct MASTER §4 `no-emoji-icons` violation. The new `tierFor(level)` helper returns `{ iconName, label }` with Lucide names:

| Level | Tier | Lucide |
|-------|------|--------|
| 10+   | Legend     | `crown` |
| 7–9   | Veteran    | `star` |
| 4–6   | Explorer   | `compass` |
| 1–3   | Newcomer   | `sprout` |

The icon renders in three places: the cover-banner level badge (`.pp-cover-level-badge`), the 4th stats tile (`.pp-stat-icon-tier`), and via inheritance anywhere that reads the tier. **Never** add a 5th tier without updating the helper + this table.

The tier-stat tile shows the **label** as `<strong>` (not the level number) — the level number already has its own tile (3rd). Showing them both as numerals would feel redundant.

## Pro flair (the second key feature)

When `user.plan` is `premium`, `business`, or `admin`, the page renders:

1. **Avatar wrap** gains `.is-pro` → `--gradient-gold` padding-box ring.
2. **Sparkles mark** in the bottom-right of the avatar (28px gold-gradient circle, white border).
3. **Cover banner** swaps its gradient to `gold → terracotta → amber` and the orbs flip to amber + terracotta.
4. **Pro flair card** appears between Stats and Quick Links. Two variants:
   - `Pro Traveler`: gold gradient border + gold gradient icon.
   - `Verified Business`: mediterranean → violet gradient border + matching icon. (Sets `.is-business` modifier.)
5. **"Go Premium" quick-link is hidden** when the user is already Pro. Replacing it with a duplicate "Manage" CTA inside the flair card would be redundant — the flair card itself has the CTA.

The user's `id`, `name`, `avatar`, `handle`, and `plan` are also written to `data-user-*` attrs on the avatar wrap so the global `UserActionMenu` works on right-click / long-press (you can't message yourself, but the menu still gracefully hides Message/Follow when `me === user.id`).

## Cover banner (`.pp-cover`)

- Height: `clamp(180px, 28vw, 240px)`.
- Bleeds **edge-to-edge** by negating `--page-padding` via `margin: 0 calc(var(--page-padding) * -1)`.
- Bottom radius only (`var(--radius-2xl)`).
- Background: `--gradient-hero` + `--gradient-dark-mesh` overlay.
- **Two orbs** (terracotta + gold, 14s loop, `-7s` delay on second). Reduced-motion safe.
- **Level badge** is frosted glass (18% white bg, 28% border, 12px blur).

## Identity (`.pp-identity`)

- Avatar overlaps the cover by **`margin-top: -56px`**, putting half the avatar above the cover edge.
- Avatar is 112×112 inside a 4px padding wrap. The wrap acts as the ring container — `--surface-elevated` normally, `--gradient-gold` when Pro.
- Actions row sits to the right at the same baseline as the avatar's bottom edge.

## Stats grid (`.pp-stats`)

- 4 columns desktop, 2 columns at `<540px`.
- Each tile: rounded card, 40px tinted icon chip on top, tabular-num value, uppercase micro-label.
- Icon tints: `--gold` (XP), `--accent` (Rank), `--coral` (Level), `--mediterranean` (Tier). Backgrounds via `color-mix(in oklch, <tint> 16%, transparent)` with `@supports not` fallback to `--bg-tertiary`.
- Hover lifts `-2px` with `--shadow-md`. Spring easing.

## Quick links grid (`.pp-quick-links`)

The old version used inline `style="--ql-hue: 350"` HSL values — **replaced** with `data-tint="rose|gold|olive|mediterranean|cyan|violet|neutral"` attributes that resolve `--ql-tint` to a token reference.

| Tile | Tint |
|------|------|
| Saved Places | `var(--rose)` |
| Badges | `var(--gold)` |
| Credits | `var(--olive)` |
| Leaderboard | `var(--mediterranean)` |
| Go Premium *(non-Pro only)* | `var(--gold)` + gradient border |
| Trip Plans | `var(--cyan)` |
| Collections | `var(--violet)` |
| Settings | `var(--text-tertiary)` (neutral) |

Hover: border tints to `--ql-tint`, card lifts `-2px`, arrow shifts `+3px` and tints. The icon chip uses `color-mix(in oklch, <tint> 16%, transparent)`.

This palette **intentionally aligns** with the Explore category palette and the Mood palette — a user who navigated through "Beaches" (cyan) then opens their profile and sees the Trip Plans card also in cyan. Continuity.

## XP progress (`.pp-xp-progress`)

- Card chrome, `var(--gradient-cta)` fill with `--shadow-glow`-style glow.
- **Shimmer sweep** across the fill (2.4s `--ease-in-out`). Disabled under reduced-motion (`display: none` on the `::after`).
- Tabular-num values prevent layout shift as XP updates.

## Loading + error states

- **Loading**: centered spinner (3px border, accent top-color, 0.9s spin → 2s under reduced-motion).
- **Error**: `lucide-user-x` icon + headline + body + home button. Same visual rhythm as the feed-empty + explore-empty states.

## Accessibility

- Level badge has decorative icon (`aria-hidden="true"`); the text content carries the meaning.
- Pro mark on avatar has `aria-label="Pro Traveler"` (or `"Verified Business"` per plan).
- The avatar wrap has `data-user-*` attrs so the global `UserActionMenu` activates on right-click / long-press, but on self it gracefully hides Message + Follow (handled in `UserActionMenu.tsx`).
- Stats grid tile labels are uppercase styled, but rendered in their natural sentence case in markup. **Don't** uppercase the `<span>` text in HTML — let CSS handle the visual transform so SR users hear "XP Points" not "X P P O I N T S".
- XP progress is decorative; the value + percent + "XP needed" text below provides the actual accessible content.

## Anti-patterns specific to this page

- Don't reintroduce emoji as tier markers. The `tierFor()` helper is the **only** source of tier truth — extend it if you need new tiers.
- Don't show the "Go Premium" quick-link to Pro users. The Pro flair card already gives them a way to manage their plan.
- Don't use inline `style="--ql-hue: X"` for new tiles. Use `data-tint="<token-name>"` and add a CSS rule mapping it to a brand token.
- Don't put more than 8 quick-link tiles (4 rows of 2) — beyond that, this is a menu, not a quick-action surface. Use the avatar dropdown for the long tail.
- Don't extend the cover banner height past `240px`. The avatar's `-56px` overlap is calibrated to that range.
- Don't pulse the XP shimmer faster than 2.4s — that reads as "loading" rather than "this is a stat".
- Don't put the Pro flair card above the Stats. The user wants to see their numbers first; the Pro flair is a benefit, not a status announcement.

## Files

- Page: [web/src/pages/profile.ts](../../web/src/pages/profile.ts)
- Styles: [web/src/styles/profile.css](../../web/src/styles/profile.css) (loaded after `pages.css`)
- Foundation: `web/src/styles/pages.css` (existing `.pp-*` rules at line 2857+)
- Tier helper: `tierFor(level)` in `profile.ts`

## Related

- Other-user profile (`#/u/<handle>`) — separate doc when the user-profile redesign lands.
- The global `UserActionMenu` (right-click / long-press) reads `data-user-*` from the avatar wrap; see [design-system/pages/messenger.md](messenger.md) for that contract.
