import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';

/**
 * Typo- and accent-tolerant text search for Postgres.
 *
 * The old search matched with a plain `name ILIKE '%q%'`, so any spelling that
 * diverged from the stored value returned nothing: an accent (`Sidi Bou Saïd`),
 * a transliteration (`Jerba`/`Djerba`), or a real typo (`Djarba`). This helper
 * upgrades that to trigram word-similarity over accent-folded text, so those all
 * still land — and ranks the closest matches first.
 *
 * It degrades safely: on SQLite/MySQL, or when the Postgres extensions can't be
 * created (managed DBs sometimes forbid it), it falls back to the original
 * substring match and returns no rank.
 */

/** word_similarity cutoff — 0.3 catches single-character typos without pulling in noise. */
export const FUZZY_THRESHOLD = 0.3;

export interface FuzzyFields {
  /** Alias-qualified columns matched by accent-insensitive substring (partial/exact hits). */
  like: string[];
  /** Alias-qualified columns matched fuzzily by trigram word-similarity, and used for ranking. */
  fuzzy: string[];
}

/**
 * Idempotently install the Postgres bits fuzzy search relies on: the `pg_trgm`
 * and `unaccent` extensions, an IMMUTABLE `f_unaccent` wrapper (unaccent itself
 * isn't immutable, so it can't be indexed directly), and GIN trigram indexes on
 * the columns people actually type. Runs on module init so dev (schema `synchronize`,
 * no migrations) and self-hosted Postgres are self-healing; the migration performs
 * the same steps for versioned production deploys.
 *
 * @returns true when the trigram path is usable; false on non-Postgres or when
 *          extension creation is denied (caller then uses the substring fallback).
 */
export async function ensureFuzzySearch(repo: Repository<any>): Promise<boolean> {
  if (repo.manager.connection.options.type !== 'postgres') return false;
  const run = (sql: string) => repo.query(sql);
  try {
    await run('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    await run('CREATE EXTENSION IF NOT EXISTS unaccent');
    await run(
      `CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text
         LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
         AS $$ SELECT public.unaccent('public.unaccent', $1) $$`,
    );
  } catch {
    // Managed Postgres may forbid CREATE EXTENSION — degrade to plain ILIKE.
    return false;
  }
  // Indexes are a best-effort speed-up; a failure here must not disable fuzzy search.
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_places_name_trgm ON places USING gin (f_unaccent(lower(name)) gin_trgm_ops)`,
    `CREATE INDEX IF NOT EXISTS idx_places_city_trgm ON places USING gin (f_unaccent(lower(city)) gin_trgm_ops)`,
  ];
  for (const sql of indexes) {
    try {
      await run(sql);
    } catch {
      /* index is optional */
    }
  }
  return true;
}

/**
 * Add a typo/accent-tolerant text filter to `qb`.
 *
 * On the trigram path it also registers a ranking column via `addSelect(expr, alias)`
 * and returns that **alias** (dot-free) for the caller to `orderBy`. Ordering by a raw
 * expression would break TypeORM's join+pagination path, which comma/dot-splits the
 * ORDER BY string looking for an alias; ordering by a selected alias avoids that.
 *
 * @param pg          the connection is Postgres (ILIKE is valid; else use LIKE)
 * @param fuzzyReady  {@link ensureFuzzySearch} succeeded — trigram path available
 * @param p           parameter/alias prefix, unique per query builder
 * @returns the ranking alias to ORDER BY (higher = closer), or null when only
 *          substring matching is available (no meaningful ranking).
 */
export function applyFuzzy(
  qb: SelectQueryBuilder<any>,
  pg: boolean,
  fuzzyReady: boolean,
  fields: FuzzyFields,
  term: string,
  p = 'fz',
): string | null {
  const q = term.trim();
  qb.setParameter(`${p}_like`, `%${q}%`);

  if (pg && fuzzyReady) {
    qb.setParameter(`${p}_q`, q);
    qb.setParameter(`${p}_th`, FUZZY_THRESHOLD);
    const norm = (f: string) => `f_unaccent(lower(coalesce(${f}, '')))`;
    qb.andWhere(
      new Brackets((w) => {
        for (const f of fields.like) {
          w.orWhere(`${norm(f)} LIKE f_unaccent(lower(:${p}_like))`);
        }
        for (const f of fields.fuzzy) {
          w.orWhere(`word_similarity(f_unaccent(lower(:${p}_q)), ${norm(f)}) >= :${p}_th`);
        }
      }),
    );
    if (!fields.fuzzy.length) return null;
    const rankExpr =
      'GREATEST(' +
      fields.fuzzy.map((f) => `word_similarity(f_unaccent(lower(:${p}_q)), ${norm(f)})`).join(', ') +
      ')';
    const alias = `${p}_rank`;
    qb.addSelect(rankExpr, alias);
    return alias;
  }

  // Substring only. ILIKE on Postgres (extensions unavailable), LIKE elsewhere
  // (SQLite LIKE is case-insensitive for ASCII, matching the prior behaviour).
  const op = pg ? 'ILIKE' : 'LIKE';
  const cols = Array.from(new Set([...fields.like, ...fields.fuzzy]));
  qb.andWhere(
    new Brackets((w) => {
      for (const f of cols) w.orWhere(`${f} ${op} :${p}_like`);
    }),
  );
  return null;
}
