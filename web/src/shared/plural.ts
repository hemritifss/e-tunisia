/**
 * Tiny pluralization helper — kills the "1 places" / "1 BADGES" class of bug.
 * English-only for now (matches the UI copy); swap to locale-aware rules when
 * stat labels go through the i18n dictionaries.
 */
const RULES = new Intl.PluralRules('en');

export function plural(n: number, singular: string, pluralForm?: string): string {
  return RULES.select(n) === 'one' ? singular : (pluralForm ?? `${singular}s`);
}
