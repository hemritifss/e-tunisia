# e-Tunisia Production Hardening — Session Handoff

**Session Date:** 2026-05-28  
**Status:** Major production blockers resolved. Backend compiles (0 errors). Frontend builds (1.5s).  
**Next Step:** Review this doc, then tackle the "Remaining Work" section below.

---

## ✅ COMPLETED IN THIS SESSION

### 1. BullMQ Queue Workers (8 new files)
All 6 queues now have active `@Processor` workers. Jobs are no longer stuck in Redis forever.

| Processor | Queue | Jobs Handled |
|-----------|-------|-------------|
| `NotificationProcessor` | `notifications` | `send` (DB→WS→push), `send_bulk` |
| `EmailProcessor` | `emails` | `password_reset`, `welcome`, `booking_confirmation` |
| `AnalyticsProcessor` | `analytics` | `track_event` (Redis counters), `compute_trending` |
| `ImageProcessor` | `images` | `optimize` (WebP via Sharp), `generate_thumbnails` |
| `BookingProcessor` | `bookings` | `confirm` (email+push), `reminder`, `cancel` |
| `PayoutProcessor` | `payouts` | `initiate` (audit log), `retry_failed` |

**New files:**
- `backend/src/email/email.service.ts` — Resend API. Falls back to console logging in dev if `RESEND_API_KEY` absent.
- `backend/src/email/email.module.ts`
- `backend/src/queues/processors/*.ts` (6 processors)

**Service integrations** (jobs now queued from these services):
- `auth.service.ts` → welcome email on register, password reset email
- `notifications.service.ts` → new `queueNotification()` / `queueBulkNotification()` methods
- `bookings.service.ts` → confirmation job after `confirmPayment()`
- `analytics.service.ts` → `trackEvent()` queues jobs with sync Redis fallback
- `media.controller.ts` → image optimization queued on every upload

### 2. Global Rate Limiting
- `CustomThrottlerGuard` registered as `APP_GUARD` in `app.module.ts`
- All routes now rate-limited automatically
- WebSocket message rate limiting: 20 msgs per 10s per user

### 3. JWT Token Invalidation on Password Change
- Added `tokenVersion: number` column to `User` entity
- JWT payload includes `tv` (token version)
- `resetPassword()` increments `tokenVersion`
- `JwtStrategy.validate()` rejects tokens where `payload.tv !== user.tokenVersion`
- **Effect:** Changing password instantly invalidates ALL existing sessions

### 4. Health Monitoring (4 endpoints)

| Endpoint | Checks |
|----------|--------|
| `GET /health` | Database, Redis, Memory, Disk |
| `GET /health/db` | Database ping |
| `GET /health/redis` | Redis connectivity |
| `GET /health/queues` | 6 queue stats (waiting/active/completed/failed) |

**New file:** `backend/src/redis/redis.health.indicator.ts`

### 5. WebSocket Security
- CORS fixed: no more `origin: '*'`. Now validates against `ALLOWED_ORIGINS`
- Message size limit: 2000 chars
- Rate limiting: 20 messages per 10s per user
- Chat history: stores last 50 messages in Redis list (was: single latest only)

### 6. Environment Validation (Fail-Fast)
**New file:** `backend/src/common/validation/env.validation.ts`
- Validates 18 required/optional env vars on startup
- Blocks server boot in production if validation fails
- Detects weak/default `JWT_SECRET` values

### 7. Logging & Observability
- **Request ID middleware** — `X-Request-ID` header propagation
- **Log URL sanitization** — tokens, passwords, API keys redacted from logged URLs
- **Structured errors** — `requestId` included in all error responses
- **Logging interceptor** — includes `[requestId]` in every log line

### 8. Swagger Protection
- Disabled in production by default
- Enable with `SWAGGER_ENABLED=true`
- Optional `SWAGGER_SECRET` query param for access control

### 9. Database Production Readiness
- `synchronize: false` in production/staging (was `true`)
- Connection pooling: `DB_POOL_MAX` (default 20), `DB_POOL_MIN` (default 5)
- **Migration infrastructure:**
  - `backend/src/database/data-source.ts` — TypeORM CLI data source
  - `backend/src/database/migrations/README.md` — documentation
  - npm scripts: `migration:generate`, `migration:run`, `migration:revert`, `migration:show`

### 10. Graceful Shutdown
- SIGTERM/SIGINT handlers
- 10s grace period for active requests
- HTTP server closed cleanly
- Force exit after timeout

### 11. Media Upload Security
- Multer `fileSize: 50MB` limit on all multipart uploads
- File type whitelist: `jpeg, png, gif, webp, svg, mp4, webm`
- Invalid types rejected with clear error message

### 12. Response Compression & Timeouts
- `compression()` middleware for API responses
- Server timeout: 30s
- Keep-alive timeout: 65s

### 13. Admin Security
- `updateUser` endpoint now uses `UpdateUserDto` with validation
- Service-level field whitelist prevents mass assignment of sensitive fields (`tokenVersion`, `stripeCustomerId`, `password`, `role`, etc.)

### 14. Database Indexes Added
Frequently queried columns now indexed for performance:

| Entity | New Indexes |
|--------|-------------|
| **User** | `role`, `plan`, `isActive` |
| **Place** | `city`, `rating`, `isActive`, `isFeatured`, `isApproved`, `submittedBy` |
| **Booking** | `userId`, `placeId`, `itemId` |
| **Notification** | `userId`, composite `(userId, isRead, createdAt)` |
| **Post** | `category`, `placeId` |

### 15. Frontend Bundle Optimization
- `mountIsland()` supports `Suspense` for lazy-loaded components
- 3 pages code-split into separate chunks:
  - `ReelsPage` → 8KB
  - `AITravelPlanner` → 11KB
  - `AdminPage` → 17KB
- Main chunk: 882KB → **853KB**

### 16. XSS Fixes (Critical Paths)
- `web/src/main.ts` mention dropdown — `esc()` applied to user handles/names
- `web/src/main.ts` photo preview — `esc(file.name)` in alt attribute
- `web/src/pages/feed.ts` `renderPostCard` — `esc()` applied to all user content
- `web/src/pages/feed.ts` sponsor cards — `esc()` applied to sponsor data

### 17. Startup Optimizations
- Backfill scripts only run in dev or when `RUN_BACKFILLS=true`
- `main.ts` logs all health endpoint URLs on boot

---

## 🔧 REMAINING WORK (DO NEXT)

### Priority 1: Database Migrations
**Status:** Infrastructure ready, but NO migration files exist yet.

**What to do:**
1. Set up a PostgreSQL dev database (or use Docker)
2. Run `npm run migration:generate -- src/database/migrations/InitialSchema`
3. Verify the generated migration looks correct
4. Test `npm run migration:run` against a fresh database
5. Commit the migration files

**Why this matters:** `synchronize: false` in production means the schema won't auto-create. Without migrations, deploying to a fresh PostgreSQL database will fail.

### Priority 2: Environment Variables
**Set these in production `.env`:**

```env
# Required for email to work
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com

# Required for Swagger if you want docs in production
# SWAGGER_ENABLED=true
# SWAGGER_SECRET=your-secret-key

# Database pooling
DB_POOL_MAX=20
DB_POOL_MIN=5

# Backfills (only enable for one-time data migrations)
RUN_BACKFILLS=false
```

### Priority 3: Test Queue Workers End-to-End
**What to verify:**
1. `POST /auth/forgot-password` → check `GET /health/queues` shows 1 job in `emails` queue → email processor runs
2. `POST /media/upload` with an image → check `images` queue for `optimize` job
3. `POST /bookings` then confirm payment → check `bookings` queue for `confirm` job
4. Check PM2 logs for processor output: `pm2 logs etunisia-api`

**Common issues to debug:**
- Redis not running → queues won't process
- Sharp not installed → image processor fails
- Resend API key missing → emails log to console but don't send

### Priority 4: Remaining XSS Audit
**Status:** Critical paths fixed. ~110 innerHTML usages remain across vanilla pages.

**What to check:**
```bash
# Find pages with innerHTML + template literals but NO esc() function
cd web/src/pages
for f in *.ts; do
  has_esc=$(grep -c "function esc" "$f" || echo 0)
  has_innerhtml=$(grep -c 'innerHTML.*\${' "$f" || echo 0)
  if [ "$has_innerhtml" -gt 0 ] && [ "$has_esc" -eq 0 ]; then
    echo "REVIEW: $f"
  fi
done
```

**Pages already confirmed safe (have esc()):** collections, events, leaderboard, messages, place-detail, post-detail, profile, profile-edit, saved, search, settings, tag, tips, user-profile

**Pages to review:** auth.ts, owner.ts, password-reset.ts (these have innerHTML but no esc() — need to verify they only render hardcoded values/numbers)

### Priority 5: Full innerHTML Audit of Remaining Pages
Use this pattern for each risky file:
```typescript
function esc(v: unknown): string {
  const s = String(v ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```
Then apply `esc()` to any `${variable}` inside template literals assigned to `innerHTML`.

### Priority 6: Missing DTOs on `@Body() ...: any` Endpoints
These endpoints bypass ValidationPipe whitelist:

| File | Endpoint | Risk |
|------|----------|------|
| `events.controller.ts:33` | `POST /events` | No input validation |
| `collections.controller.ts:27` | `POST /collections` | No input validation |
| `itineraries.controller.ts:27` | `POST /itineraries` | No input validation |
| `inventory.controller.ts:48` | `POST /inventory` | No input validation |
| `inventory.controller.ts:55` | `PATCH /inventory/:id` | No input validation |
| `marketplace.controller.ts:60` | `POST /marketplace/products` | No input validation |
| `marketplace.controller.ts:71` | `PATCH /marketplace/products/:id` | No input validation |

**Fix:** Create DTOs with `class-validator` decorators for each.

---

## 🐛 KNOWN ISSUES TO DEBUG

### 1. Meilisearch Module Resolution
**File:** `backend/src/search/search.service.ts`  
**Issue:** Uses `require('meilisearch').MeiliSearch` to bypass ESM/CJS conflict.  
**Action:** Verify this works in your Node version. If it fails, try:
```typescript
import { MeiliSearch } from 'meilisearch';
```

### 2. Sharp Image Processing on Windows
**File:** `backend/src/queues/processors/image.processor.ts`  
**Issue:** `sharp` may have native module compilation issues on Windows.  
**Action:** If image processor crashes, check:
```bash
cd backend && npm rebuild sharp
# Or reinstall:
npm uninstall sharp && npm install sharp
```

### 3. BullMQ Redis Connection
**File:** `backend/src/queues/queues.module.ts`  
**Issue:** If Redis requires password auth, verify `REDIS_PASSWORD` is set.  
**Debug:** Check `GET /health/redis` returns `status: up`.

### 4. Frontend API Import Path Confusion
**Risk:** React components importing from `../../api` instead of `../../shared/api`.  
**Files that were fixed:** `ActiveConversations.tsx`, `ChatPopupManager.tsx`, `UserActionMenu.tsx`  
**Action:** Search for any remaining incorrect imports:
```bash
grep -r "from '../../api'" web/src/react/
```

### 5. TypeORM `synchronize: true` in SQLite Dev
**File:** `backend/src/database/database.config.ts`  
**Issue:** SQLite dev mode still uses `synchronize: true`. This is fine for dev but means entity changes auto-modify the SQLite DB.  
**Action:** No fix needed for dev, but be aware that changing entities will drop/recreate SQLite tables.

---

## 🐛 BACKEND BUGS FOUND DURING FRONTEND QA (2026-05-29)

Found by live-QA'ing the React migration against the Docker backend (Postgres). Listed worst-first. All are backend-side — the frontend handles each gracefully.

### B1 — 🔴 CRITICAL: Two `Follow` entities collide on one table → follow 500s
**Symptom:** `POST` follow returns 500 — Postgres `null value in column "followedId" violates not-null constraint`.
**Root cause:** Two separate entity classes both declare `@Entity('follows')` with **conflicting column names**:
- `backend/src/users/follow.entity.ts` → `followerId`, **`followedId`** (NOT NULL, `@Unique`, `@Index`) — used by `users/follows.service.ts`
- `backend/src/social/follow.entity.ts` → `followerId`, **`followingId`** — used by `social/social.service.ts`

Both modules register their entity against the **same physical table**. The table ends up with a NOT-NULL `followedId` column, but `social.service.ts:38` inserts `{ followerId, followingId }` (never sets `followedId`) → constraint violation.
**Fix:** Consolidate to ONE Follow entity + one service. The `users/follow.entity.ts` version is more complete (unique constraint + indexes) — make `social.service.ts` use it and rename its `followingId` usages to `followedId`, then delete `social/follow.entity.ts`. Verify only one entity maps to `follows`.

### B2 — 🔴 CRITICAL: `password` (bcrypt hash) leaks in user responses
**Symptom:** `GET /users/me` and `PUT /users/me` return the full `User` entity including the `password` field (bcrypt hash).
**Root cause:** `user.entity.ts:41` marks `password` with `@Exclude()`, but **no `ClassSerializerInterceptor` is registered**. The only global interceptors (`main.ts:112`) are `TransformInterceptor` + `LoggingInterceptor`, so `@Exclude()` is never applied. `users.controller.ts:233` returns `usersService.update(...)` → `findById()` → raw entity.
**Fix (pick one):** (a) register `ClassSerializerInterceptor` globally via `APP_INTERCEPTOR` in `app.module.ts` (cleanest — makes every `@Exclude()` effective), or (b) hand-strip `password` in the service/controller like the public `:id` endpoint already does (`users.controller.ts:272-284`). Audit every endpoint that returns a raw `User`.

### B3 — 🟠 `credit_transactions` enum causes `synchronize` crash-loop on Postgres
**Symptom:** With `synchronize: true` (dev), the API crash-loops trying to ALTER `credit_transactions_kind_enum` on every boot.
**Root cause:** `credits/credit-transaction.entity.ts:31` uses `@Column({ type: 'simple-enum', enum: CreditTxKind })`. `simple-enum` is meant for SQLite/MySQL; on Postgres TypeORM detects a phantom diff against the native enum every sync and retries forever.
**Fix:** Change to `type: 'enum'` (native Postgres enum) or `type: 'varchar'`. Long-term, prefer migrations over `synchronize` (infra already exists — see "Priority 1"). Temporary QA workaround used: `backend/docker-compose.override.yml` sets `NODE_ENV=staging` to disable sync (delete this file once fixed).

### B4 — 🟡 Dev CORS rejects Vite's fallback port 5174
**Symptom:** When 5173 is taken, Vite serves on **5174**; browser writes (follow, profile save) fail with `Not allowed by CORS: http://localhost:5174`.
**Root cause:** `main.ts:42-52` default `ALLOWED_ORIGINS` lists `localhost:5173/3000/4173` only — 5174 isn't covered.
**Fix:** Add `http://localhost:5174` to the dev defaults, or a `http://localhost:*` wildcard pattern (the regex builder at `main.ts:54-57` already supports `*`). Dev-only; production sets explicit `ALLOWED_ORIGINS`.

### B5 — 🟡 `GET /api/v1/search` returned 404 at runtime (stale build)
**Symptom:** Search API 404s; `api.search()` swallows it → search UI shows "No matches" for everything.
**Root cause:** NOT a source bug — `search.controller.ts` (`@Controller('search')` + `@Get()`) is correct and `SearchModule` IS registered (`app.module.ts:101`). The running Docker container serves the committed `backend/dist`, which appears **stale** (predates the route) — or `search.service.search()` throws (Meilisearch — see Known Issue #1) and maps to 404.
**Fix:** Rebuild `dist` in the container (`npm run build`) and confirm Meilisearch is reachable. Verify `GET /api/v1/search?q=test` returns 200.

> **Note on XSS audit (Priorities 4–5 above):** those reference `web/src/pages/*.ts`, which the 2026-05-29 frontend migration **deleted** — those surfaces are now React (JSX auto-escapes). Remaining XSS risk is limited to the few `dangerouslySetInnerHTML` calls (linkified hashtags/mentions) in the new `web/src/react/pages/*.tsx`.

---

## 📁 FILES CREATED (13)

```
backend/src/email/email.service.ts
backend/src/email/email.module.ts
backend/src/queues/processors/notification.processor.ts
backend/src/queues/processors/email.processor.ts
backend/src/queues/processors/analytics.processor.ts
backend/src/queues/processors/image.processor.ts
backend/src/queues/processors/booking.processor.ts
backend/src/queues/processors/payout.processor.ts
backend/src/redis/redis.health.indicator.ts
backend/src/common/validation/env.validation.ts
backend/src/common/middleware/request-id.middleware.ts
backend/src/database/data-source.ts
backend/src/database/migrations/README.md
backend/src/admin/dto/update-user.dto.ts
```

## 📁 FILES MODIFIED (25+)

```
backend/src/app.module.ts
backend/src/main.ts
backend/src/database/database.config.ts
backend/src/queues/queues.module.ts
backend/src/queues/queues.service.ts
backend/src/auth/auth.module.ts
backend/src/auth/auth.service.ts
backend/src/auth/strategies/jwt.strategy.ts
backend/src/notifications/notifications.module.ts
backend/src/notifications/notifications.service.ts
backend/src/notifications/notification.entity.ts
backend/src/bookings/bookings.module.ts
backend/src/bookings/bookings.service.ts
backend/src/bookings/booking.entity.ts
backend/src/analytics/analytics.module.ts
backend/src/analytics/analytics.service.ts
backend/src/media/media.module.ts
backend/src/media/media.controller.ts
backend/src/health/health.module.ts
backend/src/health/health.controller.ts
backend/src/websocket/websocket.gateway.ts
backend/src/admin/admin.controller.ts
backend/src/admin/admin.service.ts
backend/src/users/user.entity.ts
backend/src/places/place.entity.ts
backend/src/posts/post.entity.ts
backend/src/common/interceptors/logging.interceptor.ts
backend/src/common/filters/http-exception.filter.ts
backend/package.json
web/src/main.ts
web/src/pages/feed.ts
web/src/react/lib/islands.tsx
web/src/react/pages/index.ts
PRODUCTION_DEPLOYMENT_CHECKLIST.md
```

---

## 🚀 QUICK START FOR NEXT SESSION

```bash
# 1. Verify everything still compiles
cd backend && npx tsc --noEmit
cd web && npx vite build

# 2. Generate initial migration (requires PostgreSQL running)
cd backend
npm run migration:generate -- src/database/migrations/InitialSchema

# 3. Test migration on fresh database
npm run migration:run

# 4. Start backend and verify queue workers
cd backend
npm run start:dev
# In another terminal:
curl http://localhost:3000/health/queues

# 5. Test email queue
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
# Check PM2 logs or console for "Password reset email sent"
```

---

## 📋 PRODUCTION DEPLOYMENT CHECKLIST

See `PRODUCTION_DEPLOYMENT_CHECKLIST.md` for full step-by-step server setup (Nginx, PostgreSQL, Redis, MinIO, Meilisearch, SSL, PM2).

**Key pre-deploy checks:**
- [ ] `JWT_SECRET` is >= 32 chars, not a default value
- [ ] `NODE_ENV=production`
- [ ] `DB_TYPE=postgres`
- [ ] `RESEND_API_KEY` and `FROM_EMAIL` are set
- [ ] Migrations generated and tested
- [ ] `ALLOWED_ORIGINS` set to production domains (no wildcards)
- [ ] Redis password set
- [ ] Meilisearch running with master key

---

*Handoff generated after comprehensive production hardening session.*
