import { getLocale, t } from '../i18n';

/**
 * Locale-aware date/time formatting for chat surfaces and anywhere else that
 * was previously hardcoding 'en-US'. Uses the active UI locale so fr/ar get
 * their own conventions for free.
 */

/** "7:31 PM" (en) / "19:31" (fr) — numeric hour, no leading zero. */
export function formatTime(d: string | number | Date): string {
  return new Intl.DateTimeFormat(getLocale(), { hour: 'numeric', minute: '2-digit' }).format(new Date(d));
}

/** "Today" | "Yesterday" | locale-formatted weekday+date for older days. */
export function formatDayLabel(d: string | number | Date): string {
  const date = new Date(d);
  const key = (x: Date) => x.toDateString();
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (key(date) === key(today)) return t('date.today');
  if (key(date) === key(yesterday)) return t('date.yesterday');
  return new Intl.DateTimeFormat(getLocale(), { weekday: 'long', month: 'short', day: 'numeric' }).format(date);
}

/** "Jul 12" (or locale equivalent) — short absolute date for inbox rows. */
export function formatShortDate(d: string | number | Date): string {
  return new Intl.DateTimeFormat(getLocale(), { month: 'short', day: 'numeric' }).format(new Date(d));
}
