-- Founders' program: numbered passports for the first 1000 real accounts.
--
-- Why this exists: docker-compose.override.yml runs the API with NODE_ENV=staging,
-- which sets TypeORM synchronize=false, so the new User.founderNumber column has
-- to be added by hand. Mirrors backend/src/users/user.entity.ts.
--
-- Also backfills existing users in signup order — early believers keep their
-- low numbers. Seeded reviewer bots (@travelers.etunisia.tn) are excluded.
--
-- Idempotent — safe to run repeatedly. Apply with:
--   docker exec -i etunisia-postgres psql -U etunisia -d etunisia < scripts/add-founder-numbers.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS "founderNumber" int NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_founderNumber"
    ON users ("founderNumber") WHERE "founderNumber" IS NOT NULL;

WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS rn
    FROM users
    WHERE "founderNumber" IS NULL
      AND email NOT LIKE '%@travelers.etunisia.tn'
      AND "isActive" = true
),
taken AS (
    SELECT COALESCE(MAX("founderNumber"), 0) AS max_n FROM users
)
UPDATE users u
SET "founderNumber" = r.rn + t.max_n
FROM ranked r, taken t
WHERE u.id = r.id
  AND r.rn + t.max_n <= 1000;
