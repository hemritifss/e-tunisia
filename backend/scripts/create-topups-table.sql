-- Creates the `topups` table for the wallet top-up flow (Flouci + mock).
--
-- Why this exists: docker-compose.override.yml runs the API with NODE_ENV=staging,
-- which sets TypeORM synchronize=false (to stop an unrelated `ALTER TABLE follows`
-- sync crash-loop). With sync off, new entities like Topup are NOT auto-created, so
-- this one table has to be added by hand. It mirrors backend/src/credits/topup.entity.ts.
--
-- Idempotent — safe to run repeatedly. Apply with:
--   docker exec -i etunisia-postgres psql -U etunisia -d etunisia < scripts/create-topups-table.sql
-- (In plain dev mode, NODE_ENV=development, synchronize=true creates this automatically
--  and you don't need to run this at all.)

CREATE TABLE IF NOT EXISTS topups (
  id                  uuid          NOT NULL DEFAULT uuid_generate_v4(),
  "userId"            varchar       NOT NULL,
  amount              numeric(12,2) NOT NULL,
  currency            varchar       NOT NULL DEFAULT 'TND',
  status              varchar(16)   NOT NULL DEFAULT 'pending',
  "paymentReference"  varchar       NOT NULL,
  provider            varchar       NOT NULL DEFAULT 'flouci',
  "completedAt"       TIMESTAMP,
  "createdAt"         TIMESTAMP     NOT NULL DEFAULT now(),
  CONSTRAINT "PK_topups" PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_topups_paymentReference" ON topups ("paymentReference");
CREATE INDEX IF NOT EXISTS "IDX_topups_userId" ON topups ("userId");
