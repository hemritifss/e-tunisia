# Notifications dropdown (`#notif-panel` in static markup)

> Style override for the notifications dropdown panel. The markup is static in [web/index.html](../../web/index.html) and populated by `initNotifications()` in [main.ts](../../web/src/main.ts). No JS changes were made — only chrome polish.

## Relationship to `activity.md`

Notifications is the **dropdown sibling** of Activity. Both are alert surfaces:
- **Notifications** = events *about you* (someone followed you, commented, endorsed you, sent you a tip). Dropdown UI, badge on the bell, websocket-live.
- **Activity** = events *about people you follow* (their reviews, trips, endorsements). Dedicated page, manual visit.

## Bell + badge

The bell sits in the top nav (`#notif-toggle`).
- **Badge**: 18px pill with red `--error` background, white text, tabular-nums.
- **Flash animation** on incoming notification: 0.9s spring rotation (`-14deg → 12deg → -8deg → 6deg → 0`). Triggered by the JS via `.notif-toggle-flash` class. Reduced-motion disables.

## Panel position

- **Desktop (≥540px)**: floating below the nav, `right: var(--space-3)`, 380px wide. Entry: `translateY(-8px) scale(0.97) → 0/1` with spring.
- **Mobile (<540px)**: sheet-from-bottom, full-width, top-radius `--radius-2xl`, max-height `80dvh`. Entry: `translateY(100%) → 0`.

Both variants share `--surface-elevated` background + `--border` 1px + `--shadow-2xl`.

## Scrim

Light scrim on mobile only (`oklch(0% 0 0 / 0.35)` + 2px blur). Desktop has no scrim — the panel is small enough that the page behind stays readable, and a scrim would feel modal when it's not.

## Header

- Sticky at the top of the panel (in case the user scrolls a long list).
- Title in display-font 700 on the left, "Mark all read" button on the right.
- **Mark-all-read** is `--accent` text on transparent background, tints to `--accent-light` on hover. Uppercase-style positioning but lowercase text for friendliness.

## Time-bucket sections

The JS groups notifications into 3 buckets: Today / This week / Earlier. Each bucket gets:
- A small uppercase label (11px, `--text-tertiary`, wide tracking).
- A stack of items below.
- 12px gap between buckets.

Sections are skipped if their bucket is empty — no "no items" placeholders within buckets.

## Notif item

Grid layout: avatar block · body · unread dot.

- Avatar (40px) sits in a `notif-item-icon-wrap` that also holds the **type bubble** (22px circle with the notification type's Lucide icon, bottom-right of the avatar).
- The type bubble's color comes from `notifTypeMeta()` in main.ts and is set inline via `style="--type-color: ..."`. The JS already uses OKLCH literals matching brand tokens — no fix needed.

### Item states

- **Default**: transparent background, hover `--surface-hover`.
- **Unread** (`.notif-item.unread`): subtle `--accent`-tinted background (6% via `color-mix`), title gains font-weight 600, unread dot is visible on the right column. Hover deepens the tint to 10%.

### Title + sub

- Title: clamped to 2 lines, 14px, font-weight tracks unread state.
- Sub (optional, e.g. comment snippet): 12px, secondary color, clamped to 2 lines.
- Time: 11px, tabular-nums, in `--text-tertiary`.

### Unread dot

8px `--accent` circle with a 4px tinted shadow ring (via `color-mix`). Sits in the grid's right column, centered vertically.

## Empty state

When the user has no notifications or isn't signed in:
- 48px circle (`--accent-light` + `--accent` icon) — `BellOff` for signed-out, `Bell` for empty.
- Body text in `--text-secondary`.
- Optional "Sign in" CTA for the signed-out variant.

## Live-refresh wiring (unchanged)

The JS already handles:
- WebSocket `etunisia:notification-new` event → immediate refresh + bell flash.
- 45s polling while the tab is visible.
- `focus`, `hashchange`, `visibilitychange` triggers.

No CSS changes affect this — the styling is purely visual.

## Accessibility

- Type bubble has the icon visible but no SR text; the title/sub/time carry the meaning.
- Unread dot uses `aria-label="unread"`.
- Mark-all-read is a real `<button>`.
- The bell flash uses `aria-hidden="true"` decoration — the badge count carries the SR cue.

## Anti-patterns

- Don't increase the bell flash duration past 0.9s. It already rotates 4 times — anything slower starts to feel obnoxious.
- Don't add a scrim on desktop. The page behind should remain interactive (click-away dismisses the panel).
- Don't replace the type-bubble color with the avatar's border color. The bubble's job is to telegraph *what kind* of notification this is at a glance — its position next to the actor's face does the work.
- Don't show the unread dot when the item is being hovered. The unread state should be obvious throughout the interaction.

## Files

- Markup: [web/index.html](../../web/index.html) (`#notif-panel`, `.notif-panel-list`, `.notif-item`)
- JS logic: [web/src/main.ts](../../web/src/main.ts) (`initNotifications()`, `renderNotif()`, `notifTypeMeta()`)
- Styles: [web/src/styles/notifications.css](../../web/src/styles/notifications.css)

## Related

- [activity.md](activity.md) — paired alert surface (page version).
- [messenger.md](messenger.md) — the bell flash pattern is similar in spirit to the chat-popup unread-bump animation.
