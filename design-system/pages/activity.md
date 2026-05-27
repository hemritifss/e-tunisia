# Activity feed (`#/activity`)

> Page-level overrides to `design-system/MASTER.md` for the social activity feed. Inherits everything not listed here.

## Style direction

A **content-first** alert surface — no cinematic hero, no orbs, just a clean header with tab pair + dense entry list. Each entry gets a per-type tint (review=gold, trip=cyan, endorse=violet, follow=mediterranean) that propagates to the icon chip, the actor-link hover color, the hover border, and (for endorse-snippet links) the inline link color.

## Section order

1. **Head** — eyebrow chip ("YOUR CIRCLE" / "COMMUNITY PULSE") + h1 title + description + tabs.
2. **Tabs** — segmented pill, Following / Discover. Following routes to `#/login` when anonymous.
3. **List** — entries grouped by chronology (per-entry, no buckets — the feed is dense).

## Entry types + tints

Each entry carries `--entry-tint` via its `.activity-entry-<type>` modifier:

| Type | Tint | Icon |
|------|------|------|
| review | `var(--gold)` | `Star` |
| trip | `var(--cyan)` | `Compass` |
| endorse | `var(--violet)` | `Award` |
| follow | `var(--mediterranean)` | `UserPlus` |

These four tints align with the rest of the app — gold = achievement (badges, leaderboard top-1, Pro), cyan = trip/journey (mood Beach), violet = creative/intellectual (mood Culture), mediterranean = social/water.

## Emoji removal (the key fix)

Per MASTER §4 `no-emoji-icons`, the page previously used:

| Old emoji | New Lucide |
|-----------|-----------|
| `'★'.repeat(rating)` text stars | `<Star>` with `is-filled` class (gold fill for active, border color for empty), 11px size |
| `topic.emoji` next to topic label | New `topic.icon` field (Lucide name) → component lookup table → rendered as 12px icon |
| `🌍` empty state | `<Globe2 size={28}>` in a `--accent-light` chip |

The new `EndorsementTopic.icon` field (Lucide name in kebab-case) lives alongside the legacy `emoji` field — additive, doesn't break consumers that haven't migrated yet.

## Actor link + avatar wrap

Both `ActorLink` and `ActorAvatar` carry the full `data-user-*` attribute set so the global `UserActionMenu` activates on right-click / long-press. The hover state of the actor link is **the same as the entry tint** — the user reads "this person did *this kind of thing*" through one consistent color thread.

## Star rating row

A standalone `StarRow` component renders 5 Lucide `Star` icons with the first `r` filled. Container is `aria-label="N out of 5 stars"` for SR users.

## Review snippet

Block quote with a 3px `--gold` left border, italic body, `--bg-secondary` background. The gold border matches the review tint without competing with the entry's main chrome.

## Topic chip (endorse only)

Pill with `Award`-style chrome but **violet-tinted** since endorsements are the only place this chip appears. The icon is the topic's Lucide icon (12px), label in 11px uppercase.

## Skeleton

6 rows at 76px each, shimmer using the standard `--surface-hover` → `--surface-active` gradient pattern from feed/mood/explore/events.

## Empty state

`Globe2` icon in `--accent-light` chip + headline + body + CTA. Tone shifts by mode:
- Following: "Your feed is quiet" + "Follow a few travelers…" + "See what's happening now" CTA (switches to Discover).
- Discover: "No recent activity yet" + "Be the first to add to the story…" + "Explore Tunisia" CTA.

## Error state

Same chrome as empty, with `BellOff` icon instead of `Globe2` + "Couldn't load the feed" headline.

## Accessibility

- Tab pair is `role="tablist"` + `role="tab"` + `aria-selected`.
- `<time>` element for timestamps with `dateTime` attribute.
- Star row container has `aria-label="N out of 5 stars"`.
- All `data-user-*` attributes set on actor links/avatars for UserActionMenu.
- Loading state uses `role="status" aria-label="Loading activity"`.

## Anti-patterns specific to this page

- Don't add buckets (Today / This week / Earlier) like the notifications dropdown. The list is short (30 max) and feels denser without buckets.
- Don't introduce more entry types without picking a brand-token tint. The 4-type palette is calibrated to the existing token vocabulary.
- Don't switch the Discover tab to a tinted active state. The active tab uses `--accent` to match the rest of the app's tabs (feed sort bar, leaderboard tabs).
- Don't replace the star fill with shadow. The fill is what makes the row scannable at 11px size.

## Files

- Page: [web/src/react/pages/ActivityFeedPage.tsx](../../web/src/react/pages/ActivityFeedPage.tsx)
- Styles: [web/src/styles/activity.css](../../web/src/styles/activity.css)
- Endorsement topics: [web/src/react/components/endorsement-topics.ts](../../web/src/react/components/endorsement-topics.ts) (now includes `icon` field)

## Related

- [notifications.md](notifications.md) — sibling alert surface (dropdown panel rather than page).
- [feed.md](feed.md) — main social surface; activity feed is the "what your circle did" companion.
