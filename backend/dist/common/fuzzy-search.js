"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FUZZY_THRESHOLD = void 0;
exports.ensureFuzzySearch = ensureFuzzySearch;
exports.applyFuzzy = applyFuzzy;
const typeorm_1 = require("typeorm");
exports.FUZZY_THRESHOLD = 0.3;
async function ensureFuzzySearch(repo) {
    if (repo.manager.connection.options.type !== 'postgres')
        return false;
    const run = (sql) => repo.query(sql);
    try {
        await run('CREATE EXTENSION IF NOT EXISTS pg_trgm');
        await run('CREATE EXTENSION IF NOT EXISTS unaccent');
        await run(`CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text
         LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
         AS $$ SELECT public.unaccent('public.unaccent', $1) $$`);
    }
    catch {
        return false;
    }
    const indexes = [
        `CREATE INDEX IF NOT EXISTS idx_places_name_trgm ON places USING gin (f_unaccent(lower(name)) gin_trgm_ops)`,
        `CREATE INDEX IF NOT EXISTS idx_places_city_trgm ON places USING gin (f_unaccent(lower(city)) gin_trgm_ops)`,
    ];
    for (const sql of indexes) {
        try {
            await run(sql);
        }
        catch {
        }
    }
    return true;
}
function applyFuzzy(qb, pg, fuzzyReady, fields, term, p = 'fz') {
    const q = term.trim();
    qb.setParameter(`${p}_like`, `%${q}%`);
    if (pg && fuzzyReady) {
        qb.setParameter(`${p}_q`, q);
        qb.setParameter(`${p}_th`, exports.FUZZY_THRESHOLD);
        const norm = (f) => `f_unaccent(lower(coalesce(${f}, '')))`;
        qb.andWhere(new typeorm_1.Brackets((w) => {
            for (const f of fields.like) {
                w.orWhere(`${norm(f)} LIKE f_unaccent(lower(:${p}_like))`);
            }
            for (const f of fields.fuzzy) {
                w.orWhere(`word_similarity(f_unaccent(lower(:${p}_q)), ${norm(f)}) >= :${p}_th`);
            }
        }));
        if (!fields.fuzzy.length)
            return null;
        const rankExpr = 'GREATEST(' +
            fields.fuzzy.map((f) => `word_similarity(f_unaccent(lower(:${p}_q)), ${norm(f)})`).join(', ') +
            ')';
        const alias = `${p}_rank`;
        qb.addSelect(rankExpr, alias);
        return alias;
    }
    const op = pg ? 'ILIKE' : 'LIKE';
    const cols = Array.from(new Set([...fields.like, ...fields.fuzzy]));
    qb.andWhere(new typeorm_1.Brackets((w) => {
        for (const f of cols)
            w.orWhere(`${f} ${op} :${p}_like`);
    }));
    return null;
}
//# sourceMappingURL=fuzzy-search.js.map