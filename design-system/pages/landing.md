# Landing page (`#/hero`) — "Carnet de Voyage" editorial edition

> Page-level overrides to `design-system/MASTER.md` for the unauthenticated landing.
> Anything not listed here inherits from MASTER.
> **Supersedes the previous Cinematic/Aurora landing spec** (mesh orbs, particles, pulse strip,
> gradient headlines) — that layer read as machine-generated and was retired from this page.
> The legacy `.tn-landing` system is **still used by Partner/About** (`partner-v3`, `about-v3`) — keep it.

## Style layer (deviation)

**Editorial travel journal** — hand-assembled, print-inspired (Editorial Grid/Magazine × Nature
Distilled, validated via ui-ux-pro-max). Warm paper surfaces, ink typography, photos treated as
pasted prints, travel ephemera (stamps, tickets, postcards) as the component language.

- **Surfaces:** paper/ink tokens in `tokens.css` — `--paper`, `--paper-warm`, `--paper-print`,
  `--paper-deep` (ink sections), `--ink`, `--ink-soft`, `--ink-faint`, `--ink-on-deep`,
  `--rule`, `--rule-strong` (hairlines), `--tape`, `--stamp-ink`, `--paper-shadow(-lift)`.
  Both themes defined; dark mode is a "night edition", not an inversion.
- **Film grain** overlay on the page root (inline SVG turbulence, ~5% multiply light / 3.5% screen dark).
  Don't remove — it's what kills the flat digital look.
- **Typography:** `--font-editorial` (Fraunces; optical sizing on; weights 420–640; italic accents
  in terracotta) for display · `--font-mono` (uppercase, letter-spaced) for kickers "Nº 0X", captions,
  data · `--font-hand` (Caveat) for margin notes, photo captions, signatures, footnotes · Inter body.
  Arabic (Noto Kufi) is a first-class design element: hero watermark, stamp center, section accents.
- **Buttons:** letterpress — solid fill, 1.5px ink border, hard offset shadow `3px 3px 0 var(--ink)`,
  hover lifts (−2px, bigger shadow), press sinks. No glow, no gradients, no pills.

## Component language (artifacts, not cards)

| Content | Artifact |
|---|---|
| Hero photos | Rotated photo prints: white matte, masking tape, Caveat caption + mono meta, rubber stamp overlap, dashed route doodle |
| Places ("Nº 01 The Index") | Pinned prints with staggered offsets, sticker category label, `Nº 0X` index, serif name, mono city + stars |
| Itineraries ("Nº 02 Field routes") | Boarding-pass tickets: stub + dashed perforation + punched notches + vertical mono route + barcode strip + stamped difficulty |
| Moods ("Nº 03") | Postcards with tape, italic serif title, handwritten description |
| Why ("Nº 04") | Typographic manifesto: pull-quote with oversized terracotta quote mark, 3 hairline columns, drop caps — **no icon boxes** |
| Testimonials ("Nº 05") | Postcards: chechia postage stamp + circular postmark + Caveat signature + mono byline — **no avatars** |
| Partner form | "The letter": tape-cornered paper card, mono labels, underline-only inputs |
| Pricing ("Nº 06") | Fare stubs with top perforation; featured = terracotta border + rotated "MOST LOVED" stamp |
| Stats | "Almanac": hairline-ruled row, mono tabular numerals, handwritten footnote — **static, honest numbers, no count-up** |
| Final CTA | Ink page (`--paper-deep`), cream serif headline, faint stamp, paper button |
| Nav | Masthead: date strip ("Vol. I — … · date · Tunis"), serif wordmark + Arabic, mono small-caps links |

## Rotation etiquette

Tilts (±0.4°–4°) live in `--tilt` per nth-child and use the CSS `rotate` property so
translate-based reveals stay independent. Hover straightens to 0°. Reduced motion keeps the
tilt but freezes transitions.

## Banned on this page (AI tells)

Canvas particles · floating mesh orbs · gradient text · pill announcement badges · animated
count-up stats · dicebear/stock avatar stacks · glassmorphism chrome · neon glows ·
icon-in-gradient-box feature cards · fake "online now" counters.

## Accessibility

- Decorative SVGs (stamp, postmark, route, underline) are `aria-hidden`.
- Star rows carry `aria-label="Rated X out of 5"`.
- Focus-visible: 3px `--mediterranean` outline on all interactives.
- `prefers-reduced-motion`: ticker stops and wraps; reveals render instantly; hover physics off.
- Contrast: `--ink` on `--paper` ≈ 12:1; `--ink-faint` reserved for ≤11px mono labels only;
  explicit `color` on headings over `--paper-deep` (global `h2` color rule beats inheritance — QA-verified bug).

## Gotchas (learned in QA)

- Global `h2 { color }` from base styles overrides inherited section color — always set explicit
  heading color on ink sections.
- Don't style `.ej-postcard-sig span` broadly — it out-specifies `.ej-hand`; use `:not(.ej-hand)`.
- `.ej-reveal` holds content at opacity 0 until observed → full-page screenshots show "empty"
  sections; expected.
- The PWA service worker keeps serving old hashed chunks after a rebuild — unregister SW before
  visual verification.

## Files

- Markup: [web/src/react/pages/HeroPage.tsx](../../web/src/react/pages/HeroPage.tsx) (namespace `.ej-*`)
- Styles: [web/src/styles/landing-editorial.css](../../web/src/styles/landing-editorial.css) (self-contained; linked in `web/index.html` after `landing.css`)
- Tokens: paper/ink + `--font-editorial`/`--font-hand` in [web/src/styles/tokens.css](../../web/src/styles/tokens.css) (Fraunces + Caveat added to the Google Fonts import)
- Legacy (Partner/About only): `web/src/styles/landing.css` + `pages.css` `.tn-*`
