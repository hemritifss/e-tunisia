/**
 * Icon-only controls get a native tooltip for free.
 *
 * Every icon button in the app carries an `aria-label` for screen readers,
 * but sighted mouse users got no hint at all — hover an icon and nothing
 * tells you what it does. This mirrors the aria-label into `title` on any
 * button/link that has no visible text, so each labeled icon control gains
 * a hover hint automatically — including ones added later by React.
 *
 * Elements that manage their own `title` are left alone (we never overwrite).
 */
export function initIconTooltips(): void {
  let scheduled = 0;

  const apply = () => {
    scheduled = 0;
    const els = document.querySelectorAll<HTMLElement>(
      'button[aria-label]:not([title]), a[aria-label]:not([title])',
    );
    els.forEach((el) => {
      // Visible text is its own hint — a duplicate tooltip is noise.
      if ((el.textContent || '').trim().length > 0) return;
      const label = el.getAttribute('aria-label');
      if (label) el.title = label;
    });
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = window.setTimeout(apply, 400);
  };

  apply();
  // childList-only: setting `title` mutates attributes, which this observer
  // ignores — no feedback loop.
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
}
