"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTrigramFuzzySearch1784764800000 = void 0;
class AddTrigramFuzzySearch1784764800000 {
    constructor() {
        this.name = 'AddTrigramFuzzySearch1784764800000';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);
        await queryRunner.query(`CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text
         LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
         AS $$ SELECT public.unaccent('public.unaccent', $1) $$`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_places_name_trgm ON places USING gin (f_unaccent(lower(name)) gin_trgm_ops)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_places_city_trgm ON places USING gin (f_unaccent(lower(city)) gin_trgm_ops)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_places_city_trgm`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_places_name_trgm`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS f_unaccent(text)`);
    }
}
exports.AddTrigramFuzzySearch1784764800000 = AddTrigramFuzzySearch1784764800000;
//# sourceMappingURL=1784764800000-AddTrigramFuzzySearch.js.map