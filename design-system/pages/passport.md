# Passport page (`#/u/<handle>`)

> Page-level overrides to `design-system/MASTER.md` for the public Tunisia Passport — the gamification hero that gives this branch (`feat/passport-phase-1`) its name. Inherits everything not listed here.

## Relationship to `user-profile.md`

`user-profile.ts` (vanilla) and `PassportPage.tsx` (React island) both render a public profile. They overlap deliberately:
- **`user-profile`** is a lightweight Instagram-style profile (cover + identity + stats + about + tabs). Loads fast, supports browsing.
- **`PassportPage`** is the canonical, gamification-rich passport (cover + identity + completion bar + endorsements + stats + map + badges + tabs + anon-pill). Heavier, but the page that *defines* a user's travel story.

Both pages route through `#/u/<handle>` — `PassportPage` is the actual one mounted via the React island map in `main.ts`. **Don't** delete `user-profile.ts` — it's still used for `#/user/<id>` (legacy by-id route) and as a fallback in some places.

## Style direction

Hybrid: cinematic mesh hero (MASTER §2b) + Nature Distilled sections below. Pro users get a gold/terracotta/amber hero variant — the same one own-profile uses. Closes the visual loop across profile surfaces.

## Section order

1. **Hero** — avatar, handle, name, country, level chip, plan chip, top-city rank, follower counts, bio, action buttons (Edit / Local Guide / Follow / Endorse / Share).
2. **Profile completion bar** (owner only, dismissible).
3. **Top endorsements strip** (when present).
4. **Stats grid** (`PassportStats` component — left untouched here).
5. **Tunisia journey map** (`TunisiaMap` component).
6. **Badges grid** (`BadgeGrid` component).
7. **Passport tabs** (Trips / Reviews / Activity per the `PassportTabs` component).
8. **Anon CTA pill** (bottom-center, sticky, only when viewer is not logged in).

## Icon discipline (the key fix)

Per MASTER §4 `no-emoji-icons`, this page previously used **emoji as structural icons**:
- 🇹🇳 next to country names → replaced with Lucide `MapPin`.
- ✓ as text glyph for "Verified Business" / "Local Guide" → replaced with Lucide `Check`.
- ✓ as text glyph in profile-completion checklist → replaced with Lucide `Check` (with `strokeWidth={3}` for visible bold).
- × as text glyph in anon-pill dismiss → replaced with Lucide `X`.
- 🇹🇳 in anon-pill brand cue → replaced with `MapPin` in an `--accent-light` chip.

**The toast emoji at activation (🤝) is allowed** — toasts are user-facing celebratory content, not structural chrome. Same exemption MASTER gives to emoji inside user-generated posts and reactions.

## Hero

- **Background:** `--gradient-hero` + `--gradient-dark-mesh` overlay.
- **Two orbs:** mediterranean (top-left, 360px) + gold (bottom-right, 320px, `-8s` delay). 16s float. Reduced-motion disables.
- **Pro variant** (`.is-pro`): gradient flips to `gold → terracotta → amber`. Orbs become amber + terracotta. Matches own-profile and user-profile Pro treatments.
- **Bleeds edge-to-edge** by negating `--page-padding` via `margin-inline`. Rounded only on the bottom.

### Avatar
- 112×112 inside a 4px padding wrap. Wrap is `oklch(100% 0 0 / 0.2)` resting → `--gradient-gold` when Pro.
- A 28px frosted-glass sparkles mark sits bottom-right of the avatar when the user is Pro.
- The wrap carries the full `data-user-*` set so the global `UserActionMenu` activates on right-click / long-press.
- On `<640px` the avatar shrinks to 96×96 and the hero stacks vertically.

### Meta chips
Inline pill row, each chip is frosted glass (14% white bg + 22% border + 8px blur). Within the row there are typed variants:

| Chip | Treatment |
|------|-----------|
| Country | Default frosted glass with `MapPin` icon |
| Passport level (Bronze / Silver / Gold / Platinum) | Per-tier brand-gradient: Bronze=terracotta, Silver=neutral, Gold=`--gradient-gold` (dark-on-gold text), Platinum=mediterranean→violet |
| Pro Traveler | `--gradient-gold` background, dark-on-gold text |
| Verified Business | Mediterranean→violet gradient |
| Local Guide | Olive border + olive-light text |
| Top-city rank | Frosted glass with `--gold` text + trophy icon |

These are the page's signature primitive — the meta row reads as a colored identity bar.

### Action buttons (hero-right)
- Owner: Edit (frosted ghost) + Become-a-Local-Guide (gold gradient with shadow-glow).
- Other-viewer authed: Follow/Following (Follow uses `--gradient-cta` primary, Following uses frosted ghost — flips visual mass to the action that has higher impact) + Endorse (frosted ghost).
- Anon viewer: "Claim your passport" CTA (gradient).
- Share button always present (rendered by `SharePassport` component, not styled here).

All hero buttons use **frosted-glass ghost** variant (`oklch(100% 0 0 / 0.14)` background, 24% border, 8px blur) so they read over the dark mesh.

## Profile completion bar (owner only)

A self-contained section with its own surface — `--surface-elevated` background plus a 40%-opacity `--gradient-mesh` overlay for warmth without competing with the page hero.

- **Progress bar:** 8px tall, fills with `--gradient-cta`, has a soft glow `0 0 16px oklch(55% 0.16 30 / 0.35)`. Animates `width` change with `--duration-slow`.
- **Checklist:** stacked `<li>`. Each item has a 20px circle on the left:
  - Not done: hairline border, transparent center.
  - Done: `--success` fill with white `Check` icon + `--success-light` row background + strikethrough label.
- Only the **next undone item** gets an inline "Do it now" CTA — reduces decision fatigue.
- Dismissible — `localStorage.passport-completion-dismissed = '1'`. Stays dismissed across sessions until reset.

## Anon CTA pill

Bottom-center floating pill, shown only when viewer is not logged in.

- Positioned `fixed; bottom: var(--space-4); left: 50%; transform: translateX(-50%)` so it doesn't depend on viewport scrolling.
- On mobile, shifts to `calc(var(--mobile-nav-height) + space-3 + env(safe-area-inset-bottom))` to clear the bottom nav.
- Slide-up entry animation with `0.6s` delay so the page settles first.
- Dismissible per-session (`sessionStorage`).
- 28px `--accent-light` chip with `MapPin` (replaces the old 🇹🇳 emoji).
- Two actions: "Sign up" primary CTA + dismiss X.

## Accessibility

- Hero avatar wrap carries the `data-user-*` set used by the global `UserActionMenu`.
- All Lucide icons in chips are inline; visible labels carry the meaning so `aria-hidden` isn't strictly needed there, but the icon-only avatar Pro mark uses `aria-label`.
- Profile-completion checkmark is `aria-hidden` (visible label carries state via the `.done` class and the strikethrough text).
- Follow button uses `aria-pressed` (already wired in the FollowButton subcomponent).
- The anon CTA pill is `role="region" aria-label="Sign up CTA"`.
- Hero text shadows tuned for legibility across both default and Pro hero variants. Pro variant (gold/terracotta) tested — text remains ≥4.5:1 contrast against the orb-darkened areas; the orb opacity (0.42) and 70px blur keep the gradient field gentle enough.

## Anti-patterns specific to this page

- Don't add a fourth orb. The hero is at its motion-budget ceiling.
- Don't add another emoji anywhere on this page — the entire fix here was removing emoji-as-structural-icons. If you need a new visual cue, use Lucide.
- Don't move the Local Guide button outside the hero-right slot. It's the page's primary positive action for non-creators and gets its own gradient treatment.
- Don't unify Follow + Endorse into a single dropdown. They're distinct actions with different commitment levels.
- Don't make the profile-completion bar always-visible after dismiss. Persist via `localStorage`, not a banner that comes back on every visit.
- Don't render the anon-pill on owners. The check `isAnon` already gates this — if you add other variants, make sure to add the matching gate.
- Don't change `passportLevel` to require a specific case (`p.passportLevel.toLowerCase()` is intentional — backend may send `"Gold"` or `"GOLD"`).

## Files

- Page: [web/src/react/pages/PassportPage.tsx](../../web/src/react/pages/PassportPage.tsx)
- Styles: [web/src/styles/passport.css](../../web/src/styles/passport.css) (loaded after `pages.css`)
- Sub-components (not redesigned here, retain their existing chrome):
  - `web/src/react/components/PassportStats.tsx`
  - `web/src/react/components/TunisiaMap.tsx`
  - `web/src/react/components/BadgeGrid.tsx`
  - `web/src/react/components/PassportTabs.tsx`
  - `web/src/react/components/SharePassport.tsx`
  - `web/src/react/components/EndorseModal.tsx` (and `TopEndorsementsStrip`)
  - `web/src/react/components/FollowList.tsx`
  - `web/src/react/components/SignupGate.tsx`
  - `web/src/react/components/PassportOnboarding.tsx`

If you redesign any sub-component, add its rules to this doc rather than creating a new override file — they're all bound to the passport page surface.

## Related

- [profile.md](profile.md), [user-profile.md](user-profile.md) — the other profile surfaces.
- [messenger.md](messenger.md) — the `data-user-*` contract that the hero avatar wrap conforms to.
