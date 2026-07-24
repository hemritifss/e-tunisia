import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Typo/accent-tolerant place search.
 *
 * Enables `pg_trgm` + `unaccent`, adds an IMMUTABLE `f_unaccent` wrapper (so the
 * accent-folded expression can be indexed), and creates GIN trigram indexes on the
 * columns people search by. Mirrors the runtime `ensureFuzzySearch()` so managed/
 * versioned deploys (schema `synchronize: false`) get the same setup. All steps are
 * idempotent, so running it after the app already self-installed the objects is a no-op.
 */
export class AddTrigramFuzzySearch1784764800000 implements MigrationInterface {
  name = 'AddTrigramFuzzySearch1784764800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);
    await queryRunner.query(
      `CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text
         LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
         AS $$ SELECT public.unaccent('public.unaccent', $1) $$`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_places_name_trgm ON places USING gin (f_unaccent(lower(name)) gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_places_city_trgm ON places USING gin (f_unaccent(lower(city)) gin_trgm_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_places_city_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_places_name_trgm`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS f_unaccent(text)`);
    // Extensions are left installed — other objects may depend on them.
  }
}
