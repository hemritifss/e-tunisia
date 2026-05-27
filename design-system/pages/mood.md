# Mood page (`#/mood/<slug>`)

> Page-level overrides to `design-system/MASTER.md` for mood-driven discovery. Inherits everything not listed here.

## Style direction

Mood pages sit between MASTER §2b (Cinematic) and §2a (Nature Distilled). The **hero band** uses a colored, atmospheric treatment built around the mood's tint — radial gradients + 2 blurred orbs + frosted-glass icon chip + light-on-dark typography. **Below the hero** every section drops back to Nature Distilled: quiet `--surface-elevated` cards, `--border` hairlines, restrained motion.

## Source of truth

[web/src/react/components/mood-definitions.ts](../../web/src/react/components/mood-definitions.ts) is the **only** place mood data lives. Other components (`MoodCompass`, landing `Mood Bento`, etc.) **must import from it** rather than duplicate. The file exports:
- `MOOD_DEFS` — slug-keyed record
- `MOOD_LIST` — array form
- `moodFromHash()` — URL parser with legacy alias support (`food → foodie`)
- `MoodDef` type — `{ id, label, Icon, tagline, tint, cities, endorsementTopic, searchQuery }`

### Tints
Every tint is a **CSS variable reference** (e.g. `var(--cyan)`), never raw hex. The page applies it via inline `--mood-tint`. This is the only sanctioned use of inline `style` for color in the app — and it's still token-driven.

### Icons
Every mood uses a Lucide icon component (`Icon: LucideIcon`). **Never emoji** — earlier versions used 🏖🐪🕌🍲🏔🎭 which violated MASTER §4 `no-emoji-icons`. Icon choices:

| Mood | Icon | Tint token |
|------|------|-----------|
| Beach | `Waves` | `var(--cyan)` |
| Desert | `Sparkles` | `var(--terracotta)` |
| Medina | `Landmark` | `var(--sand)` |
| Foodie | `UtensilsCrossed` | `var(--gold)` |
| Adventure | `Mountain` | `var(--olive)` |
| Culture | `Library` | `var(--violet)` |
| Relax | `Wind` | `var(--mediterranean-light)` |
| Spiritual & Slow | `Sunrise` | `var(--amber)` |

### Slug aliasing
The old `food` slug now resolves to `foodie` via `SLUG_ALIASES`. Always add new aliases there rather than creating duplicate mood entries.

## Hero (`.mood-hero`)

- **Background:** triple-stop radial gradient + linear gradient, all in OKLCH, mixed against the mood tint using `color-mix(in oklch, var(--mood-tint) X%, black/transparent)`. Falls back to a 2-stop linear gradient where `color-mix` isn't supported.
- **Two blurred orbs** float at 14s, with the second offset by `-5s`. Reduced-motion disables them.
- **Icon chip:** 72px frosted-glass circle (`oklch(100% 0 0 / 0.18)` bg, 28% border, 12px backdrop blur, saturate 160%). The Lucide icon is `oklch(98% 0 0)` — true white on the tinted backdrop.
- **Headline:** display font, 800, fluid `clamp(2rem, 5vw, 3.25rem)`. Text shadow `0 2px 12px oklch(0% 0 0 / 0.25)` to maintain contrast over varied tints.
- **City chips:** glass pills (16% white bg, 28% border, 8px blur). Each links to `#/search?q=<city>` — keeps the loop tight without inventing a new route.

## Section grids

- **Place tiles** — 4:3 aspect, `--mood-tint` tinted gradient placeholder, gold rating badge bottom-left.
- **Trip cards** — flex row of up-to-3 stop covers (132px tall), title clamped to 2 lines.
- **Guide cards** — 48px avatar + name + handle + bio clamped to 2 lines + a `Check` icon in `--success` pill when `role === 'creator'`.
- Every card lifts `-2px` to `-4px` on hover with `--mood-tint` border. Image inside scales `1.04`. Spring easing.

## Other-moods grid (`.mood-other-pill`)

- Stacked tile: 36px tinted icon chip on top, label below.
- Background: standard `--surface-elevated`. Hover tints border to that mood's `--mood-tint`. **Different from the hero icon chip** (which is glass on tint) — these are surface pills on neutral.

## Skeletons

200%-width shimmer across `--surface-hover` → `--surface-active` → `--surface-hover`. 1.6s linear. Disabled under reduced-motion.

## 404 fallback

When the slug doesn't resolve, render `MOOD_LIST` as pills (label + Lucide icon). Each pill's hover/border-color reads the mood's own tint.

## Wire-up: landing → mood page

The landing's [Mood Bento](../../web/src/pages/hero.ts) links to:
- `#/mood/adventure` ✓
- `#/mood/culture` ✓
- `#/mood/relax` ✓ (added)
- `#/mood/foodie` ✓ (renamed from `food`, with legacy alias)
- `#/mood/spiritual` ✓ (added)

If you add a new mood to `MOOD_DEFS`, **also**:
1. Add a tile to the landing Mood Bento if it deserves a hero slot (5 tiles max — bento layout assumes 5).
2. Update this doc's icon/tint table.

## Accessibility

- The hero icon is `aria-hidden="true"` — the heading `<h1>` already announces the mood.
- Place tile fallback (`MapPin`), trip empty fallback (`Route`), local-guide check (`Check`) all use `aria-hidden="true"` and rely on adjacent text for screen-reader content.
- The "Local Guide" check chip has `aria-label="Local Guide"` for SR users (the icon is decoration; the label is the affordance).
- Hero text shadows are tuned to keep `>4.5:1` contrast against any of the 8 tint backgrounds. If you add a new mood with a very light tint, verify contrast independently — don't trust the formula.

## Anti-patterns specific to this page

- Don't create a parallel `MOODS` array in any component. Import `MOOD_LIST` from `mood-definitions`.
- Don't put emoji anywhere — not in icons, not in fallbacks, not in city chips, not in subtitles.
- Don't override `--mood-tint` mid-section. The tint is set once on `<main className="mood-page" style={{'--mood-tint': mood.tint}}>` and inherited everywhere via CSS.
- Don't use raw `oklch()` values in the page CSS — only `color-mix` against `var(--mood-tint)` is allowed (with a `@supports not` fallback to a token).
- Don't add more than 4 cities to `cities[]` per mood — the page only renders 6 chips and the queries only check the first few.

## Files

- Page component: [web/src/react/pages/MoodPage.tsx](../../web/src/react/pages/MoodPage.tsx)
- Mood data: [web/src/react/components/mood-definitions.ts](../../web/src/react/components/mood-definitions.ts)
- Feed strip: [web/src/react/components/MoodCompass.tsx](../../web/src/react/components/MoodCompass.tsx) (uses `MOOD_LIST`)
- Styles: [web/src/styles/mood.css](../../web/src/styles/mood.css) (loaded after `pages.css`)
- Original tn-* styles in `pages.css:15580+` remain as the foundation `mood.css` refines.
