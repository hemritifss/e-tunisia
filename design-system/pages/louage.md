# Louage page (`#/louage`) — tickets edition

> Page-level overrides to `design-system/MASTER.md`. Journal dialect (earned:
> the content IS a travel artifact — a transport fare). Shipped Jul 13 2026.

## Style layer

Opts in via `data-design="carnet"` + `.cn-grain` on the page root. Field-notes
chrome (mono kickers, hairline rules, underline selects, letterpress swap
button) with **one Journal artifact: the louage ticket**.

## The louage ticket (`.lt-ticket`, rendered by `TransportOptions ticket`)

Each transport option is a real ticket: warm-paper fare stub (terracotta
tabular fare + "per seat"/"est. fuel" label + mono route) | dashed perforation
with punched holes | body (mode name in Fraunces + rotated mono duration tag +
note) | barcode strip. Left edge carries the mode stripe **matching real
louage livery**: red = intercity louage, blue = regional/bus, olive = train,
gold = drive. Alternating ±0.5° tilts, hover straightens + lifts.

- `TransportOptions` gets the `ticket` prop **only here** — TripPage keeps the
  compact list.
- Popular routes = dashed perforated chips; explainer = em-dash field notes
  with mini van-stripe swatches (`.lt-swatch`); CTA line in Caveat.
- Reduced motion: tilts frozen, no hover physics. Both themes verified
  (night edition works via tokens — no page-specific dark rules).

## Files

- Markup: [web/src/react/pages/LouagePage.tsx](../../web/src/react/pages/LouagePage.tsx),
  ticket DOM in [web/src/react/components/TransportOptions.tsx](../../web/src/react/components/TransportOptions.tsx)
- Styles: [web/src/styles/louage.css](../../web/src/styles/louage.css) (full carnet rewrite)

## QA notes

- Backend `/api/v1/routing/transport` must be up for tickets to render
  (component returns null offline — page still reads fine without them).
  Verified against a stubbed response (backend/Docker were down at ship time);
  re-verify against the live endpoint when Docker is back.
