# Auth pages (`#/login`, `#/register`)

> Page-level overrides to `design-system/MASTER.md` for the entry surfaces. Both routes render through one `renderAuthPage(cfg)` function with a mode flag.

## Style direction

**Cinematic background photo + glass card on top.** This is the only page in the app that uses a real photograph as the background (not the mesh gradient pattern). Reason: the photo is the brand promise — "this is what awaits you on the other side of signup". The glass card holds the form quietly over the imagery.

## Background

- Fixed-position `<img src="/img/hero2.png">` covering the viewport with `filter: brightness(0.55) saturate(110%)` for legibility.
- Layered overlay: dark mesh tint (`oklch(14% 0.02 260 / 0.65) → oklch(20% 0.05 290 / 0.4) → oklch(18% 0.04 240 / 0.7)`) + radial terracotta corner glow.
- Two floating orbs (terracotta + mediterranean, 18s float, `-9s` delay on second). Reduced-motion disables.

## Card

A frosted-glass card centered in the viewport:
- `oklch(100% 0 0 / 0.96)` background (light mode) or `oklch(18% 0.014 260 / 0.92)` (dark mode).
- 1px translucent border + `--shadow-2xl` + 16px backdrop blur with 160% saturation.
- Max-width 460px, `--radius-2xl` corners.
- Entry: `translateY(12px) scale(0.97) → 0/1` with spring 280ms. Reduced-motion safe.

## Form fields

Every field uses the same shape:

```
auth-field
  auth-field-label                  <-- visible label
  auth-input-wrap                   <-- pill container
    auth-input-icon                 <-- Lucide icon on the left (User / Mail / Lock / Globe2)
    auth-input                      <-- the actual input
    auth-input-toggle (optional)    <-- Eye/EyeOff for passwords
  auth-input-helper (optional)      <-- below the wrap
```

- Wrap has `--bg-secondary` background that flips to `--surface-elevated` on focus-within.
- 1px border tints to `--accent` on focus + 3px tinted ring (`color-mix(in oklch, var(--accent) 18%, transparent)`).
- Icon color: `--text-tertiary` resting → `--accent` on focus.
- 44px min-height for touch.
- All inputs carry semantic `autocomplete` attributes (`name`, `email`, `username`, `new-password`, `current-password`, `country-name`) for password-manager + autofill support.

### Password toggle

`<button>` on the right of password fields, swaps `Eye` ↔ `EyeOff` and updates `aria-pressed` + `aria-label`. Triggers `input.type = 'text'|'password'`. The toggle button has its own focus ring (2px accent outline).

## Password strength meter (register only)

A 4px bar + label below the password input. Updates on every keystroke based on `passwordStrengthTier(pw)`:

| Tier | Width | Color | Label |
|------|-------|-------|-------|
| empty | 0% | `--text-tertiary` | "Password strength" |
| weak | 25% | `--error` | "Weak" |
| fair | 50% | `--amber` | "Fair" |
| good | 75% | `--mediterranean` | "Good" |
| strong | 100% | `--success` + 0 0 12px glow | "Strong" |

Score formula:
- +1 length ≥ 6
- +1 length ≥ 10
- +1 has both lowercase and uppercase
- +1 has digit
- +1 has special character

Score ≥ 4 → strong, 3 → good, 2 → fair, else weak (when non-empty).

The label color also tracks the tier — the same color appears in the bar fill and the label text, so a colorblind user gets two cues (width + text), and a sighted user gets one (color matching the tier).

## Remember-me checkbox (login only)

Custom checkbox built like Settings' toggle pattern, but rectangular:
- Hidden native `<input type="checkbox">` (focus + form integration).
- Visible `.auth-check-box` (18px rounded square) that fills with `--accent` and shows a white `Check` icon when checked.
- Focus-visible adds a 3px tinted ring.

## Submit button

- `--gradient-cta` background + `--shadow-glow` (terracotta glow).
- 48px min-height, full width.
- **Hover**: `-1px` translate + larger shadow + arrow icon shifts `3px` right (spring easing).
- **Busy state** (`.is-busy`): label changes to "Signing in…" / "Creating account…" + arrow icon spins 0.9s linear. Disabled.

## Error banner

`role="alert"` div between the head and the form:
- `color-mix(in oklch, var(--error) 14%, transparent)` background + `--error` border + text.
- `AlertCircle` Lucide icon on the left.
- `hidden` attribute toggled in JS instead of `style="display:none"`.

## Accessibility

- Form uses `novalidate` because we run our own validation (length check + server response).
- Every input has a real `<label for="...">` (no placeholder-as-label).
- `role="alert"` on the error banner so SR users hear it the moment it appears.
- Password toggle uses `aria-pressed` for state + dynamic `aria-label` ("Show password" / "Hide password").
- All decorative SVGs (background, orbs, footer link) are `aria-hidden="true"`.
- Submit button's `aria-busy` is implicit via `disabled` — keep both.

## Anti-patterns

- Don't add social-login buttons (Google / Apple). Backend doesn't support them — adding visual placeholders sells a lie.
- Don't replace the photo background with the standard mesh gradient. Auth is the one page where a real Tunisia image earns its place.
- Don't move the password toggle inside the input (overlapping the text). The 40px gutter on the right is intentional for touch.
- Don't fire the strength meter on the login page. It only makes sense for new passwords.
- Don't change the meter's color order. The progression (red → amber → mediterranean → green) is a Western visual convention that aids quick scanning.
- Don't replace the submit button's gradient with a flat color. The gold-on-terracotta glow is the conversion signal.

## Files

- Page: [web/src/pages/auth.ts](../../web/src/pages/auth.ts)
- Styles: [web/src/styles/auth.css](../../web/src/styles/auth.css)
- Background image: `/img/hero2.png` (lives in the public folder)

## Related

- [profile-edit.md](profile-edit.md) — uses the same `--accent` focus ring on inputs.
- [premium.md](premium.md) — payment modal uses the same input chrome pattern.
