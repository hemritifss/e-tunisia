# Onboarding wizard (`#/onboarding`)

> Page-level overrides to `design-system/MASTER.md` for the first-run flow. Day-1 retention loop: Welcome → Profile → Interests → Connect → Done.

## Style direction

Single-card wizard centered in a quiet `--bg-primary` page. **No cinematic mesh hero** — onboarding is a guided form, not a brand statement. The card itself gets a soft entry spring; each step within the card cross-fades. Decorative orbs only appear behind the welcome + done illustration icons (small, contained).

## Step model

| Step | Name | Visible |
|------|------|---------|
| 0 | Welcome | Intro card + perks + Let's go / Skip |
| 1 | Profile | Avatar + name + country + bio |
| 2 | Interests | 10-tile grid, pick ≥3 |
| 3 | Connect | 8 suggested users, follow ≥3 |
| 4 | Done | Confetti illustration + Open my feed CTA |

The progress bar shows steps 0–3 (Welcome / Profile / Interests / Connect). Step 4 (Done) is the completion screen, not a labeled step.

## Progress indicator

Numbered dots connected by lines. CSS counters render the step number (`counter(onb-step)`) inside each dot. State-driven transitions:
- **Default** dot: `--border` 2px outline, `--text-tertiary` number.
- **Active** dot: `--accent` filled + `scale(1.1)` + 4px `--accent-light` halo.
- **Done** dot: `--accent` filled, the number swaps to a `✓` glyph via `content: '✓'`. (One of the very few places we use a Unicode glyph instead of a Lucide icon — it's inside a CSS pseudo-element so it's purely decorative styling, never read by screen readers.)
- The connecting line between two dots tints to `--accent` when either neighbor is active or done.

On `<540px` the labels hide and only the dots remain — keeps the bar from wrapping.

## Welcome step

- **Illustration**: 88px gradient circle (`--gradient-cta` + `--shadow-glow`) with a Lucide `Compass` icon at 36px. Behind it, two orbs (terracotta + mediterranean, 12s float, reduced-motion safe).
- **Headline**: "Ahlan wa sahlan, &lt;name&gt;" — the name word gets the gold→terracotta→gold animated gradient (same `onb-name-grad` keyframe as other gradient headlines).
- **Perks list**: 3 rows, each with a 32px `--accent-light` icon chip and a body line. Icons: `Sparkles` (personal feed), `Users` (community), `Award` (XP+badges).
- Two CTAs: gold/terracotta gradient "Let's go" + ghost "Skip for now".

## Profile step

- Avatar wrap with overlay edit button (`Camera` icon, 32px accent circle bottom-right).
- Inputs use the same chrome as profile-edit + auth (page-scoped `.input` selector with `--bg-secondary` resting, `--surface-elevated` on focus, 3px tinted ring).
- Bio textarea is optional with a 320-character limit.

## Interests step (the key emoji fix)

10 tiles in a 140px-min auto-fill grid. Each tile has `--int-tint` set inline from the interest's brand-token tint. **Replaces emoji icons with Lucide icons** (per MASTER §4 `no-emoji-icons`):

| Interest | Lucide | Tint |
|----------|--------|------|
| Beaches | `waves` | `var(--cyan)` |
| Historical sites | `landmark` | `var(--sand)` |
| Food & drink | `utensils-crossed` | `var(--accent)` |
| Nature & parks | `trees` | `var(--olive)` |
| Culture & arts | `library` | `var(--violet)` |
| Adventure | `mountain` | `var(--gold)` |
| Sahara & deserts | `sun` | `var(--amber)` |
| Photography | `camera` | `var(--mediterranean)` |
| Budget travel | `piggy-bank` | `var(--success)` |
| Nightlife | `moon` | `var(--rose)` |

These map to the existing Mood / Explore / Events / Tips category palette — a user who picks "Beaches" sees the same cyan they'll see across the entire app from that point forward.

### Tile states
- **Default**: hairline border, 44px tinted icon chip on top, label below.
- **Hover**: lifts `-2px`, border tints to `--int-tint`, icon chip scales `1.08`.
- **Selected** (`.is-selected`): tinted background (10% `color-mix` on tint), border + 1px outer ring in `--int-tint`, icon chip becomes saturated (full `--int-tint` background, white icon), check pill in the top-right opacity 0→1.
- `aria-pressed` reflects state for SR users.

## Connect step

Suggested-users grid (8 candidates). Each card carries the full `data-user-*` attribute set on the avatar wrap so the global `UserActionMenu` activates on right-click / long-press.

### Follow button states
- **Default**: filled `--accent` background with `UserPlus` icon + "Follow".
- **Followed**: transparent background, `--success` text + border + `UserCheck` icon + "Following". Hover flips to `--error-light` background + `--error` text (the "click to unfollow" Instagram-pattern muscle memory, same as user-profile.ts).
- `aria-pressed` reflects state.

### Card state
The whole card gets a `.is-followed` modifier that tints the background to `--success-light` (light mode) or via `color-mix` (modern browsers). Subtle confirmation.

## Done step

- Illustration: 88px gold-gradient circle with `PartyPopper` Lucide icon. Orbs behind in gold + coral.
- Single CTA: "Open my feed" with gold-gradient styling matches the welcome step's primary CTA.

## Validation gates

- Step 1 (Profile): name required (toast error if empty).
- Step 2 (Interests): ≥3 required (toast error).
- Step 3 (Connect): <3 followed → `window.confirm("...empty feed. Continue anyway?")`.

The status line ("N selected" / "Pick at least 3") sits centered in the actions row to give immediate feedback without flashing modals.

## Animation budget

- Card entry: spring 280ms (reduced-motion: removed).
- Active progress dot: `scale(1.1)` + halo box-shadow (instant on state change).
- Interest tile selection: opacity + scale on the check pill (200ms).
- Welcome/done illustration orbs: 12s float (reduced-motion: removed).
- Gradient headline shimmer: 6s loop (reduced-motion: removed).

Total continuous loops on any one step: at most 3 (orbs ×2 + headline gradient). Well under the page-budget ceiling.

## Accessibility

- Progress is `<ol>` with `aria-label="Onboarding progress"`.
- Each interest tile is `aria-pressed` (it's a toggle, not navigation).
- Each follow button is `aria-pressed`.
- Avatar overlay edit button has `aria-label="Change avatar"`.
- All Lucide icons are decoration (icon + text label together); `aria-hidden` is set on the wrapper spans.
- The `✓` glyph in done dots is a CSS pseudo-element — not announced to SR users; the visible label carries the meaning.

## Anti-patterns specific to this page

- Don't reintroduce emoji on the interest tiles. The Lucide+tint vocabulary is what closes the loop with the rest of the app.
- Don't make the orbs bigger than 110px. The illustration circle (88px) must remain the focal element — orbs are glow, not chrome.
- Don't change the 4-step model (Welcome / Profile / Interests / Connect). Adding a step adds friction; condensing two loses information.
- Don't replace the `Skip for now` button. Some users genuinely want to bypass onboarding — gating that creates rage-quit signals.
- Don't auto-advance steps. Every step requires explicit "Continue" so users feel in control.
- Don't show the progress bar on the Done step. Step 4 is *after* the wizard — the visual cue is the gold celebration illustration.

## Files

- Page: [web/src/pages/onboarding.ts](../../web/src/pages/onboarding.ts)
- Styles: [web/src/styles/onboarding.css](../../web/src/styles/onboarding.css)

## Related

- [auth.md](auth.md) — entry surface that routes here on first signup.
- [profile-edit.md](profile-edit.md) — the post-onboarding profile-completion experience.
- [feed.md](feed.md) — where the user lands after completing onboarding.
