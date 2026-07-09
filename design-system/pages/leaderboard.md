# Leaderboard page (`#/leaderboard`)

> Page-level overrides to `design-system/MASTER.md` for the rankings page. Inherits everything not listed here.

## Style direction

Cinematic hero (MASTER §2b — dark mesh + 2 orbs in gold + mediterranean) on top, Nature Distilled rows below. **Top-3 rows get gradient borders** matching their medal tier — gold / silver / bronze. The rest of the list is hairline-bordered cards.

## Section order

1. **Hero** — eyebrow chip ("RANKINGS" with Trophy icon), gradient headline ("Leaderboard" with gold→terracotta gradient), one-line tagline.
2. **Mode tabs** — segmented pill, two tabs: Top Explorers (global XP) / Top Reviewers by City.
3. **City picker row** — only when the City mode is active.
4. **List** — leaderboard rows.

## Medal system (the key fix)

Per MASTER §4 `no-emoji-icons`, emoji medals (🥇🥈🥉) and tier glyphs (✓ / ✦) were **replaced with Lucide-based primitives**:

### Rank chip
- Ranks 1–3 → `rankChip(rank)` renders a 44px circle with the Trophy icon at `opacity: 0.4` behind the rank number. Per-rank gradient:
  - **Gold** (#1): `--gradient-gold` background with dark text.
  - **Silver** (#2): `oklch(86% 0.02 260) → oklch(70% 0.03 260)` neutral-tint linear gradient with dark text.
  - **Bronze** (#3): `--terracotta-light → --terracotta` gradient with dark text.
- Ranks 4+ → plain `#N` in `--font-display` 800, `--text-tertiary`.

### Tier badge (next to user name)
- **Pro Traveler** (`plan === 'premium' | 'admin'`): 16px gold-gradient circle with `Sparkles` icon.
- **Verified Business** (`plan === 'business'`): 16px mediterranean→violet gradient with `Check`.
- **Local Guide** (`role === 'creator'`): 16px `--olive` circle with `BadgeCheck`.

These tier circles are the same vocabulary used everywhere else (own-profile, user-profile, passport) — never invent another tier visual.

## Tab pair

- Two buttons inside a single pill container (`--surface-elevated` + `--border` 1px + `--radius-full`).
- Active button uses `--accent` background with `--accent-text`, `--shadow-sm`.
- Lucide icons: `Globe` (Top Explorers) + `Building2` (Top Reviewers by City).
- `role="tablist"` + `aria-selected`.

## List rows

Each row carries `data-user-*` attrs so the global `UserActionMenu` activates on right-click / long-press.

- **Default**: 1px `--border`, hover lifts `-1px` to `--shadow-md` + `--accent-light` border.
- **Top-3** rows get **padding-box surface + gradient border-box**:
  - 1st: gold gradient (matches the rank chip).
  - 2nd: silver gradient.
  - 3rd: bronze (terracotta) gradient.
- Avatar 40px, info column with name + handle/level, **points column right-aligned with tabular-nums**.

## Loading + empty

- Loading uses the standard 32px spinner with `--accent` top-color and "Loading explorers…" / "Loading top reviewers…" text.
- Empty state: 72px `--accent-light` chip with Trophy icon + tailored message ("No rankings yet — be the first to climb.", "No reviews yet in &lt;city&gt;.", "Couldn't load city rankings.").

## Accessibility

- Each row is a real `<a>` (navigation to passport).
- Tabs are `role="tab"` + `aria-selected`.
- Medal chips have `aria-label="Rank N"`.
- Tier badges have `aria-label` (Pro Traveler / Verified Business / Local Guide) — the icon itself isn't readable to SR users.
- Points column uses tabular-nums to prevent layout shift across rows.

## Anti-patterns specific to this page

- Don't reintroduce emoji medals. The medal-chip primitive replaced them.
- Don't add a 3rd tab. Two modes is the page's mental model.
- Don't show the city picker on the Global tab. The `hidden` attribute toggles based on active mode.
- Don't make the points column wider than 64px — it would compete with the name column for visual mass.
- Don't add inline category tints to rows (e.g. colored by leaderboard category). The page's only visual emphasis is rank — adding category colors would make top-3 medals fight for attention.

## Files

- Page: [web/src/pages/leaderboard.ts](../../web/src/pages/leaderboard.ts)
- Styles: [web/src/styles/leaderboard.css](../../web/src/styles/leaderboard.css)
- Mock data fallback: `web/src/data.ts`.

## Related

- [badges.md](badges.md) — paired gamification page. Both pages share the same hero treatment.
- [passport.md](passport.md) — uses the same tier-badge vocabulary on the passport chips.
- [messenger.md](messenger.md) — `data-user-*` contract.
