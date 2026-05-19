# Tunisia Passport Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a public, shareable Tunisia Passport at `/#/u/:handle` that turns every user into a viral surface and a returning visitor with ego ownership over their journey.

**Architecture:** Backend adds a `handle` column to User, new public endpoints for passport assembly + OG postcard rendering (satori + resvg). Frontend adds a `/#/u/:handle` React page with hero + Tunisia map + stats + badges + tabs + share, plus a signup gate, post-signup onboarding flow, and anonymous "soft passport" carried via `localStorage`. Eight starter badges auto-award via event hooks in existing services.

**Tech Stack:** NestJS + TypeORM (Postgres, `synchronize: true` in dev), React 18 + Vite with hash routing, satori + `@resvg/resvg-js` for OG PNG, class-validator for DTOs, lucide-react for icons, no test framework currently in repo (verification = build + manual curl/UI checks).

**Polish bar:** The user's directive is "best platform and feeling" — micro-interactions, motion, postcard quality, and copy tone are first-class. Every interactive element should feel intentional. No generic AI-aesthetic gradients.

**Verification convention:** This repo has no test infra. Each task ends with build verification + (where applicable) a curl/UI check. If you want to add Jest later, do it in a separate plan — not here.

**Worktree:** Execute from main branch unless the orchestrator placed you in a worktree.

---

## File Structure

### Backend (new)

- `backend/src/users/reserved-handles.ts` — blocklist of reserved handle slugs
- `backend/src/users/dto/passport.dto.ts` — public passport response shape (also serves as type contract)
- `backend/src/users/dto/handle-check.dto.ts` — query params for availability check
- `backend/src/users/dto/seed-passport.dto.ts` — anon→user draft seeding shape
- `backend/src/badges/badges.module.ts` — wires BadgesService
- `backend/src/badges/badges.service.ts` — `awardIfEligible(userId, event, payload)` + level derivation
- `backend/src/badges/badge-definitions.ts` — single source of truth for badge ids/labels/criteria/points
- `backend/src/og/og.module.ts` — wires OgService
- `backend/src/og/og.service.ts` — satori + resvg renderer with bundled font
- `backend/src/og/fonts/Inter-Regular.ttf` — bundled font asset (downloaded as part of Task C1)
- `backend/src/og/fonts/Inter-Bold.ttf` — bold variant for name/headline

### Backend (modified)

- `backend/src/users/user.entity.ts` — add `handle` column
- `backend/src/users/users.controller.ts` — add `/handle-available`, `/by-handle/:handle`, `/by-handle/:handle/og.png`, `/me/seed`
- `backend/src/users/users.service.ts` — add `findByHandle`, `assemblePassport`, `seedFromDraft`, `isHandleAvailable`, cache helpers
- `backend/src/users/users.module.ts` — import BadgesModule + OgModule + CacheModule
- `backend/src/auth/dto/register.dto.ts` — add required `handle`
- `backend/src/auth/auth.service.ts` — validate handle uniqueness + format at register
- `backend/src/posts/posts.service.ts` — call `badgesService.awardIfEligible` after first post
- `backend/src/reviews/reviews.service.ts` — same for reviews
- `backend/src/itineraries/trips.service.ts` — same for trip plans (file exists per git status)
- `backend/src/reviews/reviews.controller.ts` — add `GET by-user/:handle` filter
- `backend/src/app.module.ts` — register BadgesModule + OgModule

### Frontend (new)

- `web/src/react/pages/PassportPage.tsx` — main passport page
- `web/src/react/components/TunisiaMap.tsx` — SVG map with lit cities
- `web/src/react/components/tunisia-cities.ts` — city coordinate data
- `web/src/react/components/BadgeGrid.tsx` — 8-slot collectible grid
- `web/src/react/components/badge-definitions.ts` — display mirror of backend definitions
- `web/src/react/components/SharePassport.tsx` — share sheet (copy + social deep links)
- `web/src/react/components/PassportPill.tsx` — anon sticky "claim your passport" CTA
- `web/src/react/components/SignupGate.tsx` — modal: email + password + handle picker
- `web/src/react/components/PassportOnboarding.tsx` — post-signup full-screen interstitial with confetti
- `web/src/react/components/PassportStats.tsx` — 4-tile stat strip
- `web/src/react/components/PassportTabs.tsx` — Trips/Reviews/Saves with lazy load
- `web/src/passport-draft.ts` — anon localStorage accumulator + seed helper
- `web/src/pages/u.ts` — vanilla entry to inject meta tags for crawlers

### Frontend (modified)

- `web/src/main.ts` — route `#/u/:handle` → mount PassportPage
- `web/src/shared/api.ts` — add `getPassport`, `checkHandle`, `seedPassport`, `getPassportOgUrl`
- `web/src/api.ts` — re-export new helpers if it acts as the public surface
- `web/src/react/pages/FeedPage.tsx` — link own avatar to `/#/u/{my-handle}`; gate "claim passport" on anon visitors
- `web/src/react/components/StoriesStrip.tsx` — wrap any author avatars in passport links if applicable
- `web/src/styles/pages.css` — passport page styles scoped under `.passport-*`

---

## Phase A — Backend foundation: handle + auth

### Task A1: Add `handle` column to User entity

**Files:**
- Modify: `backend/src/users/user.entity.ts`
- Create: `backend/src/users/reserved-handles.ts`

- [ ] **Step 1: Add the reserved-handles blocklist**

Create `backend/src/users/reserved-handles.ts`:

```ts
/** Slugs that must NEVER be claimable as a user handle.
 *  Includes routing collisions, brand/legal protected words, and abusive bait. */
export const RESERVED_HANDLES = new Set<string>([
    // routing collisions (must mirror current + planned routes)
    'admin', 'api', 'auth', 'login', 'logout', 'signup', 'register',
    'me', 'settings', 'profile', 'profile-edit', 'edit',
    'feed', 'discover', 'discover-trips', 'explore',
    'trip', 'trips', 'place', 'places', 'package', 'packages',
    'post', 'posts', 'review', 'reviews', 'comment', 'comments',
    'messages', 'inquiries', 'inquiry', 'owner', 'tag', 'saved',
    'onboarding', 'verify', 'reset', 'reset-password', 'forgot',
    'u', 'user', 'users', 'about', 'contact', 'privacy', 'terms', 'help', 'support',
    // brand / abuse
    'tunisia', 'official', 'etunisia', 'e-tunisia', 'staff', 'team', 'mod', 'moderator',
    'root', 'system', 'null', 'undefined', 'anonymous', 'anon',
]);

export const HANDLE_PATTERN = /^[a-z][a-z0-9_]{2,29}$/;

export function isHandleFormatValid(h: string): boolean {
    return typeof h === 'string' && HANDLE_PATTERN.test(h);
}

export function isHandleReserved(h: string): boolean {
    return RESERVED_HANDLES.has(h.toLowerCase());
}
```

- [ ] **Step 2: Add the column to the User entity**

In `backend/src/users/user.entity.ts`, add after the `email` column (line ~33):

```ts
    @Column({ length: 30, unique: true, nullable: true })
    @Index()
    handle: string | null;
```

Add `Index` to the typeorm import if not already present (it isn't — extend the existing import).

- [ ] **Step 3: Build the backend**

Run: `cd backend && npm run build`
Expected: exit 0. If errors, fix them before proceeding.

- [ ] **Step 4: Verify schema sync at boot**

Run: `cd backend && npm run start:dev` (in a separate terminal or background)
Expected: Nest boots, TypeORM logs an `ALTER TABLE users ADD ... handle` (or equivalent). Stop the server after confirming.

- [ ] **Step 5: Commit**

```bash
git add backend/src/users/user.entity.ts backend/src/users/reserved-handles.ts
git commit -m "feat(users): add handle column + reserved-handles blocklist"
```

---

### Task A2: One-shot backfill for legacy users

**Files:**
- Create: `backend/src/users/backfill-handles.ts`
- Modify: `backend/src/main.ts` (one-time guarded call)

- [ ] **Step 1: Write the backfill helper**

Create `backend/src/users/backfill-handles.ts`:

```ts
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { HANDLE_PATTERN, RESERVED_HANDLES } from './reserved-handles';

/** Generate a candidate handle from a fullName.
 *  Lowercase, ascii-only, 3-30 chars, must start with a letter. */
function candidateFromName(fullName: string): string {
    const base = (fullName || 'traveler')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^\x00-\x7f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/^[^a-z]+/, 't_'); // ensure leading letter
    let trimmed = base.slice(0, 22) || 'traveler';
    if (trimmed.length < 3) trimmed = trimmed + '_t';
    return trimmed;
}

function randomSuffix(): string {
    return Math.random().toString(36).slice(2, 6); // 4-char alphanum
}

/** Idempotent: only updates users where handle IS NULL. Logs progress. */
export async function backfillHandles(repo: Repository<User>): Promise<number> {
    const pending = await repo.createQueryBuilder('u')
        .select(['u.id', 'u.fullName'])
        .where('u.handle IS NULL')
        .getMany();
    if (!pending.length) return 0;

    let filled = 0;
    for (const u of pending) {
        let candidate = candidateFromName(u.fullName);
        // ensure unique + not reserved + matches pattern
        // retry up to 8 times with suffix; collisions in production unlikely at low scale
        for (let i = 0; i < 8; i++) {
            const final = candidate;
            if (HANDLE_PATTERN.test(final) && !RESERVED_HANDLES.has(final)) {
                const clash = await repo.findOne({ where: { handle: final } });
                if (!clash) {
                    await repo.update(u.id, { handle: final });
                    filled++;
                    break;
                }
            }
            candidate = candidateFromName(u.fullName) + '_' + randomSuffix();
        }
    }
    return filled;
}
```

- [ ] **Step 2: Wire a guarded boot-time call**

In `backend/src/main.ts`, locate the `bootstrap()` function. After `app.listen(...)` succeeds, add:

```ts
    // One-shot handle backfill (idempotent — safe to leave in place; runs <50ms on empty result).
    try {
        const { DataSource } = await import('typeorm');
        const ds = app.get(DataSource);
        const { backfillHandles } = await import('./users/backfill-handles');
        const { User } = await import('./users/user.entity');
        const n = await backfillHandles(ds.getRepository(User));
        if (n > 0) console.log(`[backfill] assigned handle to ${n} legacy users`);
    } catch (e) {
        console.warn('[backfill] handle backfill skipped:', (e as Error).message);
    }
```

- [ ] **Step 3: Build + boot once**

Run: `cd backend && npm run build && npm run start:dev`
Expected: server boots. Log line `[backfill] assigned handle to N legacy users` (or no log if zero pending). Stop server.

- [ ] **Step 4: Verify via psql/equivalent**

If you have DB access, run `SELECT id, "fullName", handle FROM users LIMIT 10;` — expect every row to have a handle.

If no direct DB access, hit `GET http://localhost:3000/api/v1/users/<known-id>` and confirm response contains a `handle` (will require a small read-side change in next task; defer if not yet wired).

- [ ] **Step 5: Commit**

```bash
git add backend/src/users/backfill-handles.ts backend/src/main.ts
git commit -m "feat(users): one-shot handle backfill for legacy rows"
```

---

### Task A3: Require + validate handle at signup

**Files:**
- Modify: `backend/src/auth/dto/register.dto.ts`
- Modify: `backend/src/auth/auth.service.ts`
- Modify: `backend/src/users/users.service.ts`

- [ ] **Step 1: Extend RegisterDto**

Replace the contents of `backend/src/auth/dto/register.dto.ts`:

```ts
import { IsEmail, IsString, MinLength, IsOptional, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'Ahmed Ben Ali' })
    @IsString()
    fullName: string;

    @ApiProperty({ example: 'ahmed@email.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'ahmed_t', description: 'Public handle, 3-30 chars, [a-z0-9_], must start with a letter' })
    @IsString()
    @MinLength(3)
    @MaxLength(30)
    @Matches(/^[a-z][a-z0-9_]{2,29}$/)
    handle: string;

    @ApiProperty({ example: 'Tunisia', required: false })
    @IsOptional()
    @IsString()
    country?: string;

    @ApiProperty({ example: '+216 12 345 678', required: false })
    @IsOptional()
    @IsString()
    phone?: string;
}
```

- [ ] **Step 2: Add `findByHandle` + `isHandleAvailable` to UsersService**

In `backend/src/users/users.service.ts`, add after `findByEmail` (~line 14):

```ts
    async findByHandle(handle: string): Promise<User | null> {
        if (!handle) return null;
        return this.usersRepository.findOne({ where: { handle: handle.toLowerCase() } });
    }

    async isHandleAvailable(handle: string): Promise<boolean> {
        const h = (handle || '').toLowerCase();
        const { isHandleFormatValid, isHandleReserved } = await import('./reserved-handles');
        if (!isHandleFormatValid(h)) return false;
        if (isHandleReserved(h)) return false;
        const existing = await this.usersRepository.findOne({ where: { handle: h } });
        return !existing;
    }
```

- [ ] **Step 3: Reject reserved/colliding handles at register**

Replace the `register` method body in `backend/src/auth/auth.service.ts`:

```ts
    async register(dto: RegisterDto) {
        const existingEmail = await this.usersService.findByEmail(dto.email);
        if (existingEmail) {
            throw new ConflictException('Email already registered');
        }

        const handleLower = (dto.handle || '').toLowerCase();
        const available = await this.usersService.isHandleAvailable(handleLower);
        if (!available) {
            throw new ConflictException('Handle is unavailable');
        }

        const user = await this.usersService.create({ ...dto, handle: handleLower });
        const token = this.generateToken(user);

        return {
            user: {
                id: user.id,
                fullName: user.fullName,
                handle: user.handle,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
            },
            accessToken: token,
        };
    }
```

- [ ] **Step 4: Build**

Run: `cd backend && npm run build`
Expected: exit 0.

- [ ] **Step 5: Smoke-test registration**

Boot the server (`npm run start:dev`), then hit:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Test User","email":"test_' + Date.now() + '@example.com","password":"password123","handle":"testhandle_' + Date.now().toString(36) + '"}'
```

(Use a unique handle each time.) Expected: 201 with `user.handle` set. Try again with the same handle → 409 `Handle is unavailable`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/auth/dto/register.dto.ts backend/src/auth/auth.service.ts backend/src/users/users.service.ts
git commit -m "feat(auth): require + validate handle at signup (uniqueness, reserved, format)"
```

---

### Task A4: Public handle-availability endpoint (debounced from frontend)

**Files:**
- Modify: `backend/src/users/users.controller.ts`

- [ ] **Step 1: Add the endpoint**

In `backend/src/users/users.controller.ts`, add inside the controller class (e.g. after `getProfile`):

```ts
    /** Public: live availability check used by the signup form. Rate-limited via global throttler. */
    @Get('handle-available')
    async handleAvailable(@Query('h') h: string): Promise<{ available: boolean; reason?: string }> {
        const { isHandleFormatValid, isHandleReserved } = await import('./reserved-handles');
        const handle = (h || '').toLowerCase().trim();
        if (!handle) return { available: false, reason: 'empty' };
        if (!isHandleFormatValid(handle)) return { available: false, reason: 'format' };
        if (isHandleReserved(handle)) return { available: false, reason: 'reserved' };
        const ok = await this.usersService.isHandleAvailable(handle);
        return { available: ok, reason: ok ? undefined : 'taken' };
    }
```

Note: place this BEFORE the `Get(':id')` route, otherwise NestJS will treat `handle-available` as an `id` param.

- [ ] **Step 2: Build + smoke-test**

```bash
cd backend && npm run build && npm run start:dev
# in another shell:
curl 'http://localhost:3000/api/v1/users/handle-available?h=admin'
# expect: {"available":false,"reason":"reserved"}
curl 'http://localhost:3000/api/v1/users/handle-available?h=zz_unique_99'
# expect: {"available":true}
curl 'http://localhost:3000/api/v1/users/handle-available?h=AB'
# expect: {"available":false,"reason":"format"}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/users/users.controller.ts
git commit -m "feat(users): public handle-availability endpoint"
```

---

## Phase B — Backend: public passport endpoint

### Task B1: Passport DTO + `findByHandle` controller route

**Files:**
- Create: `backend/src/users/dto/passport.dto.ts`
- Modify: `backend/src/users/users.controller.ts`

- [ ] **Step 1: Define the DTO**

Create `backend/src/users/dto/passport.dto.ts`:

```ts
export type PassportLevel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface PassportStats {
    citiesVisited: number;
    tripsPlanned: number;
    reviewsCount: number;
    savesCount: number;
}

export interface PassportDto {
    handle: string;
    fullName: string;
    avatar: string | null;
    country: string | null;
    bio: string | null;
    website: string | null;
    interests: string[];
    badges: string[];
    points: number;
    passportLevel: PassportLevel;
    role: 'user' | 'creator' | 'admin';
    joinedAt: string;          // ISO
    stats: PassportStats;
    visitedCities: string[];   // deduped city names
}

export function deriveLevel(points: number): PassportLevel {
    if (points >= 2000) return 'Platinum';
    if (points >= 500) return 'Gold';
    if (points >= 100) return 'Silver';
    return 'Bronze';
}
```

- [ ] **Step 2: Add the public route**

In `backend/src/users/users.controller.ts`, add BEFORE the `@Get(':id')` route:

```ts
    @Get('by-handle/:handle')
    async byHandle(@Param('handle') rawHandle: string) {
        const handle = (rawHandle || '').toLowerCase();
        const passport = await this.usersService.assemblePassport(handle).catch(() => null);
        if (!passport) {
            // Friendly 404 — frontend uses this to offer the handle in signup.
            return { error: 'passport_not_found', handle };
        }
        return passport;
    }
```

- [ ] **Step 3: Build (compile only — service method comes in B2)**

`assemblePassport` doesn't exist yet — the next task adds it. This step exists only to keep the controller route ready. Build will fail at this point until B2 completes; that's expected.

- [ ] **Step 4: Commit**

```bash
git add backend/src/users/dto/passport.dto.ts backend/src/users/users.controller.ts
git commit -m "feat(users): passport DTO + by-handle route (stub)"
```

---

### Task B2: Assemble passport in UsersService

**Files:**
- Modify: `backend/src/users/users.service.ts`

- [ ] **Step 1: Inject the auxiliary repositories**

This step requires reading the Review, TripPlan, Post (saves), and Place repositories from inside UsersService. Update the constructor and imports:

In `backend/src/users/users.service.ts`, replace the import block at top with:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { Review } from '../reviews/review.entity';
import { Place } from '../places/place.entity';
import { TripPlan } from '../itineraries/trip-plan.entity';
import { SavedPost } from '../posts/saved-post.entity';
import { PassportDto, deriveLevel } from './dto/passport.dto';
```

(If `Place` entity path differs, check `backend/src/places/` and update. If `SavedPost` doesn't yet have a corresponding repository registered, see Step 3.)

Replace the constructor:

```ts
    constructor(
        @InjectRepository(User) private usersRepository: Repository<User>,
        @InjectRepository(Review) private reviewsRepo: Repository<Review>,
        @InjectRepository(Place) private placesRepo: Repository<Place>,
        @InjectRepository(TripPlan) private tripsRepo: Repository<TripPlan>,
        @InjectRepository(SavedPost) private savesRepo: Repository<SavedPost>,
    ) { }
```

- [ ] **Step 2: Add `assemblePassport`**

Append to UsersService (before the closing brace):

```ts
    /** Public passport view. Excludes sensitive fields. Throws NotFound if handle missing. */
    async assemblePassport(handle: string): Promise<PassportDto> {
        const user = await this.findByHandle(handle);
        if (!user) throw new NotFoundException('Passport not found');

        const visitedIds = Array.isArray(user.visitedPlaceIds) ? user.visitedPlaceIds : [];

        const [reviewsCount, tripsPlanned, savesCount, visitedCities] = await Promise.all([
            this.reviewsRepo.count({ where: { user: { id: user.id } } as any }).catch(() => 0),
            this.tripsRepo.count({ where: { userId: user.id } }).catch(() => 0),
            this.savesRepo.count({ where: { userId: user.id } as any }).catch(() => 0),
            visitedIds.length
                ? this.placesRepo
                    .createQueryBuilder('p')
                    .select('DISTINCT p.city', 'city')
                    .where('p.id IN (:...ids)', { ids: visitedIds })
                    .getRawMany()
                    .then((rows) => rows.map((r) => r.city).filter(Boolean))
                    .catch(() => [])
                : Promise.resolve([] as string[]),
        ]);

        return {
            handle: user.handle as string,
            fullName: user.fullName,
            avatar: user.avatar || null,
            country: user.country || null,
            bio: user.bio || null,
            website: user.website || null,
            interests: Array.isArray(user.interests) ? user.interests : [],
            badges: Array.isArray(user.badges) ? user.badges : [],
            points: user.points || 0,
            passportLevel: deriveLevel(user.points || 0),
            role: user.role as any,
            joinedAt: user.createdAt.toISOString(),
            stats: {
                citiesVisited: visitedCities.length,
                tripsPlanned,
                reviewsCount,
                savesCount,
            },
            visitedCities,
        };
    }
```

- [ ] **Step 3: Register the extra repositories in UsersModule**

Open `backend/src/users/users.module.ts`. If the `TypeOrmModule.forFeature([...])` array currently only contains `User`, extend it:

```ts
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Review } from '../reviews/review.entity';
import { Place } from '../places/place.entity';
import { TripPlan } from '../itineraries/trip-plan.entity';
import { SavedPost } from '../posts/saved-post.entity';

// ...
TypeOrmModule.forFeature([User, Review, Place, TripPlan, SavedPost]),
```

If any entity import path differs, fix it. If `SavedPost` is not yet wired up at all (the file exists per git status but may not be registered globally), it's still valid to import inside this module — TypeORM handles per-module feature registration.

- [ ] **Step 4: Build**

Run: `cd backend && npm run build`
Expected: exit 0. If a column name on a related entity differs from what I assumed (e.g. saves use `userId` vs `user.id`), the build will pass but runtime queries fail. Fix column references against the actual entity definitions before moving on.

- [ ] **Step 5: Smoke-test**

Boot server, hit:

```bash
curl http://localhost:3000/api/v1/users/by-handle/<a-real-handle>
```

Expected: JSON matching PassportDto shape, no `email`/`password`/`phone` in the response. If you see those, fix the DTO mapping — they MUST NOT leak.

```bash
curl http://localhost:3000/api/v1/users/by-handle/does_not_exist
# expect: {"error":"passport_not_found","handle":"does_not_exist"}
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/users/users.service.ts backend/src/users/users.module.ts
git commit -m "feat(users): assemble public passport with stats + visited cities"
```

---

### Task B3: Cache the passport assembly (5 min TTL)

**Files:**
- Modify: `backend/src/users/users.service.ts`
- Modify: `backend/src/users/users.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Add Nest cache module**

Run: `cd backend && npm install @nestjs/cache-manager cache-manager@5`

Open `backend/src/app.module.ts` and add to imports array:

```ts
import { CacheModule } from '@nestjs/cache-manager';

// ...
CacheModule.register({ isGlobal: true, ttl: 300_000 /* ms */ }),
```

- [ ] **Step 2: Use cache in UsersService**

Replace `assemblePassport` to wrap with cache:

```ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
```

Extend constructor with `@Inject(CACHE_MANAGER) private cache: Cache`.

Modify `assemblePassport`:

```ts
    async assemblePassport(handle: string): Promise<PassportDto> {
        const key = `passport:${handle}`;
        const cached = await this.cache.get<PassportDto>(key);
        if (cached) return cached;

        const user = await this.findByHandle(handle);
        if (!user) throw new NotFoundException('Passport not found');
        // ...existing assembly logic unchanged...
        const passport: PassportDto = { /* ... */ };

        await this.cache.set(key, passport, 300_000);
        return passport;
    }

    /** Call this whenever a user's data, reviews, trips, or saves change. */
    async invalidatePassportCache(userId: string): Promise<void> {
        const user = await this.usersRepository.findOne({ where: { id: userId }, select: ['handle'] });
        if (user?.handle) await this.cache.del(`passport:${user.handle}`);
    }
```

- [ ] **Step 3: Wire invalidation at write sites**

For each of these services, after a write to user's reviews / trips / saves / user-itself, call `usersService.invalidatePassportCache(userId)`:

- `backend/src/users/users.service.ts` — at the end of `update`, `toggleFavorite`, `toggleVisited`: `await this.invalidatePassportCache(id)` (or `userId`).
- `backend/src/reviews/reviews.service.ts` — after `create` / `delete`: inject `UsersService` and call invalidate.
- `backend/src/itineraries/trips.service.ts` — after `create` / `update` / `delete`.
- `backend/src/posts/posts.service.ts` — after `save` / `unsave` actions.

For now, only wire invalidation in `users.service.ts` (own writes). Cross-service invalidation can be a follow-up if the 5-min staleness becomes a problem — it's acceptable for v1.

- [ ] **Step 4: Build + verify**

`cd backend && npm run build` → exit 0. Boot, hit `by-handle` twice in quick succession, second response should be near-instant (cached).

- [ ] **Step 5: Commit**

```bash
git add backend/src/users backend/src/app.module.ts backend/package*.json
git commit -m "feat(users): cache passport assembly (5min TTL, self-write invalidation)"
```

---

### Task B4: User-scoped trips/reviews/saves listing endpoints

**Files:**
- Modify: `backend/src/itineraries/trips.controller.ts`
- Modify: `backend/src/itineraries/trips.service.ts`
- Modify: `backend/src/reviews/reviews.controller.ts`
- Modify: `backend/src/reviews/reviews.service.ts`
- Modify: `backend/src/posts/posts.controller.ts` (or `saves` if separated)

- [ ] **Step 1: Trips by handle**

In `backend/src/itineraries/trips.controller.ts`, add:

```ts
    @Get('by-handle/:handle')
    async byHandle(@Param('handle') handle: string) {
        return this.tripsService.listByHandle(handle.toLowerCase());
    }
```

In `backend/src/itineraries/trips.service.ts`, add:

```ts
    async listByHandle(handle: string) {
        // Resolve user by handle once (cheap join would be nicer but keep service decoupled).
        const user = await this.usersService.findByHandle(handle);
        if (!user) return [];
        return this.tripsRepo.find({
            where: { userId: user.id, isPublic: true },
            order: { updatedAt: 'DESC' },
            take: 50,
        });
    }
```

Make sure `UsersService` is in the constructor; if `ItinerariesModule` doesn't import `UsersModule` yet, add it.

- [ ] **Step 2: Reviews by handle**

In `backend/src/reviews/reviews.controller.ts`:

```ts
    @Get('by-handle/:handle')
    async byHandle(@Param('handle') handle: string) {
        return this.reviewsService.listByHandle(handle.toLowerCase());
    }
```

In `backend/src/reviews/reviews.service.ts`:

```ts
    async listByHandle(handle: string) {
        const user = await this.usersService.findByHandle(handle);
        if (!user) return [];
        return this.reviewsRepo.find({
            where: { user: { id: user.id } } as any,
            order: { createdAt: 'DESC' },
            relations: ['place'],
            take: 50,
        });
    }
```

- [ ] **Step 3: Saves by handle**

Inspect `backend/src/posts/saved-post.entity.ts` and the existing saves controller (likely `posts.controller.ts`). Add the parallel route returning saved posts/places for the handle owner. Mirror the structure of the two above.

If saves are intentionally private, gate this endpoint with `@UseGuards(OptionalJwtAuthGuard)` and only return when the requester is the owner OR a feature flag is on. For v1 spec we agreed: public by default — open route is fine.

- [ ] **Step 4: Build + smoke-test**

```bash
cd backend && npm run build && npm run start:dev
curl http://localhost:3000/api/v1/trips/by-handle/<real-handle>
curl http://localhost:3000/api/v1/reviews/by-handle/<real-handle>
```

Expected: arrays (possibly empty).

- [ ] **Step 5: Commit**

```bash
git add backend/src
git commit -m "feat(users): trips/reviews/saves listing endpoints by handle"
```

---

## Phase C — OG postcard rendering

### Task C1: Install satori + resvg + bundle fonts

**Files:**
- Modify: `backend/package.json`
- Create: `backend/src/og/fonts/Inter-Regular.ttf`
- Create: `backend/src/og/fonts/Inter-Bold.ttf`
- Modify: `backend/nest-cli.json` (asset copy for fonts)

- [ ] **Step 1: Install deps**

```bash
cd backend && npm install satori @resvg/resvg-js
```

- [ ] **Step 2: Download Inter fonts**

Download these into `backend/src/og/fonts/`:
- `Inter-Regular.ttf` — `https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.woff2` (download the TTF from the GitHub releases page instead — the woff2 link is for reference; satori needs TTF). The Inter repo releases ship a `.zip` with TTFs.

If the engineer can't get TTFs from the project's allowed network, fall back to using `Roboto-Regular.ttf` / `Roboto-Bold.ttf` from `https://fonts.google.com/specimen/Roboto` (download static, regular + bold). Update the OgService font names accordingly.

- [ ] **Step 3: Ensure fonts ship with the build**

In `backend/nest-cli.json`, add (or extend) the `assets` array under `compilerOptions`:

```json
{
  "compilerOptions": {
    "assets": [
      { "include": "og/fonts/**/*", "outDir": "dist" }
    ],
    "watchAssets": true
  }
}
```

(Merge with existing `assets` entries — do NOT overwrite them.)

- [ ] **Step 4: Verify**

`cd backend && npm run build && ls dist/og/fonts/`
Expected: both TTF files in the `dist` output.

- [ ] **Step 5: Commit**

```bash
git add backend/package*.json backend/nest-cli.json "backend/src/og/fonts/*.ttf"
git commit -m "chore(og): install satori + resvg, bundle Inter fonts"
```

---

### Task C2: OG service

**Files:**
- Create: `backend/src/og/og.service.ts`
- Create: `backend/src/og/og.module.ts`

- [ ] **Step 1: Implement the renderer**

Create `backend/src/og/og.service.ts`:

```ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { PassportDto } from '../users/dto/passport.dto';

@Injectable()
export class OgService implements OnModuleInit {
    private regularFont!: Buffer;
    private boldFont!: Buffer;

    async onModuleInit() {
        const dir = path.join(__dirname, 'fonts');
        this.regularFont = await fs.readFile(path.join(dir, 'Inter-Regular.ttf'));
        this.boldFont = await fs.readFile(path.join(dir, 'Inter-Bold.ttf'));
    }

    async renderPassportCard(passport: PassportDto): Promise<Buffer> {
        const initials = (passport.fullName || passport.handle)
            .split(/\s+/)
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

        const cities = passport.visitedCities.slice(0, 6);
        const stats = passport.stats;

        const svg = await satori(
            {
                type: 'div',
                props: {
                    style: {
                        width: 1200,
                        height: 630,
                        display: 'flex',
                        flexDirection: 'column',
                        background:
                            'linear-gradient(135deg, #0b1e3f 0%, #1a3a73 45%, #d4623a 100%)',
                        color: '#fff',
                        padding: '64px',
                        fontFamily: 'Inter',
                        position: 'relative',
                    },
                    children: [
                        // top row: avatar + handle
                        {
                            type: 'div',
                            props: {
                                style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 24,
                                },
                                children: [
                                    passport.avatar
                                        ? {
                                            type: 'img',
                                            props: {
                                                src: passport.avatar,
                                                width: 96,
                                                height: 96,
                                                style: { borderRadius: 999, border: '4px solid rgba(255,255,255,0.4)' },
                                            },
                                        }
                                        : {
                                            type: 'div',
                                            props: {
                                                style: {
                                                    width: 96,
                                                    height: 96,
                                                    borderRadius: 999,
                                                    background: 'rgba(255,255,255,0.18)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 40,
                                                    fontWeight: 700,
                                                },
                                                children: initials,
                                            },
                                        },
                                    {
                                        type: 'div',
                                        props: {
                                            style: { display: 'flex', flexDirection: 'column' },
                                            children: [
                                                {
                                                    type: 'div',
                                                    props: {
                                                        style: { fontSize: 24, opacity: 0.75 },
                                                        children: `@${passport.handle}`,
                                                    },
                                                },
                                                {
                                                    type: 'div',
                                                    props: {
                                                        style: { fontSize: 56, fontWeight: 700, marginTop: 4 },
                                                        children: passport.fullName,
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                        // headline
                        {
                            type: 'div',
                            props: {
                                style: { marginTop: 36, fontSize: 30, opacity: 0.9 },
                                children: `🇹🇳  Tunisia Passport  ·  ${passport.passportLevel}`,
                            },
                        },
                        // stats row
                        {
                            type: 'div',
                            props: {
                                style: { display: 'flex', gap: 32, marginTop: 44 },
                                children: [
                                    statTile('🗺', stats.citiesVisited, 'cities'),
                                    statTile('🧭', stats.tripsPlanned, 'trips'),
                                    statTile('⭐', stats.reviewsCount, 'reviews'),
                                    statTile('🔖', stats.savesCount, 'saves'),
                                ],
                            },
                        },
                        // cities strip
                        cities.length
                            ? {
                                type: 'div',
                                props: {
                                    style: { marginTop: 36, fontSize: 24, opacity: 0.85 },
                                    children: cities.join('  ·  '),
                                },
                            }
                            : null,
                        // bottom-right brand
                        {
                            type: 'div',
                            props: {
                                style: {
                                    position: 'absolute',
                                    bottom: 32,
                                    right: 48,
                                    fontSize: 22,
                                    opacity: 0.7,
                                },
                                children: `e-tunisia.com/u/${passport.handle}`,
                            },
                        },
                    ].filter(Boolean) as any,
                },
            } as any,
            {
                width: 1200,
                height: 630,
                fonts: [
                    { name: 'Inter', data: this.regularFont, weight: 400, style: 'normal' },
                    { name: 'Inter', data: this.boldFont, weight: 700, style: 'normal' },
                ],
            },
        );

        const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
        return Buffer.from(png);
    }
}

function statTile(emoji: string, n: number, label: string) {
    return {
        type: 'div',
        props: {
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.10)',
                borderRadius: 24,
                padding: '20px 32px',
                minWidth: 180,
            },
            children: [
                { type: 'div', props: { style: { fontSize: 30 }, children: emoji } },
                {
                    type: 'div',
                    props: {
                        style: { fontSize: 56, fontWeight: 700, lineHeight: 1.0, marginTop: 4 },
                        children: String(n),
                    },
                },
                {
                    type: 'div',
                    props: { style: { fontSize: 20, opacity: 0.8, marginTop: 6 }, children: label },
                },
            ],
        },
    };
}
```

- [ ] **Step 2: Module**

Create `backend/src/og/og.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { OgService } from './og.service';

@Module({
    providers: [OgService],
    exports: [OgService],
})
export class OgModule {}
```

Register in `backend/src/app.module.ts` imports array:

```ts
import { OgModule } from './og/og.module';
// ...
OgModule,
```

Import `OgModule` in `backend/src/users/users.module.ts` so the controller can use it (next task).

- [ ] **Step 3: Build**

`cd backend && npm run build` → exit 0.

- [ ] **Step 4: Commit**

```bash
git add backend/src/og backend/src/app.module.ts backend/src/users/users.module.ts
git commit -m "feat(og): satori+resvg passport postcard renderer"
```

---

### Task C3: OG endpoint + caching headers

**Files:**
- Modify: `backend/src/users/users.controller.ts`
- Modify: `backend/src/users/users.module.ts`

- [ ] **Step 1: Endpoint**

In `backend/src/users/users.controller.ts`, inject `OgService` and add:

```ts
import { Header, Res } from '@nestjs/common';
import type { Response } from 'express';
import { OgService } from '../og/og.service';

// constructor
constructor(
    private usersService: UsersService,
    private ogService: OgService,
) {}

// route — BEFORE @Get(':id')
@Get('by-handle/:handle/og.png')
@Header('Content-Type', 'image/png')
@Header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
async ogImage(@Param('handle') rawHandle: string, @Res() res: Response) {
    const handle = (rawHandle || '').toLowerCase();
    try {
        const passport = await this.usersService.assemblePassport(handle);
        const png = await this.ogService.renderPassportCard(passport);
        res.send(png);
    } catch (err) {
        // Fallback default image. Ship a static asset if available; otherwise return 1×1 transparent png.
        const transparent = Buffer.from(
            '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000000000200015c34a40d0000000049454e44ae426082',
            'hex',
        );
        res.send(transparent);
    }
}
```

- [ ] **Step 2: Build + verify**

`cd backend && npm run build && npm run start:dev`

```bash
curl -I http://localhost:3000/api/v1/users/by-handle/<handle>/og.png
# expect: 200, Content-Type: image/png, Cache-Control header
curl http://localhost:3000/api/v1/users/by-handle/<handle>/og.png --output /tmp/og.png
file /tmp/og.png   # → PNG image, 1200 x 630
```

Open the PNG in an image viewer. It should look like a postcard, not garbage. If text doesn't render, the font wasn't loaded — verify `dist/og/fonts/` exists.

- [ ] **Step 3: Commit**

```bash
git add backend/src/users
git commit -m "feat(og): GET /users/by-handle/:handle/og.png with 24h cache"
```

---

## Phase D — Badges

### Task D1: Badge definitions (shared shape, mirrored)

**Files:**
- Create: `backend/src/badges/badge-definitions.ts`
- Create: `web/src/react/components/badge-definitions.ts`

- [ ] **Step 1: Backend definitions**

Create `backend/src/badges/badge-definitions.ts`:

```ts
export type BadgeEvent =
    | 'user.created'
    | 'place.visited'
    | 'trip.created'
    | 'review.created'
    | 'post.saved';

export interface BadgeDefinition {
    id: string;
    label: string;
    description: string;
    points: number;
    /** Returns true when this event payload satisfies the badge (and user doesn't already have it). */
    eligible: (event: BadgeEvent, payload: any, currentBadges: string[]) => boolean;
}

const has = (b: string, current: string[]) => current.includes(b);

const DESERT_CITIES = new Set(['Tozeur', 'Matmata', 'Douz', 'Tataouine']);
const BEACH_CITIES = new Set(['Hammamet', 'Djerba', 'Sidi Bou Said', 'Sousse']);
const MEDINA_CITIES = new Set(['Tunis', 'Sousse', 'Kairouan', 'Sfax']);

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
    {
        id: 'new_explorer',
        label: 'New Explorer',
        description: 'Welcome to Tunisia.',
        points: 5,
        eligible: (e, _, c) => e === 'user.created' && !has('new_explorer', c),
    },
    {
        id: 'first_steps',
        label: 'First Steps',
        description: 'Marked your first place visited.',
        points: 10,
        eligible: (e, _, c) => e === 'place.visited' && !has('first_steps', c),
    },
    {
        id: 'trip_planner',
        label: 'Trip Planner',
        description: 'Created your first trip plan.',
        points: 15,
        eligible: (e, _, c) => e === 'trip.created' && !has('trip_planner', c),
    },
    {
        id: 'reviewer',
        label: 'Reviewer',
        description: 'Left your first review.',
        points: 10,
        eligible: (e, _, c) => e === 'review.created' && !has('reviewer', c),
    },
    {
        id: 'saver',
        label: 'Saver',
        description: 'Saved your first place or post.',
        points: 5,
        eligible: (e, _, c) => e === 'post.saved' && !has('saver', c),
    },
    {
        id: 'medina_walker',
        label: 'Medina Walker',
        description: 'Visited a medina city.',
        points: 20,
        eligible: (e, p, c) =>
            e === 'place.visited' &&
            !has('medina_walker', c) &&
            !!p?.city &&
            MEDINA_CITIES.has(p.city),
    },
    {
        id: 'desert_explorer',
        label: 'Desert Explorer',
        description: 'Reached the Tunisian Sahara.',
        points: 25,
        eligible: (e, p, c) =>
            e === 'place.visited' &&
            !has('desert_explorer', c) &&
            !!p?.city &&
            DESERT_CITIES.has(p.city),
    },
    {
        id: 'beach_lover',
        label: 'Beach Lover',
        description: 'Toes on the Mediterranean.',
        points: 15,
        eligible: (e, p, c) =>
            e === 'place.visited' &&
            !has('beach_lover', c) &&
            !!p?.city &&
            BEACH_CITIES.has(p.city),
    },
];
```

- [ ] **Step 2: Frontend display mirror**

Create `web/src/react/components/badge-definitions.ts`:

```ts
export interface BadgeDisplay {
    id: string;
    label: string;
    description: string;
    emoji: string;
    accent: string; // CSS color
}

export const BADGES: Record<string, BadgeDisplay> = {
    new_explorer:    { id: 'new_explorer',    label: 'New Explorer',    description: 'Welcome to Tunisia.',          emoji: '🌟', accent: '#f4c542' },
    first_steps:     { id: 'first_steps',     label: 'First Steps',     description: 'Marked your first place visited.', emoji: '👣', accent: '#79c0ff' },
    trip_planner:    { id: 'trip_planner',    label: 'Trip Planner',    description: 'Created your first trip plan.', emoji: '🧭', accent: '#a371f7' },
    reviewer:        { id: 'reviewer',        label: 'Reviewer',        description: 'Left your first review.',      emoji: '⭐', accent: '#ffd166' },
    saver:           { id: 'saver',           label: 'Saver',           description: 'Saved your first place or post.', emoji: '🔖', accent: '#56d364' },
    medina_walker:   { id: 'medina_walker',   label: 'Medina Walker',   description: 'Visited a medina city.',        emoji: '🕌', accent: '#e4b07e' },
    desert_explorer: { id: 'desert_explorer', label: 'Desert Explorer', description: 'Reached the Tunisian Sahara.',  emoji: '🐪', accent: '#d4623a' },
    beach_lover:     { id: 'beach_lover',     label: 'Beach Lover',     description: 'Toes on the Mediterranean.',    emoji: '🏖', accent: '#56cfe1' },
};

export const BADGE_DISPLAY_ORDER = [
    'new_explorer', 'first_steps', 'trip_planner', 'reviewer',
    'saver', 'medina_walker', 'desert_explorer', 'beach_lover',
];
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/badges/badge-definitions.ts web/src/react/components/badge-definitions.ts
git commit -m "feat(badges): definitions + frontend display mirror (8 starter badges)"
```

---

### Task D2: BadgesService + event hooks

**Files:**
- Create: `backend/src/badges/badges.service.ts`
- Create: `backend/src/badges/badges.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Service**

Create `backend/src/badges/badges.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { BADGE_DEFINITIONS, BadgeEvent } from './badge-definitions';

@Injectable()
export class BadgesService {
    constructor(
        @InjectRepository(User) private usersRepo: Repository<User>,
    ) {}

    /** Award any eligible badges for this event. Idempotent. Returns the list of newly-awarded badge ids. */
    async awardIfEligible(userId: string, event: BadgeEvent, payload: any = {}): Promise<string[]> {
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user) return [];

        const current = Array.isArray(user.badges) ? user.badges : [];
        const awarded: string[] = [];
        let extraPoints = 0;

        for (const def of BADGE_DEFINITIONS) {
            if (def.eligible(event, payload, current.concat(awarded))) {
                awarded.push(def.id);
                extraPoints += def.points;
            }
        }

        if (awarded.length === 0) return [];

        user.badges = current.concat(awarded);
        user.points = (user.points || 0) + extraPoints;
        await this.usersRepo.save(user);
        return awarded;
    }
}
```

- [ ] **Step 2: Module**

Create `backend/src/badges/badges.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { BadgesService } from './badges.service';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    providers: [BadgesService],
    exports: [BadgesService],
})
export class BadgesModule {}
```

Register in `backend/src/app.module.ts`:

```ts
import { BadgesModule } from './badges/badges.module';
// ...
BadgesModule,
```

- [ ] **Step 3: Wire hooks at write sites**

For each event source, inject `BadgesService` and call `awardIfEligible` after the successful write. Each is one extra line.

**In `backend/src/auth/auth.service.ts`** — at the end of `register`, BEFORE returning:

```ts
await this.badgesService.awardIfEligible(user.id, 'user.created', {});
```

Add `BadgesService` to constructor + import `BadgesModule` in `AuthModule`.

**In `backend/src/users/users.service.ts`** — at the end of `toggleVisited`, after save, when the place is being ADDED (not removed):

```ts
if (index === -1) {
    const place = await this.placesRepo.findOne({ where: { id: placeId } });
    await this.badgesService.awardIfEligible(userId, 'place.visited', { city: place?.city });
}
```

Add `BadgesService` to constructor + import `BadgesModule` in `UsersModule`.

**In `backend/src/itineraries/trips.service.ts`** — at the end of trip creation:

```ts
await this.badgesService.awardIfEligible(userId, 'trip.created', {});
```

**In `backend/src/reviews/reviews.service.ts`** — at the end of review creation:

```ts
await this.badgesService.awardIfEligible(userId, 'review.created', {});
```

**In `backend/src/posts/posts.service.ts`** — at the end of the save-post action:

```ts
await this.badgesService.awardIfEligible(userId, 'post.saved', {});
```

- [ ] **Step 4: Build + smoke-test**

`cd backend && npm run build`. Register a new user → confirm `user.badges` contains `new_explorer` and `points` ≥ 5.

- [ ] **Step 5: Commit**

```bash
git add backend/src
git commit -m "feat(badges): service + auto-award hooks across users/auth/trips/reviews/posts"
```

---

## Phase E — Frontend passport page

### Task E1: API client helpers

**Files:**
- Modify: `web/src/shared/api.ts`

- [ ] **Step 1: Add helpers**

In `web/src/shared/api.ts`, add to the exported `api` object (location: near `getTripsDiscover`):

```ts
    // Passport
    getPassport: (handle: string) =>
        fetchWithAuth(`/api/v1/users/by-handle/${encodeURIComponent(handle)}`),
    checkHandle: (h: string) =>
        fetchWithAuth(`/api/v1/users/handle-available?h=${encodeURIComponent(h)}`),
    getPassportOgUrl: (handle: string, version?: string | number) =>
        `${(globalThis as any).API_BASE || ''}/api/v1/users/by-handle/${encodeURIComponent(handle)}/og.png` +
        (version ? `?v=${encodeURIComponent(String(version))}` : ''),
    seedPassport: (draft: { visitedCities?: string[]; interests?: string[] }) =>
        fetchWithAuth('/api/v1/users/me/seed', { method: 'POST', body: JSON.stringify(draft) }),
    getTripsByHandle: (handle: string) =>
        fetchWithAuth(`/api/v1/trips/by-handle/${encodeURIComponent(handle)}`),
    getReviewsByHandle: (handle: string) =>
        fetchWithAuth(`/api/v1/reviews/by-handle/${encodeURIComponent(handle)}`),
```

(If the API base path differs — e.g. proxy strips `/api/v1` — match the existing pattern at the top of the file.)

- [ ] **Step 2: Build**

`cd web && npm run build` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add web/src/shared/api.ts
git commit -m "feat(api): passport client helpers"
```

---

### Task E2: TunisiaMap component

**Files:**
- Create: `web/src/react/components/tunisia-cities.ts`
- Create: `web/src/react/components/TunisiaMap.tsx`

- [ ] **Step 1: City coordinates (SVG viewBox units)**

Create `web/src/react/components/tunisia-cities.ts`:

```ts
// Coordinates in the 0..100 / 0..160 viewBox of the simplified Tunisia outline.
// Approximated by hand from a Tunisia map; visual correctness > geographic precision.
export interface CityCoord { name: string; x: number; y: number; }

export const TUNISIA_CITIES: CityCoord[] = [
    { name: 'Tunis',         x: 55, y: 12 },
    { name: 'Bizerte',       x: 50, y: 6 },
    { name: 'Sidi Bou Said', x: 60, y: 11 },
    { name: 'Hammamet',      x: 62, y: 22 },
    { name: 'Sousse',        x: 60, y: 32 },
    { name: 'Mahdia',        x: 66, y: 40 },
    { name: 'Kairouan',      x: 52, y: 36 },
    { name: 'Sfax',          x: 60, y: 52 },
    { name: 'Djerba',        x: 70, y: 78 },
    { name: 'Tabarka',       x: 30, y: 12 },
    { name: 'Tozeur',        x: 28, y: 72 },
    { name: 'Matmata',       x: 50, y: 80 },
    { name: 'Tataouine',     x: 55, y: 100 },
    { name: 'Douz',          x: 38, y: 88 },
];

/** Simplified Tunisia outline path (0..100 × 0..160 viewBox). Hand-traced silhouette. */
export const TUNISIA_OUTLINE_PATH =
    'M40,2 L62,4 L70,12 L66,22 L74,32 L70,46 L66,56 L78,70 L82,84 L72,100 L62,118 L50,138 L42,150 L34,150 L24,130 L20,108 L20,82 L16,62 L20,46 L26,32 L30,18 Z';
```

- [ ] **Step 2: TunisiaMap component**

Create `web/src/react/components/TunisiaMap.tsx`:

```tsx
import React from 'react';
import { TUNISIA_CITIES, TUNISIA_OUTLINE_PATH } from './tunisia-cities';

interface Props {
    visited: string[];
    emptyCta?: { label: string; href: string };
}

export function TunisiaMap({ visited, emptyCta }: Props) {
    const visitedSet = new Set((visited || []).map((c) => c.toLowerCase()));
    const hasAny = visitedSet.size > 0;

    return (
        <div className="passport-map">
            <svg viewBox="0 0 100 160" className="passport-map-svg" role="img" aria-label="Tunisia map">
                <defs>
                    <radialGradient id="passport-map-glow" cx="50%" cy="50%" r="60%">
                        <stop offset="0%" stopColor="rgba(212, 98, 58, 0.35)" />
                        <stop offset="100%" stopColor="rgba(212, 98, 58, 0)" />
                    </radialGradient>
                </defs>
                <path d={TUNISIA_OUTLINE_PATH} className="passport-map-outline" />
                {TUNISIA_CITIES.map((c) => {
                    const isVisited = visitedSet.has(c.name.toLowerCase());
                    return (
                        <g key={c.name} className={isVisited ? 'passport-city visited' : 'passport-city'}>
                            <circle cx={c.x} cy={c.y} r={isVisited ? 2.2 : 1.4} />
                            <text x={c.x + 2.6} y={c.y + 1.2}>{c.name}</text>
                        </g>
                    );
                })}
            </svg>
            {!hasAny && emptyCta && (
                <a className="passport-map-empty" href={emptyCta.href}>
                    <span>Your map is empty.</span>
                    <strong>{emptyCta.label} →</strong>
                </a>
            )}
        </div>
    );
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/react/components/tunisia-cities.ts web/src/react/components/TunisiaMap.tsx
git commit -m "feat(passport): TunisiaMap component with lit-city overlay"
```

---

### Task E3: BadgeGrid + Stats + SharePassport components

**Files:**
- Create: `web/src/react/components/BadgeGrid.tsx`
- Create: `web/src/react/components/PassportStats.tsx`
- Create: `web/src/react/components/SharePassport.tsx`

- [ ] **Step 1: BadgeGrid**

Create `web/src/react/components/BadgeGrid.tsx`:

```tsx
import React from 'react';
import { BADGES, BADGE_DISPLAY_ORDER, BadgeDisplay } from './badge-definitions';
import { Lock } from 'lucide-react';

interface Props { earned: string[]; }

export function BadgeGrid({ earned }: Props) {
    const earnedSet = new Set(earned);
    return (
        <div className="passport-badges">
            {BADGE_DISPLAY_ORDER.map((id) => {
                const b: BadgeDisplay = BADGES[id];
                const isEarned = earnedSet.has(id);
                return (
                    <div
                        key={id}
                        className={`passport-badge ${isEarned ? 'earned' : 'locked'}`}
                        style={isEarned ? { '--badge-accent': b.accent } as React.CSSProperties : undefined}
                        title={`${b.label} — ${b.description}`}
                    >
                        <div className="passport-badge-icon">
                            {isEarned ? <span>{b.emoji}</span> : <Lock size={18} />}
                        </div>
                        <div className="passport-badge-label">{b.label}</div>
                    </div>
                );
            })}
        </div>
    );
}
```

- [ ] **Step 2: PassportStats**

Create `web/src/react/components/PassportStats.tsx`:

```tsx
import React from 'react';
import { Map, Compass, Star, Bookmark } from 'lucide-react';

interface Props {
    citiesVisited: number;
    tripsPlanned: number;
    reviewsCount: number;
    savesCount: number;
}

export function PassportStats(p: Props) {
    return (
        <div className="passport-stats">
            <div className="passport-stat"><Map size={18} /><div><strong>{p.citiesVisited}</strong><span>Cities</span></div></div>
            <div className="passport-stat"><Compass size={18} /><div><strong>{p.tripsPlanned}</strong><span>Trips</span></div></div>
            <div className="passport-stat"><Star size={18} /><div><strong>{p.reviewsCount}</strong><span>Reviews</span></div></div>
            <div className="passport-stat"><Bookmark size={18} /><div><strong>{p.savesCount}</strong><span>Saves</span></div></div>
        </div>
    );
}
```

- [ ] **Step 3: SharePassport**

Create `web/src/react/components/SharePassport.tsx`:

```tsx
import React, { useState } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';

interface Props { handle: string; fullName: string; }

export function SharePassport({ handle, fullName }: Props) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const url = `${window.location.origin}${window.location.pathname}#/u/${handle}`;
    const text = `Check out ${fullName}'s Tunisia journey 🇹🇳`;

    const copy = async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
    };

    const native = async () => {
        if ((navigator as any).share) {
            try { await (navigator as any).share({ title: text, url }); } catch {}
        } else {
            setOpen(true);
        }
    };

    return (
        <>
            <button className="passport-share" onClick={native}>
                <Share2 size={16} /> Share passport
            </button>
            {open && (
                <div className="passport-share-sheet" role="dialog">
                    <div className="passport-share-sheet-inner">
                        <button className="passport-share-close" onClick={() => setOpen(false)}><X size={18} /></button>
                        <h4>Share this passport</h4>
                        <div className="passport-share-row">
                            <code>{url}</code>
                            <button onClick={copy}>{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}</button>
                        </div>
                        <div className="passport-share-grid">
                            <a target="_blank" rel="noreferrer" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}>X / Twitter</a>
                            <a target="_blank" rel="noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}>Facebook</a>
                            <a target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`}>WhatsApp</a>
                            <a target="_blank" rel="noreferrer" href={`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`}>Email</a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
```

- [ ] **Step 4: Build**

`cd web && npm run build` → exit 0.

- [ ] **Step 5: Commit**

```bash
git add web/src/react/components/BadgeGrid.tsx web/src/react/components/PassportStats.tsx web/src/react/components/SharePassport.tsx
git commit -m "feat(passport): BadgeGrid, PassportStats, SharePassport components"
```

---

### Task E4: PassportTabs (lazy-loaded Trips / Reviews / Saves)

**Files:**
- Create: `web/src/react/components/PassportTabs.tsx`

- [ ] **Step 1: Component**

Create `web/src/react/components/PassportTabs.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { api, getImageUrl } from '../../shared/api';
import { Calendar, Users, MapPin } from 'lucide-react';

interface Props { handle: string; }

type Tab = 'trips' | 'reviews' | 'saves';

export function PassportTabs({ handle }: Props) {
    const [tab, setTab] = useState<Tab>('trips');
    const [data, setData] = useState<Record<Tab, any[] | null>>({ trips: null, reviews: null, saves: null });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (data[tab] !== null) return;
        setLoading(true);
        const fetcher =
            tab === 'trips' ? api.getTripsByHandle :
            tab === 'reviews' ? api.getReviewsByHandle :
            () => Promise.resolve([]); // saves: implement when endpoint is ready
        Promise.resolve(fetcher(handle))
            .then((res: any) => {
                const list = Array.isArray(res) ? res : (res?.data ?? []);
                setData((d) => ({ ...d, [tab]: list }));
            })
            .catch(() => setData((d) => ({ ...d, [tab]: [] })))
            .finally(() => setLoading(false));
    }, [tab, handle]);

    return (
        <div className="passport-tabs">
            <div className="passport-tabs-head" role="tablist">
                {(['trips', 'reviews', 'saves'] as Tab[]).map((t) => (
                    <button
                        key={t}
                        role="tab"
                        aria-selected={tab === t}
                        className={tab === t ? 'active' : ''}
                        onClick={() => setTab(t)}
                    >
                        {t === 'trips' ? 'Trips' : t === 'reviews' ? 'Reviews' : 'Saves'}
                    </button>
                ))}
            </div>
            <div className="passport-tabs-body">
                {loading && <div className="passport-tab-skel" />}
                {!loading && tab === 'trips' && <TripsList items={data.trips || []} />}
                {!loading && tab === 'reviews' && <ReviewsList items={data.reviews || []} />}
                {!loading && tab === 'saves' && <SavesList items={data.saves || []} />}
            </div>
        </div>
    );
}

function TripsList({ items }: { items: any[] }) {
    if (!items.length) return <Empty text="No public trips yet." />;
    return (
        <div className="passport-trip-grid">
            {items.map((t) => (
                <a key={t.slug} className="passport-trip-card" href={`#/trip/${t.slug}`}>
                    <div className="passport-trip-cover">
                        {(t.stops || []).slice(0, 3).map((s: any, i: number) => (
                            s.placeCover ? <img key={i} src={s.placeCover.startsWith('http') ? s.placeCover : getImageUrl(s.placeCover)} alt="" loading="lazy" /> : null
                        ))}
                    </div>
                    <div className="passport-trip-meta">
                        <strong>{t.title}</strong>
                        <span><Calendar size={12} /> {t.days}d · <Users size={12} /> {t.travelers}</span>
                    </div>
                </a>
            ))}
        </div>
    );
}

function ReviewsList({ items }: { items: any[] }) {
    if (!items.length) return <Empty text="No reviews yet." />;
    return (
        <ul className="passport-review-list">
            {items.map((r) => (
                <li key={r.id} className="passport-review">
                    <div className="passport-review-head">
                        {r.place?.name && <a href={`#/place/${r.place.id}`}><MapPin size={12} /> {r.place.name}</a>}
                        <span>{'★'.repeat(r.rating || 0)}</span>
                    </div>
                    <p>{r.comment || r.body}</p>
                </li>
            ))}
        </ul>
    );
}

function SavesList({ items }: { items: any[] }) {
    if (!items.length) return <Empty text="No saved places yet." />;
    return <pre className="passport-empty">{JSON.stringify(items, null, 2)}</pre>;
}

function Empty({ text }: { text: string }) {
    return <div className="passport-empty">{text}</div>;
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/react/components/PassportTabs.tsx
git commit -m "feat(passport): tabbed Trips/Reviews/Saves with lazy fetch"
```

---

### Task E5: PassportPage assembly + routing

**Files:**
- Create: `web/src/react/pages/PassportPage.tsx`
- Modify: `web/src/main.ts`

- [ ] **Step 1: PassportPage**

Create `web/src/react/pages/PassportPage.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getImageUrl } from '../../shared/api';
import { TunisiaMap } from '../components/TunisiaMap';
import { BadgeGrid } from '../components/BadgeGrid';
import { PassportStats } from '../components/PassportStats';
import { SharePassport } from '../components/SharePassport';
import { PassportTabs } from '../components/PassportTabs';
import { Pencil, Plus } from 'lucide-react';

interface Props { handle: string; currentUser?: { id: string; handle: string | null } | null; }

export function PassportPage({ handle, currentUser }: Props) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['passport', handle],
        queryFn: () => api.getPassport(handle),
        staleTime: 60_000,
    });

    const isOwner = !!currentUser && currentUser.handle === handle;
    const isAnon = !currentUser;

    if (isLoading) return <div className="passport-page passport-loading">Loading passport…</div>;

    if (error || !data || (data as any).error === 'passport_not_found') {
        return (
            <div className="passport-page passport-404">
                <h2>This passport hasn't been claimed.</h2>
                <p>The handle <code>@{handle}</code> is available.</p>
                <a className="btn primary" href={`#/signup?handle=${encodeURIComponent(handle)}`}>Claim @{handle} →</a>
            </div>
        );
    }

    const p: any = data;

    return (
        <main className="passport-page">
            <section className="passport-hero">
                <div className="passport-hero-bg" />
                <div className="passport-hero-content">
                    <div className="passport-hero-left">
                        {p.avatar
                            ? <img className="passport-avatar" src={getImageUrl(p.avatar)} alt="" />
                            : <div className="passport-avatar passport-avatar-fallback">{(p.fullName || '?').slice(0, 1)}</div>}
                        <div className="passport-hero-text">
                            <div className="passport-handle">@{p.handle}</div>
                            <h1>{p.fullName}</h1>
                            <div className="passport-meta">
                                {p.country && <span>🇹🇳 {p.country}</span>}
                                <span className={`passport-level passport-level-${p.passportLevel.toLowerCase()}`}>{p.passportLevel} Explorer</span>
                            </div>
                            {p.bio && <p className="passport-bio">{p.bio}</p>}
                        </div>
                    </div>
                    <div className="passport-hero-right">
                        {isOwner && <a className="btn ghost" href="#/profile-edit"><Pencil size={14} /> Edit</a>}
                        {!isOwner && !isAnon && (
                            <button className="btn ghost" onClick={() => alert('Following arrives in Phase 2 — coming soon.')}>
                                <Plus size={14} /> Follow
                            </button>
                        )}
                        {isAnon && (
                            <a className="btn primary" href={`#/signup?ref=${encodeURIComponent(p.handle)}`}>Claim your passport →</a>
                        )}
                        <SharePassport handle={p.handle} fullName={p.fullName} />
                    </div>
                </div>
            </section>

            <section className="passport-section">
                <PassportStats {...p.stats} />
            </section>

            <section className="passport-section">
                <h2 className="passport-section-title">Tunisia journey</h2>
                <TunisiaMap
                    visited={p.visitedCities}
                    emptyCta={isOwner ? { label: 'Start exploring', href: '#/discover' } : undefined}
                />
            </section>

            <section className="passport-section">
                <h2 className="passport-section-title">Badges</h2>
                <BadgeGrid earned={p.badges} />
            </section>

            <section className="passport-section">
                <PassportTabs handle={p.handle} />
            </section>

            {isAnon && <AnonPill handle={p.handle} />}
        </main>
    );
}

function AnonPill({ handle }: { handle: string }) {
    const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('passport-pill-dismissed') === '1');
    if (dismissed) return null;
    return (
        <div className="passport-anon-pill">
            <span>🇹🇳 <strong>Get your own Tunisia Passport.</strong> Free, takes 30 seconds.</span>
            <a className="btn primary sm" href={`#/signup?ref=${encodeURIComponent(handle)}`}>Sign up</a>
            <button aria-label="Dismiss" onClick={() => { sessionStorage.setItem('passport-pill-dismissed', '1'); setDismissed(true); }}>×</button>
        </div>
    );
}
```

- [ ] **Step 2: Route wiring**

In `web/src/main.ts`, locate the React mount section (where other pages like FeedPage are mounted). Add a parse for `#/u/:handle`:

```ts
// at the top of the file, near other route detection:
function parsePassportRoute(): string | null {
    const m = window.location.hash.match(/^#\/u\/([^/?]+)/);
    return m ? decodeURIComponent(m[1]).toLowerCase() : null;
}

// inside the route-mount handler (mirror existing pattern):
const passportHandle = parsePassportRoute();
if (passportHandle) {
    const root = ensureReactRoot();
    const currentUser = getCurrentUser(); // existing helper or null
    root.render(<PassportPage handle={passportHandle} currentUser={currentUser} />);
    return;
}
```

The exact integration depends on how `main.ts` currently dispatches routes — look at how `#/discover-trips` is wired (per recent commits) and mirror it. If routes use a switch-style block, add a `case 'u'` branch.

- [ ] **Step 3: Build + visit**

`cd web && npm run build && npm run dev`. Open `http://localhost:5173/#/u/<real-handle>` (use one you registered earlier). Expected: passport renders with stats, map, badges, tabs.

- [ ] **Step 4: Commit**

```bash
git add web/src/react/pages/PassportPage.tsx web/src/main.ts
git commit -m "feat(passport): PassportPage + #/u/:handle routing"
```

---

### Task E6: Passport styles

**Files:**
- Modify: `web/src/styles/pages.css`

- [ ] **Step 1: Append the passport block**

Append to `web/src/styles/pages.css` (the file already exists and is large — this section lives at the bottom):

```css
/* ============================================
   TUNISIA PASSPORT
   ============================================ */

.passport-page { max-width: 1100px; margin: 0 auto; padding: 24px 16px 80px; }
.passport-loading, .passport-404 { padding: 96px 24px; text-align: center; color: var(--text-muted, #9aa0a6); }

.passport-hero {
    position: relative; overflow: hidden;
    border-radius: 24px;
    padding: 36px 32px;
    margin-bottom: 24px;
    color: #fff;
    isolation: isolate;
}
.passport-hero-bg {
    position: absolute; inset: 0; z-index: -1;
    background:
        radial-gradient(120% 80% at 0% 0%, rgba(212,98,58,0.45), transparent 60%),
        radial-gradient(100% 80% at 100% 100%, rgba(26,58,115,0.6), transparent 60%),
        linear-gradient(135deg, #0b1e3f 0%, #1a3a73 50%, #d4623a 100%);
}
.passport-hero-content { display: flex; gap: 24px; justify-content: space-between; align-items: center; flex-wrap: wrap; }
.passport-hero-left { display: flex; gap: 20px; align-items: center; }
.passport-avatar { width: 88px; height: 88px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.5); object-fit: cover; }
.passport-avatar-fallback { display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.18); font-size: 32px; font-weight: 700; }
.passport-handle { opacity: 0.75; font-size: 14px; }
.passport-hero-text h1 { font-size: 32px; margin: 4px 0 8px; line-height: 1.1; }
.passport-meta { display: flex; gap: 12px; flex-wrap: wrap; font-size: 14px; opacity: 0.9; }
.passport-level { padding: 2px 10px; border-radius: 999px; background: rgba(255,255,255,0.18); font-size: 12px; letter-spacing: 0.02em; }
.passport-level-bronze { background: rgba(205,127,50,0.35); }
.passport-level-silver { background: rgba(192,192,192,0.35); }
.passport-level-gold { background: rgba(255,215,0,0.4); color: #1a1300; }
.passport-level-platinum { background: rgba(229,228,226,0.5); color: #14202b; }
.passport-bio { margin-top: 10px; max-width: 540px; opacity: 0.92; font-size: 14px; }
.passport-hero-right { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.passport-hero-right .btn { background: rgba(255,255,255,0.16); color: #fff; border: 1px solid rgba(255,255,255,0.25); }
.passport-hero-right .btn.primary { background: #fff; color: #0b1e3f; }

.passport-section { margin: 32px 0; }
.passport-section-title { font-size: 18px; margin-bottom: 12px; color: var(--text, #1a1a1a); }

.passport-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.passport-stat {
    display: flex; align-items: center; gap: 12px;
    background: var(--card-bg, #fff);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: 16px;
    padding: 16px;
}
.passport-stat strong { font-size: 22px; display: block; line-height: 1.05; }
.passport-stat span { font-size: 13px; color: var(--text-muted, #9aa0a6); }

.passport-map { position: relative; background: var(--card-bg, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 16px; padding: 16px; }
.passport-map-svg { width: 100%; max-width: 360px; display: block; margin: 0 auto; }
.passport-map-outline { fill: rgba(26,58,115,0.05); stroke: rgba(26,58,115,0.35); stroke-width: 0.6; }
.passport-city circle { fill: rgba(26,58,115,0.25); }
.passport-city text { font-size: 2.4px; fill: rgba(26,58,115,0.55); }
.passport-city.visited circle { fill: #d4623a; filter: drop-shadow(0 0 4px rgba(212,98,58,0.6)); }
.passport-city.visited text { fill: #1a3a73; font-weight: 700; }
.passport-map-empty { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; background: rgba(255,255,255,0.75); border-radius: 16px; }

.passport-badges { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.passport-badge {
    --badge-accent: rgba(0,0,0,0.1);
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 14px 10px;
    border-radius: 14px;
    background: var(--card-bg, #fff);
    border: 1px solid var(--border, #e5e7eb);
    transition: transform 120ms ease;
}
.passport-badge.earned { box-shadow: 0 0 0 2px var(--badge-accent) inset; }
.passport-badge.earned:hover { transform: translateY(-2px); }
.passport-badge.locked { opacity: 0.35; }
.passport-badge-icon { font-size: 26px; line-height: 1; }
.passport-badge-label { font-size: 12px; text-align: center; }

.passport-tabs-head { display: flex; gap: 4px; border-bottom: 1px solid var(--border, #e5e7eb); }
.passport-tabs-head button {
    padding: 10px 16px; background: transparent; border: none; border-bottom: 2px solid transparent;
    cursor: pointer; color: var(--text-muted, #9aa0a6); font-weight: 500;
}
.passport-tabs-head button.active { color: var(--text, #1a1a1a); border-bottom-color: #d4623a; }
.passport-tabs-body { padding-top: 18px; }
.passport-empty { padding: 28px; text-align: center; color: var(--text-muted, #9aa0a6); }
.passport-tab-skel { height: 200px; background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%); background-size: 200% 100%; animation: passport-shimmer 1.4s infinite; border-radius: 12px; }
@keyframes passport-shimmer { from { background-position: 100% 0; } to { background-position: -100% 0; } }

.passport-trip-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.passport-trip-card { background: var(--card-bg, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 14px; overflow: hidden; text-decoration: none; color: inherit; transition: transform 120ms; }
.passport-trip-card:hover { transform: translateY(-2px); }
.passport-trip-cover { display: flex; height: 120px; }
.passport-trip-cover img { flex: 1; object-fit: cover; }
.passport-trip-meta { padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; font-size: 13px; }

.passport-review-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.passport-review { background: var(--card-bg, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 12px; padding: 12px 14px; }
.passport-review-head { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-muted, #9aa0a6); margin-bottom: 4px; }

.passport-share { display: inline-flex; align-items: center; gap: 6px; }
.passport-share-sheet { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 50; }
.passport-share-sheet-inner { background: var(--card-bg, #fff); border-radius: 18px; padding: 22px; width: min(420px, 92vw); position: relative; }
.passport-share-close { position: absolute; top: 10px; right: 10px; background: transparent; border: none; cursor: pointer; }
.passport-share-row { display: flex; gap: 8px; align-items: center; margin: 14px 0; }
.passport-share-row code { flex: 1; background: rgba(0,0,0,0.05); padding: 8px 10px; border-radius: 8px; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.passport-share-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.passport-share-grid a { padding: 10px; text-align: center; background: rgba(0,0,0,0.05); border-radius: 10px; text-decoration: none; color: inherit; font-size: 14px; }

.passport-anon-pill {
    position: fixed; bottom: 16px; left: 16px; right: 16px;
    display: flex; gap: 12px; align-items: center; justify-content: center;
    background: #0b1e3f; color: #fff; padding: 12px 16px; border-radius: 999px;
    box-shadow: 0 8px 24px rgba(11,30,63,0.35);
    z-index: 40;
}
.passport-anon-pill button { background: transparent; border: none; color: rgba(255,255,255,0.6); font-size: 22px; cursor: pointer; line-height: 1; }

@media (prefers-color-scheme: dark) {
    .passport-trip-card, .passport-review, .passport-stat, .passport-map, .passport-badge { background: #1a1d23; border-color: #2a2f37; }
    .passport-section-title { color: #e8eaed; }
    .passport-empty { color: #9aa0a6; }
}

@media (max-width: 720px) {
    .passport-hero { padding: 24px 18px; }
    .passport-hero-text h1 { font-size: 24px; }
    .passport-stats { grid-template-columns: repeat(2, 1fr); }
    .passport-badges { grid-template-columns: repeat(4, 1fr); }
}
```

- [ ] **Step 2: Visual check**

`cd web && npm run dev`. Visit `/#/u/<handle>`. Verify the gradient hero, stat tiles, map, and badge grid all render coherently. Adjust color tokens if they clash with the existing dark-mode CSS variables in the file.

- [ ] **Step 3: Commit**

```bash
git add web/src/styles/pages.css
git commit -m "feat(passport): hero + map + stats + badge + tab styles"
```

---

## Phase F — Activation flow (signup gate + onboarding + soft passport)

### Task F1: Soft-passport localStorage accumulator

**Files:**
- Create: `web/src/passport-draft.ts`

- [ ] **Step 1: Module**

Create `web/src/passport-draft.ts`:

```ts
const KEY = 'etunisia.passport-draft.v1';

export interface PassportDraft {
    visitedCities: string[];
    interests: string[];
    handleHint?: string; // pre-fill suggestion if user landed via a 404 passport
}

export function readDraft(): PassportDraft {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return { visitedCities: [], interests: [] };
        const parsed = JSON.parse(raw);
        return {
            visitedCities: Array.isArray(parsed.visitedCities) ? parsed.visitedCities : [],
            interests: Array.isArray(parsed.interests) ? parsed.interests : [],
            handleHint: parsed.handleHint,
        };
    } catch {
        return { visitedCities: [], interests: [] };
    }
}

export function writeDraft(d: PassportDraft) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {}
}

export function addVisitedCity(city: string) {
    if (!city) return;
    const d = readDraft();
    if (!d.visitedCities.includes(city)) d.visitedCities.push(city);
    writeDraft(d);
}

export function addInterest(tag: string) {
    if (!tag) return;
    const d = readDraft();
    if (!d.interests.includes(tag)) d.interests.push(tag);
    writeDraft(d);
}

export function clearDraft() {
    try { localStorage.removeItem(KEY); } catch {}
}
```

- [ ] **Step 2: Wire from place-detail**

In `web/src/pages/place-detail.ts`, locate where a place loads and import `addVisitedCity`. Call it lightly when a user lands on a place:

```ts
import { addVisitedCity } from '../passport-draft';
// ...after place loads, if anonymous:
if (place?.city && !isAuthenticated()) addVisitedCity(place.city);
```

If `isAuthenticated` isn't directly available, gate on absence of an auth token in localStorage.

- [ ] **Step 3: Backend seed endpoint**

In `backend/src/users/users.controller.ts` add (authenticated):

```ts
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('me/seed')
    async seedFromDraft(@Request() req, @Body() body: { visitedCities?: string[]; interests?: string[] }) {
        return this.usersService.seedFromDraft(req.user.id, body || {});
    }
```

In `backend/src/users/users.service.ts`:

```ts
    async seedFromDraft(userId: string, draft: { visitedCities?: string[]; interests?: string[] }) {
        const user = await this.findById(userId);
        const existingInterests = Array.isArray(user.interests) ? user.interests : [];
        const interests = Array.from(new Set([...existingInterests, ...(draft.interests || [])])).slice(0, 16);

        let visitedPlaceIds = Array.isArray(user.visitedPlaceIds) ? user.visitedPlaceIds : [];
        const cities = (draft.visitedCities || []).filter(Boolean);
        if (cities.length) {
            const matched = await this.placesRepo
                .createQueryBuilder('p')
                .where('LOWER(p.city) IN (:...c)', { c: cities.map((c) => c.toLowerCase()) })
                .select(['p.id', 'p.city'])
                .getMany();
            const newIds = matched.map((p) => p.id).filter((id) => !visitedPlaceIds.includes(id));
            visitedPlaceIds = visitedPlaceIds.concat(newIds);
        }

        user.interests = interests;
        user.visitedPlaceIds = visitedPlaceIds;
        await this.usersRepository.save(user);
        await this.invalidatePassportCache(userId);
        return { ok: true, visited: visitedPlaceIds.length, interests: interests.length };
    }
```

- [ ] **Step 4: Commit**

```bash
git add web/src/passport-draft.ts web/src/pages/place-detail.ts backend/src/users
git commit -m "feat(passport): anon soft-passport draft + /users/me/seed endpoint"
```

---

### Task F2: SignupGate modal with handle picker + availability

**Files:**
- Create: `web/src/react/components/SignupGate.tsx`

- [ ] **Step 1: Component**

Create `web/src/react/components/SignupGate.tsx`:

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../shared/api';
import { Check, X, Loader2 } from 'lucide-react';

interface Props {
    open: boolean;
    onClose(): void;
    initialHandle?: string;
    onSuccess(user: { id: string; handle: string }): void;
}

export function SignupGate({ open, onClose, initialHandle, onSuccess }: Props) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [handle, setHandle] = useState(initialHandle || '');
    const [hStatus, setHStatus] = useState<'idle' | 'checking' | 'ok' | 'bad'>('idle');
    const [hReason, setHReason] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timer = useRef<number | null>(null);

    useEffect(() => {
        if (!handle) { setHStatus('idle'); setHReason(null); return; }
        setHStatus('checking');
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(async () => {
            try {
                const r: any = await api.checkHandle(handle);
                if (r?.available) { setHStatus('ok'); setHReason(null); }
                else { setHStatus('bad'); setHReason(r?.reason || 'taken'); }
            } catch { setHStatus('idle'); }
        }, 350);
        return () => { if (timer.current) window.clearTimeout(timer.current); };
    }, [handle]);

    if (!open) return null;

    const canSubmit = fullName.trim() && email.includes('@') && password.length >= 6 && hStatus === 'ok' && !submitting;

    const submit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);
        try {
            const res: any = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, password, handle: handle.toLowerCase() }),
            }).then(r => r.json());
            if (res?.accessToken) {
                localStorage.setItem('auth_token', res.accessToken);
                localStorage.setItem('auth_user', JSON.stringify(res.user));
                onSuccess(res.user);
            } else {
                setError(res?.message || 'Signup failed');
            }
        } catch (e: any) {
            setError(e?.message || 'Network error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="signup-gate-backdrop" role="dialog" aria-modal="true">
            <div className="signup-gate">
                <button className="signup-gate-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
                <h2>Claim your Tunisia Passport</h2>
                <p className="signup-gate-sub">Free. 30 seconds. You'll get a public profile, badges, and trip planner.</p>

                <label>
                    <span>Full name</span>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
                </label>
                <label>
                    <span>Email</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <label>
                    <span>Password</span>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </label>
                <label>
                    <span>Your handle</span>
                    <div className="signup-gate-handle-row">
                        <span className="signup-gate-handle-at">@</span>
                        <input
                            value={handle}
                            onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30))}
                            placeholder="e.g. amine_t"
                        />
                        <div className="signup-gate-handle-status">
                            {hStatus === 'checking' && <Loader2 size={16} className="spin" />}
                            {hStatus === 'ok' && <Check size={16} color="#0ea34c" />}
                            {hStatus === 'bad' && <X size={16} color="#d33" />}
                        </div>
                    </div>
                    {hStatus === 'bad' && (
                        <small className="signup-gate-hint">
                            {hReason === 'reserved' ? "That handle is reserved." :
                             hReason === 'taken' ? "That handle is taken." :
                             hReason === 'format' ? "Use 3–30 chars, lowercase letters, numbers, underscore. Must start with a letter." :
                             "Try a different handle."}
                        </small>
                    )}
                </label>

                {error && <div className="signup-gate-error">{error}</div>}

                <button className="btn primary block" disabled={!canSubmit} onClick={submit}>
                    {submitting ? 'Creating…' : 'Create my passport'}
                </button>

                <small className="signup-gate-tos">By signing up you agree to our terms & privacy policy.</small>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Styles**

Append to `web/src/styles/pages.css`:

```css
.signup-gate-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
.signup-gate { background: var(--card-bg, #fff); border-radius: 18px; width: min(440px, 100%); padding: 24px; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
.signup-gate h2 { margin: 0 0 4px; font-size: 22px; }
.signup-gate-sub { margin: 0 0 18px; color: var(--text-muted, #9aa0a6); font-size: 14px; }
.signup-gate label { display: block; margin-bottom: 12px; font-size: 13px; }
.signup-gate label span { display: block; margin-bottom: 4px; color: var(--text-muted, #9aa0a6); }
.signup-gate input { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border, #e5e7eb); background: var(--input-bg, #f7f7f8); font-size: 14px; }
.signup-gate-handle-row { display: flex; align-items: center; gap: 6px; }
.signup-gate-handle-at { color: var(--text-muted, #9aa0a6); }
.signup-gate-handle-status { width: 20px; }
.signup-gate-hint { color: #d33; font-size: 12px; }
.signup-gate-error { background: rgba(211,51,51,0.12); color: #d33; padding: 8px 12px; border-radius: 8px; margin-bottom: 12px; font-size: 13px; }
.signup-gate-close { position: absolute; top: 10px; right: 10px; background: transparent; border: none; cursor: pointer; }
.signup-gate-tos { display: block; margin-top: 10px; color: var(--text-muted, #9aa0a6); font-size: 12px; text-align: center; }
.btn.block { width: 100%; padding: 12px; font-size: 15px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
```

- [ ] **Step 3: Commit**

```bash
git add web/src/react/components/SignupGate.tsx web/src/styles/pages.css
git commit -m "feat(passport): SignupGate modal with live handle availability"
```

---

### Task F3: PassportOnboarding interstitial

**Files:**
- Create: `web/src/react/components/PassportOnboarding.tsx`

- [ ] **Step 1: Component**

Create `web/src/react/components/PassportOnboarding.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import { readDraft, clearDraft } from '../../passport-draft';

interface Props { handle: string; fullName: string; onDone(): void; }

const INTEREST_OPTIONS = ['Beach', 'Desert', 'Culture', 'Food', 'Adventure', 'Nightlife', 'Photography', 'History'];

export function PassportOnboarding({ handle, fullName, onDone }: Props) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [country, setCountry] = useState('Tunisia');
    const [interests, setInterests] = useState<string[]>([]);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        // pre-fill interests from anon draft
        const d = readDraft();
        if (d.interests.length) setInterests(d.interests.slice(0, 8));
    }, []);

    const toggle = (i: string) => setInterests((cur) => cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i]);

    const finish = async () => {
        const draft = readDraft();
        try {
            await api.seedPassport({
                visitedCities: draft.visitedCities,
                interests: Array.from(new Set([...interests, ...draft.interests])),
            });
        } catch {}
        clearDraft();
        setStep(3);
        setShowConfetti(true);
        window.setTimeout(() => {
            window.location.hash = `#/u/${handle}`;
            onDone();
        }, 2200);
    };

    return (
        <div className="passport-onb">
            {showConfetti && <Confetti />}
            <div className="passport-onb-card">
                {step === 1 && (
                    <>
                        <div className="passport-onb-step">Step 1 of 2</div>
                        <h2>Welcome, {fullName.split(' ')[0]} 🇹🇳</h2>
                        <p>Where are you from? We'll show it on your passport.</p>
                        <input className="passport-onb-input" value={country} onChange={(e) => setCountry(e.target.value)} />
                        <button className="btn primary block" onClick={() => setStep(2)}>Next</button>
                    </>
                )}
                {step === 2 && (
                    <>
                        <div className="passport-onb-step">Step 2 of 2</div>
                        <h2>What kind of trip do you dream about?</h2>
                        <p>Pick a few — we'll tailor your feed.</p>
                        <div className="passport-onb-chips">
                            {INTEREST_OPTIONS.map((i) => (
                                <button
                                    key={i}
                                    className={`passport-chip ${interests.includes(i) ? 'on' : ''}`}
                                    onClick={() => toggle(i)}
                                >{i}</button>
                            ))}
                        </div>
                        <button className="btn primary block" onClick={finish}>Create my passport</button>
                    </>
                )}
                {step === 3 && (
                    <div className="passport-onb-celebrate">
                        <div className="passport-onb-badge">🌟</div>
                        <h2>You earned <em>New Explorer</em></h2>
                        <p>Your passport is live. Taking you there…</p>
                    </div>
                )}
            </div>
        </div>
    );
}

/** Lightweight CSS-only confetti — no extra deps. */
function Confetti() {
    const pieces = Array.from({ length: 60 });
    return (
        <div className="confetti" aria-hidden>
            {pieces.map((_, i) => {
                const left = Math.random() * 100;
                const delay = Math.random() * 0.6;
                const dur = 1.4 + Math.random() * 1.4;
                const colors = ['#d4623a', '#1a3a73', '#f4c542', '#56cfe1', '#a371f7'];
                const bg = colors[i % colors.length];
                return (
                    <span
                        key={i}
                        style={{
                            left: `${left}%`,
                            animationDelay: `${delay}s`,
                            animationDuration: `${dur}s`,
                            background: bg,
                        }}
                    />
                );
            })}
        </div>
    );
}
```

- [ ] **Step 2: Styles**

Append to `web/src/styles/pages.css`:

```css
.passport-onb { position: fixed; inset: 0; background: linear-gradient(135deg, #0b1e3f, #1a3a73 60%, #d4623a); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 90; }
.passport-onb-card { background: var(--card-bg, #fff); border-radius: 22px; padding: 32px; width: min(480px, 100%); }
.passport-onb-step { color: var(--text-muted, #9aa0a6); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; }
.passport-onb-input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border, #e5e7eb); font-size: 15px; margin: 12px 0 18px; }
.passport-onb-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 22px; }
.passport-chip { padding: 8px 14px; border-radius: 999px; border: 1px solid var(--border, #e5e7eb); background: transparent; cursor: pointer; font-size: 14px; }
.passport-chip.on { background: #0b1e3f; color: #fff; border-color: #0b1e3f; }
.passport-onb-celebrate { text-align: center; }
.passport-onb-badge { font-size: 64px; animation: badge-pop 600ms cubic-bezier(.34,1.56,.64,1); }
@keyframes badge-pop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.confetti { position: fixed; inset: 0; pointer-events: none; overflow: hidden; }
.confetti span { position: absolute; top: -10px; width: 8px; height: 14px; border-radius: 2px; animation-name: confetti-fall; animation-timing-function: linear; animation-fill-mode: forwards; }
@keyframes confetti-fall {
    0% { transform: translateY(0) rotate(0); opacity: 1; }
    100% { transform: translateY(110vh) rotate(540deg); opacity: 0; }
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/react/components/PassportOnboarding.tsx web/src/styles/pages.css
git commit -m "feat(passport): post-signup onboarding interstitial with confetti"
```

---

### Task F4: Wire SignupGate + Onboarding into the app shell

**Files:**
- Modify: `web/src/main.ts`
- Modify: `web/src/react/pages/PassportPage.tsx`

- [ ] **Step 1: Provide a global modal mount**

In `web/src/main.ts`, add a top-level React root that mounts global modals (or attach to existing one). Pseudo:

```ts
import { SignupGate } from './react/components/SignupGate';
import { PassportOnboarding } from './react/components/PassportOnboarding';

// state shared via DOM event bus — simplest hookless pattern
let modalState: { open: boolean; initialHandle?: string } = { open: false };
function setSignupOpen(initialHandle?: string) { modalState = { open: true, initialHandle }; renderModalRoot(); }
function setSignupClosed() { modalState.open = false; renderModalRoot(); }

// the modal root element should already exist in index.html; if not, append:
// <div id="modal-root"></div>

(window as any).openSignupGate = (initialHandle?: string) => setSignupOpen(initialHandle);
```

The exact integration depends on how the app currently mounts modals. The simplest approach: from `PassportPage`, manage SignupGate state locally instead of globally. Apply the local approach:

- [ ] **Step 2: Local signup gate state inside PassportPage**

In `web/src/react/pages/PassportPage.tsx`, replace the anonymous CTA section. Add at top:

```tsx
import { SignupGate } from '../components/SignupGate';
import { PassportOnboarding } from '../components/PassportOnboarding';
```

Inside the component:

```tsx
const [signupOpen, setSignupOpen] = useState(false);
const [onboardingUser, setOnboardingUser] = useState<{ handle: string; fullName: string } | null>(null);
```

Change the anon CTA links to open the modal:

```tsx
{isAnon && (
    <button className="btn primary" onClick={() => setSignupOpen(true)}>Claim your passport →</button>
)}
```

And at the end of the component before the closing tag:

```tsx
<SignupGate
    open={signupOpen}
    onClose={() => setSignupOpen(false)}
    initialHandle={isAnon && data && (data as any).error === 'passport_not_found' ? handle : undefined}
    onSuccess={(u) => { setSignupOpen(false); setOnboardingUser({ handle: u.handle, fullName: (u as any).fullName || u.handle }); }}
/>
{onboardingUser && (
    <PassportOnboarding
        handle={onboardingUser.handle}
        fullName={onboardingUser.fullName}
        onDone={() => setOnboardingUser(null)}
    />
)}
```

- [ ] **Step 3: Build + walk the full happy path**

`cd web && npm run build && npm run dev`. Then:

1. Visit `/#/u/some_unclaimed_handle` while logged out.
2. See the "this passport hasn't been claimed" page with that handle prefilled.
3. Click claim → SignupGate opens with the handle prefilled.
4. Complete signup → onboarding interstitial → confetti → land on own passport.

If any step breaks, fix locally before committing.

- [ ] **Step 4: Commit**

```bash
git add web/src/react/pages/PassportPage.tsx web/src/main.ts
git commit -m "feat(passport): wire signup gate + onboarding into passport flow"
```

---

## Phase G — Crawler-friendly meta + Feed integration + verify

### Task G1: Vanilla entry for meta tags (`/u/:handle.html`)

**Files:**
- Create: `web/src/pages/u.ts`
- Modify: `web/vite.config.ts` (if multi-page output is configured)
- Modify: backend or static-server config to serve a redirecting HTML at `/u/:handle`

This task addresses the hash-routing crawler problem. Two routes share the same hash URL space, so crawlers must hit a non-hash URL to get unique meta. Implementation has two paths; pick the one that matches deploy infra.

- [ ] **Step 1: Inspect current static-serving setup**

Check `backend/src/main.ts` and `web/vite.config.ts` for how static HTML is served in production. Two options:

- **Option A**: backend (NestJS) serves a generated HTML for `GET /u/:handle` with per-passport meta tags and a `<meta http-equiv="refresh">` redirect to `/#/u/:handle`. Add the route to `users.controller.ts`:

```ts
@Get('/u-html/:handle')
@Header('Content-Type', 'text/html; charset=utf-8')
async passportHtml(@Param('handle') handle: string): Promise<string> {
    const passport = await this.usersService.assemblePassport(handle.toLowerCase()).catch(() => null);
    if (!passport) return `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=/#/signup?handle=${handle}"><title>Claim @${handle}</title>`;
    const apiBase = process.env.API_PUBLIC_BASE || '';
    const webBase = process.env.WEB_PUBLIC_BASE || '';
    const ogUrl = `${apiBase}/api/v1/users/by-handle/${handle}/og.png`;
    const desc = `🇹🇳 ${passport.stats.citiesVisited} cities · ${passport.stats.tripsPlanned} trips · ${passport.badges.length} badges`;
    return `<!doctype html>
<html><head>
<meta charset="utf-8">
<title>${passport.fullName} — Tunisia Passport</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${passport.fullName}'s Tunisia Passport">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${ogUrl}">
<meta property="og:url" content="${webBase}/#/u/${handle}">
<meta property="og:type" content="profile">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${ogUrl}">
<meta http-equiv="refresh" content="0; url=${webBase}/#/u/${handle}">
</head><body><a href="${webBase}/#/u/${handle}">View ${passport.fullName}'s Tunisia Passport</a></body></html>`;
}
```

Then add a frontend reverse-proxy / rewrite rule so `/u/:handle` → `/api/v1/users/u-html/:handle`. The exact rewrite depends on deploy host (Nginx, Caddy, Vercel rewrites). Document the rule in the README; if no clear deploy infra exists, ship Option A's endpoint and route docs as TODO.

- **Option B**: Skip per-passport HTML for v1. Set sane defaults in `web/index.html` and accept that link previews show a generic banner. Document this as a known limitation.

Choose Option A if a public deploy is imminent. Otherwise B.

- [ ] **Step 2: Implementation**

If Option A: implement the endpoint above + deploy doc. If Option B: ensure `web/index.html` has reasonable default OG tags pointing at the brand hero image. Commit either way.

- [ ] **Step 3: Verify with social validators**

After deploy:
- https://cards-dev.twitter.com/validator (for Twitter/X)
- https://developers.facebook.com/tools/debug/ (for Facebook)
- Paste a passport URL → expect the OG image to render.

Locally (no deploy): `curl -H 'User-Agent: Twitterbot' http://localhost:3000/api/v1/users/u-html/:handle` and inspect the HTML head.

- [ ] **Step 4: Commit**

```bash
git add backend/src web/src/pages/u.ts web/index.html
git commit -m "feat(passport): crawler-friendly /u/:handle meta + redirect"
```

---

### Task G2: Link own avatar to own passport on Feed; wire OG meta into hash route

**Files:**
- Modify: `web/src/react/pages/FeedPage.tsx`
- Modify: `web/src/react/pages/PassportPage.tsx`

- [ ] **Step 1: Avatar links on Feed**

In `web/src/react/pages/FeedPage.tsx`, locate avatar renders for the current user (header, post composer, etc.) and wrap them in `<a href={`#/u/${currentUser.handle}`}>`. Wrap any post-author avatars in similar links using each post's `author.handle`.

If the post DTO doesn't include `handle` yet, extend the backend post DTO to include `author: { id, fullName, avatar, handle }` (one-line edit in `posts.service.ts` mapping function).

- [ ] **Step 2: Inject per-passport meta tags client-side as a fallback**

In `PassportPage.tsx`, after `data` resolves, update `document.title` and inject OG meta tags into `<head>` for share dialogs that follow the JS-evaluated URL (most do not, but Twitter Mobile and some chat apps do):

```tsx
useEffect(() => {
    if (!data || (data as any).error) return;
    const p: any = data;
    document.title = `${p.fullName} — Tunisia Passport`;
    setMeta('og:title', `${p.fullName}'s Tunisia Passport`);
    setMeta('og:description', `🇹🇳 ${p.stats.citiesVisited} cities · ${p.stats.tripsPlanned} trips · ${p.badges.length} badges`);
    setMeta('og:image', api.getPassportOgUrl(p.handle, new Date(p.joinedAt).getTime()));
    setMeta('og:url', `${window.location.origin}/#/u/${p.handle}`);
    setMeta('og:type', 'profile');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:image', api.getPassportOgUrl(p.handle));
}, [data]);

function setMeta(name: string, content: string) {
    const key = name.startsWith('og:') || name.startsWith('twitter:') ? 'property' : 'name';
    let el = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${name}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(key, name);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/react/pages/FeedPage.tsx web/src/react/pages/PassportPage.tsx
git commit -m "feat(passport): own-avatar link on feed + client meta injection"
```

---

### Task G3: End-to-end verification checklist

- [ ] **Step 1: Manual flow walkthrough**

Walk through with a fresh browser (incognito):

1. Visit `/#/u/some_unclaimed_xyz` while logged out.
2. See the 404 page with the handle prefilled. Click Claim.
3. SignupGate opens with the handle prefilled. Pick name/email/password. Submit.
4. Onboarding step 1 (country) → step 2 (interests) → confetti → lands on own passport `/#/u/<handle>`.
5. Map shows any cities seeded from anon localStorage (if you visited a place-detail page before signup).
6. Click "Share passport" → copy link → confirm clipboard contains `…/#/u/<handle>`.
7. Visit `/api/v1/users/by-handle/<handle>/og.png` → confirm PNG renders.

- [ ] **Step 2: Sensitive-field leak check**

```bash
curl http://localhost:3000/api/v1/users/by-handle/<handle> | jq 'keys'
```

Confirm output does NOT contain: `email`, `password`, `phone`, `plan`, `subscriptionExpiresAt`, `favoriteIds`, `isActive`.

- [ ] **Step 3: Cache invalidation check**

1. Hit `by-handle/<handle>` (warms cache).
2. As that user, update bio via `/api/v1/users/me` (PUT).
3. Hit `by-handle/<handle>` again — bio should reflect the change immediately (invalidation fires).

- [ ] **Step 4: Badge auto-award check**

1. Register a new user → confirm `badges` includes `new_explorer`, `points` ≥ 5.
2. Mark a place visited via `/api/v1/users/visited/:placeId` → confirm `first_steps` is added.
3. Create a trip → confirm `trip_planner` is added.

- [ ] **Step 5: Polish + tone audit**

Open the passport page on mobile width (Chrome devtools, 375px). Verify:
- Hero, stats, badges, map, tabs all stack cleanly.
- Anon pill doesn't overlap content.
- Onboarding interstitial fills the viewport without scroll on a 360×640 device.

Adjust spacing/sizing if anything feels cramped — the "best feeling" bar matters here.

- [ ] **Step 6: Commit any fix-ups**

```bash
git add -p   # review each fix individually
git commit -m "polish(passport): mobile + tone fixes from verification pass"
```

---

## Self-review (run by the writer after drafting; engineers can ignore)

After writing this plan I checked:

- **Spec coverage:** every section of the spec maps to a task. §3 handle → A1–A4. §4 endpoint + caching → B1–B4. §5 page → E1–E6. §6 OG → C1–C3. §7 signup gate + onboarding + soft passport → F1–F4. §8 badges → D1–D2. §9 file inventory → matches across tasks. §10 data flow → exercised by F4 + G3. §11 errors → covered in B1 (404 body), C3 (OG fallback), F2 (signup errors). §12 testing → adapted to no-test-infra reality (verification by build + curl + UI walkthrough). §13 perf → caching + lazy tabs handled. §14 risks → addressed in G1 (hash-routing meta). §15 success criteria → checklist in G3.
- **Placeholder scan:** no TBD/TODO/"implement later". Two intentional engineer-choice points are explicit: choice between Option A and Option B in G1 (with criteria), and the font fallback in C1 (with criteria). Both are concrete decisions, not unfinished work.
- **Type consistency:** PassportDto used in B1, B2, C2, E5 consistently. `awardIfEligible(userId, event, payload)` signature stable across D2 wire-ups.
- **No test framework**: deliberately omitted Jest scaffolding; the repo has none and adding it is its own plan.

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-19-tunisia-passport.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
