# Utility pages (combined doc)

> Page-level overrides to `design-system/MASTER.md` for ten utility pages that share chrome but each has a small distinct identity. Inherits everything not listed here. All styled via [web/src/styles/utility-pages.css](../../web/src/styles/utility-pages.css).

## Pages covered

| Page | Route | Purpose |
|------|-------|---------|
| Tag | `#/tag/:tag` | Hashtag feed |
| Favorites | `#/favorites` | Saved places grid |
| Saved | `#/saved` | Bookmarked posts list |
| Credits | `#/credits` | Wallet + transactions |
| Inquiries | `#/inquiries` | Sent quote requests |
| About | `#/about` | Brand story + values + team |
| Partner | `#/partner` | B2B landing |
| Trip | `#/trip/:slug` | Trip-plan detail (large) |
| Post detail | `#/post/:id` | Single-post page (large) |
| Owner | `#/owner` | Business owner dashboard (largest) |

These pages share enough chrome that consolidating their CSS into one file is the right call. The shared bits (back buttons, empty-state cards, loading spinners) get baseline rules; per-page sections add identity (Favorites = rose, Credits = gold, Inquiries = mediterranean, etc.).

## Shared primitives

### Back button refinement
`.tag-page > .btn.btn-ghost:first-child` + `.credits-page > .btn.btn-ghost:first-child` upgraded to a pill-shaped chip with `--surface-elevated` + border, replacing the previous inline-style `<a class="btn btn-ghost" style="margin-bottom: ...">`. Hover tints to `--surface-hover`.

### Empty-state card
Used on tag, saved, inquiries, favorites. All share:
- Dashed-border card with `--surface` background.
- 72px icon chip (first `<i>` child) at `--accent-light` background + `--accent` icon at 28px.
- Display-font headline + `--text-secondary` body capped at 42ch.
- Action button below.

The selector targets the first `<i>` child generically (`> i:first-child`) which is brittle but works because all these empty states share the same `<i> <h3> <p> <a>` shape.

### Loading spinner
32px circle border with `--accent` top-color, 0.9s spin → 2s under reduced-motion. Reused across all 10 pages via class names already present in pages.css (`.favorites-loading`, `.credits-balance-loading`).

## Page-specific palette

Each page picks one accent from the brand token palette as its identity color (matches the rest of the app's per-page palette pattern):

| Page | Accent |
|------|--------|
| Tag | `--accent` (terracotta) |
| Favorites | `--rose` (heart-saved) |
| Saved | `--accent` (terracotta) |
| Credits | `--gold` (currency) |
| Inquiries | `--mediterranean` (communication) |
| About | varies per value card (coral / olive / mediterranean / gold) |
| Partner | `--accent` + `--gold` (proof stars) |
| Owner | varies per chip (mediterranean→violet business / gold pro) |

## Per-page highlights

### Tag (`#/tag/:tag`)
- Header card with a 64px `--gradient-cta` icon block holding the literal `#` glyph in `--font-display` 1.75rem.
- Tag-meta in tabular-nums.
- Cards lift on hover with `--accent-light` border.
- The inline `style="margin-bottom: ..."` on the back button has been **kept** in the markup but overridden by the CSS selector — easier than tracking which inline styles survive in the older builds.

### Favorites (`#/favorites`)
- Heart icon in `--rose`.
- Place cards lift on hover with `--rose` border.
- Save button on the card: 32px circle, `--rose` text, flips to `--rose` background + white icon when active.

### Saved (`#/saved`)
- Bookmark icon in `--accent`.
- Cards have a 16:9 hero image at the top + structured body below.

### Credits (`#/credits`)
- Gold-tinted balance card with 30%-opacity `--gradient-mesh` overlay (same pattern as Profile completion + Badges progress).
- **Top-up CTA** is the only place we use `--gradient-gold` with `--shadow-glow-gold` outside the Premium page — money page deserves the gold treatment.
- Transaction rows: `credit-in` gets `--success`-tinted icon + value; `credit-out` gets `--error`-tinted icon + neutral value.

### Inquiries (`#/inquiries`)
- Status pills with per-status tint (new=accent, viewed=neutral, replied=mediterranean, quoted=gold, booked=success, cancelled=error).
- Card hover border tints to `--mediterranean` (the page's identity color).
- Booked cards expand to show a "Leave a verified review" CTA that deep-links to `#/place/<id>?review=1&inquiry=<id>`.

### About (`#/about`)
- Value cards now have proper 56px tinted icon chips instead of inline `style="color: ..."` raw color attributes.
- 4 cards = 4 distinct tints (coral / olive / mediterranean / gold) — matches the "Why e-Tunisia" pattern from landing.

### Partner (`#/partner`)
- The 5-star testimonial proof row replaced `★★★★★` text glyphs with 5 Lucide `Star` icons (gold fill, 18px). `aria-label="5 out of 5 stars"` on the container.
- All other partner chrome uses existing `hero2-*` classes from pages.css.

### Owner (`#/owner`)
- `★` rating in the stats line replaced with Lucide `Star` inside an inline `<span class="owner-place-stat-rating">`. JS now uses `innerHTML` to inject the Lucide-class span + calls `replaceIcons` afterward.
- Tier chips (`✓ Verified Business`, `✦ Pro Traveler`) replaced with Lucide `Check` + `Sparkles`. JS uses `innerHTML` + `replaceIcons` so the icons render correctly.
- Business chip uses `mediterranean → violet` gradient with white text; Pro chip uses `--gradient-gold` with dark text.
- Boost badge (visible on actively-boosted listings) gets the same gold-gradient + shadow treatment.

### Trip (`#/trip/:slug`) — large page
The page builds its DOM via `createElement` calls rather than template strings, so most styling already comes through pages.css. Only minor polish here:
- Page max-width 800px (down from the default `--page-max` 1280px) — trip plans are content-dense and read better narrower.

### Post detail (`#/post/:id`) — large page
- Reactions (👍 ❤ 🎉 💡 😂 😮 🤝) are **intentionally kept** as emoji per MASTER §4 (emoji is allowed in user-content reactions, comments, and posts — only structural chrome is banned).
- Content max-width 720px, padded.

## Anti-patterns

- Don't migrate post-detail reactions away from emoji. The 7-reaction Facebook-style picker is the user-content surface MASTER explicitly exempts.
- Don't try to tokenize the literal `#` character in the tag-page header icon. Tunisian hashtag culture uses `#` as a literal symbol; replacing it with a Lucide `Hash` icon would feel sterile.
- Don't extend the gold balance treatment beyond Credits + Premium. Gold = money/achievement; using it on a generic action card dilutes the signal.
- Don't add status pills to surfaces that aren't transactional (inquiries are transactional, posts/places are not).
- Don't redesign Owner without consulting a business stakeholder. The dashboard surface has dense data and small visual changes can break workflows.

## Files

- Shared stylesheet: [web/src/styles/utility-pages.css](../../web/src/styles/utility-pages.css)
- Pages: [tag.ts](../../web/src/pages/tag.ts), [favorites.ts](../../web/src/pages/favorites.ts), [saved.ts](../../web/src/pages/saved.ts), [credits.ts](../../web/src/pages/credits.ts), [inquiries.ts](../../web/src/pages/inquiries.ts), [about.ts](../../web/src/pages/about.ts), [partner.ts](../../web/src/pages/partner.ts), [trip.ts](../../web/src/pages/trip.ts), [post-detail.ts](../../web/src/pages/post-detail.ts), [owner.ts](../../web/src/pages/owner.ts)
