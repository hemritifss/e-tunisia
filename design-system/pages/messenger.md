# Messenger surfaces (chat popups + active conversations + Pro flair)

> Page-level overrides to `design-system/MASTER.md` for the Facebook-Messenger-style chat popups, the active-conversations widget (rail + mobile sheet), and the Pro/Premium post styling. Anything not listed here inherits from MASTER.

## Scope

This isn't a single page — it's persistent chrome that overlays the app:
- `ChatPopupManager` — floating chat windows, bottom-right (bottom on mobile)
- `ActiveConversationsRail` — widget inside FeedRightRail (desktop only)
- `ActiveConversationsLauncher` — floating FAB + bottom sheet (mobile only)
- `UserActionMenu` — right-click / long-press context menu on any user avatar/byline
- `is-pro` post variant — Pro/Premium users' posts get distinct styling

## Overrides vs MASTER

### Layout / z-index
- Chat popups sit at `--z-overlay` (200), **above** sticky nav but **below** the modal layer.
- Active-conversations bottom sheet uses `--z-modal` (300) — it's a modal surface.
- Mobile FAB lives at `--z-sticky` (100), positioned **bottom-left** at `var(--space-4)` (and `var(--mobile-nav-height) + var(--space-3)` from bottom) **because the existing trip-cart FAB occupies bottom-right**. Don't move either — they're complementary.

### Hide rules
- All Messenger surfaces are **hidden on `/#/messages`** to avoid duplicating the dedicated inbox.
- The mobile FAB is **hidden when logged-out** (no DMs to show).

### Motion
- Popup enter: `transform: translateY(8px) scale(0.96) → 0/1` at `--duration-normal` `--ease-spring`. Origin: `bottom right`.
- Sheet enter: `translateY(20px) → 0` at `--duration-normal` `--ease-spring`.
- Presence-dot pulse: 2s loop using `oklch(57% 0.15 155 / 0.45)` (success ring). **Disabled** under `prefers-reduced-motion`.
- Pro post shine: opacity-only sweep on hover, 1.6s, `--ease-out`. **Disabled** under `prefers-reduced-motion`.

### Color usage (deviation: presence dot)
The pulsing presence ring uses raw `oklch(57% 0.15 155 / …)` instead of a token. This is intentional — `--success` is the base color, but the *fading ring* needs a transparent variant that doesn't exist as a token and shouldn't be tokenized (single use, derived directly from `--success`'s OKLCH coordinates). All other colors come from tokens.

### Typography
Use `--font-display` for the small "✦ Pro" ribbon corner badge (it's a label, not body) and `--font-sans` for everything else. Bubble timestamps use 10px (below the MASTER minimum) but they're decorative `<em>` annotations — never primary content.

### Avatars
- Pro/Premium users get a **2px gradient ring** (`--gradient-gold`) around their avatar everywhere Messenger surfaces render them.
- This is the *only* place we color the avatar border based on plan — don't extend the ring to non-Messenger surfaces without aligning with `TierBadge` consistency first.

## Pro/Premium post variant — design rules

Applied via `.post-card-v2.is-pro` (set in `FeedPage.tsx` when `post.author.plan ∈ {premium, business, admin}`).

- **Border**: 1px gradient border using `--gradient-gold` via `background-clip: padding-box, border-box` trick. **No solid gold border** — too loud.
- **Shadow**: standard `--shadow-lg` plus a `0 4px 24px` gold halo at 8% opacity (15% in dark mode).
- **Ribbon**: `✦ Pro` corner badge, top-right (top-left in RTL), `--font-display` 10px bold. Gold gradient background.
- **Hover shine**: opacity sweep (decoration, not chrome) — must respect reduced-motion.
- **Avatar ring**: 2px gold ring + 2px surface ring for clean separation from the card border.
- **Do not**: color the post body, change the post background, animate anything that shifts layout, or override the existing `TierBadge` (it still appears in the byline).

## Accessibility

- Chat popup is `role="dialog"` with `aria-label="Chat with <Name>"`.
- Message list is `role="log" aria-live="polite"` for screen-reader announcement on new messages.
- Bottom sheet is `role="dialog" aria-modal="true"`, ESC closes, scrim click closes, focus trapped within sheet while open.
- Minimized chat head includes unread count in its `aria-label`.
- Typing indicator includes hidden `aria-label="<Name> is typing"` for SR users.
- Presence: relies on color **and** position + pulse animation (no color-only signal).
- Pro flair: the `✦ Pro` ribbon is the visible cue; `TierBadge` already provides the accessible name. Don't make Pro depend on the gradient border alone.

## Anti-patterns specific to this feature

- Don't render emoji as the popup avatar fallback — use the first letter of the name in `--font-display`.
- Don't auto-open a popup when a message arrives unless the chat is already in the open list — that's notification spam. The presence dot + unread badge are enough.
- Don't increase MAX_DESKTOP beyond 3 — popups compete with scroll and content.
- Don't add the Pro ribbon to the post body — keep it on the card chrome.
- Don't use `position: sticky` on the popup stack — it must remain `position: fixed` so it survives all scroll containers.

## UserActionMenu — design rules

A Facebook-style context menu that opens on right-click (desktop) or long-press ≥450ms (touch) on any element carrying `data-user-id`. Globally mounted; one instance for the whole app.

- **Z-index:** `--z-tooltip` (500) — sits above the modal layer because it's a transient overlay anchored to a user's clicked element.
- **Position:** `position: fixed`, clamped 8px inside viewport. Pointer position for right-click; element `getBoundingClientRect().bottom` for keyboard/programmatic open.
- **Width:** fixed 240px, max-width `calc(100vw - 16px)` so it fits on the smallest phones.
- **Motion:** `scale(0.96) → 1` + opacity at `--duration-fast` `--ease-spring`. Origin `top left`. Disabled under `prefers-reduced-motion`.
- **Dismiss:** outside click, ESC, or any scroll (matches OS context-menu behavior).
- **Header:** avatar (gold ring if Pro) + name + Sparkles for Pro + @handle if available. Keep header non-interactive — it's just identification.
- **Items:** in this order — Send message, View profile, Follow/Unfollow, Copy link. Only show "Send message" and "Follow" when authed and not viewing self.
- **Follow state** is fetched on open via `api.isFollowing(id)`; until it resolves, the row is hidden (not shown disabled — avoids flicker between Follow/Unfollow).
- **Haptics:** brief 8ms vibration on long-press trigger (mobile only); never on right-click (desktop has no equivalent and any visual flash would be jarring).

**Data contract** for trigger elements:
```
data-user-id="<uuid>"     [required]
data-user-name="<name>"   [optional, used in header]
data-user-avatar="<url>"  [optional, used in header]
data-user-handle="<h>"    [optional, used in header subtitle]
data-user-plan="<plan>"   [optional, drives Pro avatar ring + Sparkles]
```

**Where it's currently wired:**
- Post bylines (`PostCard` in `FeedPage.tsx`)
- Right-rail rows (`PersonRow` in `FeedRightRail.tsx`)
- Active-conversations rows (`ConversationRow` in `ActiveConversations.tsx`)

Adding it to a new surface: just sprinkle the `data-user-*` attributes onto the wrapping element. **Do not** add explicit click handlers for the menu — that's the manager's job; doing so causes double-fires.

**Anti-patterns:**
- Don't fire the menu on plain left-click — left-click is for primary navigation (open profile). Right-click / long-press is for *actions*.
- Don't add more than 5 items. If you need more, build a dedicated dropdown on the page itself.
- Don't show the menu on user-card elements inside modals or sheets — the layered z-index handling gets confusing fast.

## How to extend

- New popup variant (e.g. group chat): add a `variant?: 'dm' | 'group'` field to `OpenChat` and switch rendering inside `ChatWindow`. Do not fork the manager.
- New "Pro-only" surfaces (e.g. Pro avatar ring on profile hero): reuse the `.is-pro` modifier convention; never invent a parallel selector like `.premium-card`.
- Connecting a "Message" button (profile pages, place cards) to popups: dispatch `etunisia:open-chat` with `{ userId }`, or call `window.openChatPopup(userId)`. Both are wired through the same path.
