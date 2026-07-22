# Collections page (`#/collections`)

> Page-level overrides to `design-system/MASTER.md`. Rebuilt July 2026 from a
> read-only editor wall into the **carnet de collections** — the theme-grouping
> sibling of Itineraries, now in the same carnet dialect. Opts in with
> `data-design="carnet"` and reuses the `.cn-*` kit from `carnet.css`.

## What a collection *is* (the meaning it was missing)

Two shelves in one book:

- **Editor's picks** (`kind: 'curated'`) — the public collections from
  `GET /collections` (mock fallback in `CollectionsDirectory`). Inspiration you
  can **love**, **save to a shelf**, **send to a trip**, **share** and **copy into
  your own carnets**. Editorial, not user-owned.
- **My carnets** (`kind: 'carnet'`) — boards the traveller builds themselves,
  stored **localStorage-first** (`collections/store.ts`, same rationale as the
  circuits store — no account, no backend needed). A carnet has a title, theme
  stamp, cover-or-collage, places pulled from the live catalog, per-place hand-
  written notes, a privacy flag and (Pro) collaborators.

The two are flattened into one `CollectionView` (`collections/bits.tsx`) so the
grid and the detail sheet never branch on source except for actions.

## Design language

Editorial carnet, **not** the old mesh/orb/gradient hero (deleted). Rules:

- Cards are **pasted photo prints**: paper shadow, tiny rotate + lift on hover,
  a mono count chip, a dashed **theme stamp** tag, an editorial-serif title.
- No cover? Stitch a **2×2 collage** from member photos; still nothing? a
  ruled **blank plate** with the theme emoji pressed in (`CoverCollage`).
- Buttons are letterpress (`.cn-btn`), chips are ink toggles, the detail/editor
  are **paper leaves** on an ink-wash scrim (`.cn-scrim` + `.collections-sheet`).
- Themes are the taxonomy: beach / heritage / food / desert / architecture /
  nature / city / gem — each a stamp (emoji + label). Editor picks are auto-
  tagged by keyword (`inferTheme`).

## Feature surface (what shipped)

Directory: dual tabs + counts, stats masthead, weekly **featured** spotlight,
search, theme filter chips, sort (loved/newest/places/A–Z), love, save-to-shelf,
new-carnet tile with the free-cap meter, per-card visited **stamp progress**,
`?c=<id>` deep-link auto-open.
Detail sheet: hydrated place list (`getPlacesByIds`) linking to `/place/:id`,
visited progress, read-only notes, **add-all-to-trip**, map, share (native +
clipboard), love/save, **make-it-mine** remix, **export/print** (Pro), collaborate
(Pro). Editor: live place picker (`getPlaces?search=`), reorder, per-place notes,
theme, privacy (Pro), create/edit/delete.

## Plan gating

`maxCollections` lives in `plan-catalog.ts` (Free = 3, Pro/Business = ∞), mirrored
by `FREE_MAX_CARNETS` in the store. Pro perks: unlimited carnets, private boards,
collaborators, export. Business: **branded collections** (a marketing surface —
see the "Growth & marketing" group). Gating is client-side (`usePlan()`); there is
no server collections-count endpoint.

## Anti-patterns

- Don't bring back the mesh/orb/gradient hero or glass eyebrow — that was the
  rejected "AI-look".
- Don't make "My carnets" require auth to *build* — localStorage-first is the point.
- Keep the price/caps single-sourced: never hard-code the free cap; read
  `FREE_MAX_CARNETS` (which tracks `plan-catalog.ts`).

## Files

- Wrapper: [web/src/react/pages/CollectionsPage.tsx](../../web/src/react/pages/CollectionsPage.tsx)
- Directory / Detail / Editor / bits / store: [web/src/react/pages/collections/](../../web/src/react/pages/collections/)
- Styles: [web/src/styles/collections.css](../../web/src/styles/collections.css) (kit: `carnet.css`)
- Plans: [backend/src/billing/plan-catalog.ts](../../backend/src/billing/plan-catalog.ts)
