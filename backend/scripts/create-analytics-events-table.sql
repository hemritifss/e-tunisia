-- Creates the `analytics_events` table for durable first-party product events.
--
-- Why this exists: docker-compose.override.yml runs the API with NODE_ENV=staging,
-- which sets TypeORM synchronize=false. With sync off, new entities like
-- AnalyticsEvent are NOT auto-created, so this table has to be added by hand.
-- It mirrors backend/src/analytics/analytics-event.entity.ts.
--
-- Idempotent — safe to run repeatedly. Apply with:
--   docker exec -i etunisia-postgres psql -U etunisia -d etunisia < scripts/create-analytics-events-table.sql
-- (In plain dev mode, NODE_ENV=development, synchronize=true creates this automatically.)

CREATE TABLE IF NOT EXISTS analytics_events (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4(),
  name        varchar(64) NOT NULL,
  "userId"    varchar     NULL,
  "anonId"    varchar(64) NULL,
  props       text        NULL,  -- TypeORM 'simple-json' stores as text
  "createdAt" TIMESTAMP   NOT NULL DEFAULT now(),
  CONSTRAINT "PK_analytics_events" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "IDX_analytics_events_name"      ON analytics_events (name);
CREATE INDEX IF NOT EXISTS "IDX_analytics_events_userId"    ON analytics_events ("userId");
CREATE INDEX IF NOT EXISTS "IDX_analytics_events_createdAt" ON analytics_events ("createdAt");
