# Settings page (`#/settings`)

> Page-level overrides to `design-system/MASTER.md`. Settings is a **utility page** — no cinematic hero, no orbs, no gradient headlines. Just clean structure and tinted group icons.

## Why no cinematic hero?

Settings is a transactional surface. The user comes here to toggle a thing and leave. A cinematic hero would feel like decoration over a control panel. Compare with utility surfaces in iOS/Android Settings or GitHub Settings — they all use a quiet structured layout. We follow that convention.

## Section group pattern (`.settings-group`)

Each group is a `--surface-elevated` card with:

1. **Group header**: 40px tinted icon chip + title + subtitle. Icon tints come from `data-tint` attribute (cyan/violet/gold/mediterranean/accent), mapped to brand tokens via `color-mix(in oklch, <token> 16%, transparent)` background + colored icon.
2. **Item rows**: flex with `settings-item-text` on the left + control on the right. Hairline `--border-light` dividers between items.

This is the **only page in the app** with tinted icon chips for section headers — settings is the page where the user scans for a category, and the tint helps them locate the right section faster.

## Toggle (custom switch)

CSS-only iOS-style switch built from three layers:
- `<input type="checkbox">` (invisible, occupies the full track for tap-target).
- `.toggle-track` (background, swaps `--border` → `--accent` on checked).
- `.toggle-thumb` (slides via `transform: translateX(20px)` on checked).

Focus-visible adds a 3px tinted ring around the track.

## Danger zone

The "Delete account" item uses `.settings-item-danger` modifier:
- Label text turns `--error`.
- Button uses outlined error treatment (`--error` border + transparent bg → `--error-light` bg on hover).

This is the only place in the app where we apply `--error` to a non-error-state item label. The visual gap is intentional.

## Blocked accounts

The list of blocked users sits inside the Safety group. Each row carries `data-user-*` attrs so the global `UserActionMenu` activates on right-click / long-press — but the in-row Unblock button is the primary action.

## Anti-patterns

- Don't add a hero. This is a utility page.
- Don't make the section icons fully colored chips (saturated background). The tinted-background pattern (`color-mix` 16%) is the right scale — full-color chips would compete with the content.
- Don't replace the custom toggle with a native `<input type="checkbox">`. The custom switch is cross-browser consistent and matches MASTER's animation budget.
- Don't put account-delete behind a toggle. Toggles imply reversibility; account-delete is a button with a confirm dialog.

## Files

- Page: [web/src/pages/settings.ts](../../web/src/pages/settings.ts)
- Styles: [web/src/styles/settings.css](../../web/src/styles/settings.css)

## Related

- [profile-edit.md](profile-edit.md) — paired utility page (account-level edits).
