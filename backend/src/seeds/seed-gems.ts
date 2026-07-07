/**
 * Hidden-gems seeder — adds the 120 researched Tunisian places, a set of traveller
 * personas, and realistic reviews/feedback that populate the review feed.
 *
 * Run with:  npm run seed:gems   (requires the database to be up)
 *
 * Idempotent:
 *   - users are matched by their @travelers.etunisia.tn email
 *   - places are de-duplicated against existing rows (slug / normalised name / shared
 *     distinctive tokens) so it won't clash with the legacy seed
 *   - reviews are only added to a place that has no seed-user reviews yet
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import slugify from 'slugify';
import { CategoriesService } from '../categories/categories.service';
import { PlacesService } from '../places/places.service';
import { Place } from '../places/place.entity';
import { Review } from '../reviews/review.entity';
import { User, UserPlan } from '../users/user.entity';
import { gemsData } from './gems.data';
import { reviewers, reviewerEmail, reviewSnippets, reviewClosers } from './reviewers.data';

// ── deterministic RNG so re-runs produce the same data ──
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── name normalisation for place de-duplication ──
const GENERIC = new Set([
  'tunisia', 'the', 'and', 'of', 'de', 'des', 'la', 'le', 'el', 'dar', 'bou', 'ain', 'cap',
  'sidi', 'ksar', 'hammam', 'great', 'old', 'town', 'city', 'site', 'sites', 'beach', 'island',
  'islands', 'national', 'park', 'mosque', 'medina', 'fort', 'museum', 'village', 'canyon',
  'oasis', 'rocks', 'quarter', 'ruins', 'roman', 'grand', 'mount', 'house', 'centre', 'center',
  'springs', 'spring', 'gate', 'port', 'market', 'souk', 'festival', 'wars', 'star', 'cafe',
  'new', 'north', 'south', 'sea', 'hot', 'borj',
]);
function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
function distinctTokens(s: string): Set<string> {
  return new Set(norm(s).split(' ').filter((t) => t.length >= 3 && !GENERIC.has(t)));
}
function intersectSize(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const t of a) if (b.has(t)) n++;
  return n;
}

function bucketFor(categoryName: string): keyof typeof reviewSnippets {
  switch (categoryName) {
    case 'Historical Sites': return 'historical';
    case 'Nature & Beaches': return 'nature';
    case 'Gastronomy': return 'food';
    case 'Artisanat': return 'artisan';
    default: return 'generic';
  }
}
function ratingFor(x: number): number {
  if (x < 0.46) return 5;
  if (x < 0.80) return 4;
  if (x < 0.95) return 3;
  return 2;
}
function pick<T>(arr: T[], r: () => number): T { return arr[Math.floor(r() * arr.length)]; }

function makeComment(bucket: keyof typeof reviewSnippets, rating: number, place: string, city: string, r: () => number): string {
  const s = reviewSnippets[bucket];
  const pool = rating >= 4 ? s.pos : rating === 3 ? s.mid : s.neg;
  let body = pick(pool, r);
  if (rating >= 4 && r() < 0.5) body += ' ' + pick(reviewClosers, r);
  return body.replace(/\{place\}/g, place).replace(/\{city\}/g, city);
}

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const categoriesService = app.get(CategoriesService);
  const placesService = app.get(PlacesService);
  const placesRepo = app.get<Repository<Place>>(getRepositoryToken(Place));
  const reviewsRepo = app.get<Repository<Review>>(getRepositoryToken(Review));
  const usersRepo = app.get<Repository<User>>(getRepositoryToken(User));

  // categories must exist for the type→category mapping
  await categoriesService.seed();
  const cats = await categoriesService.findAll();
  const catId = (name: string) => cats.find((c) => c.name === name)?.id;

  // ── 1) Traveller personas ───────────────────────────────
  const pwd = await bcrypt.hash('traveler123', 10);
  const userIds: string[] = [];
  let usersCreated = 0;
  for (const rv of reviewers) {
    const email = reviewerEmail(rv.handle);
    let u = await usersRepo.findOne({ where: { email } });
    if (!u) {
      u = await usersRepo.save(usersRepo.create({
        fullName: rv.fullName,
        email,
        handle: rv.handle,
        password: pwd,
        country: rv.country,
        bio: rv.bio,
        avatar: `https://i.pravatar.cc/200?img=${rv.avatarIdx}`,
        plan: rv.plan as UserPlan,
        onboardingComplete: true,
      }));
      usersCreated++;
    }
    userIds.push(u.id);
  }
  console.log(`✅ Travellers: ${usersCreated} created, ${userIds.length} total`);

  // ── 2) Places (de-duplicated) + reviews ─────────────────
  const existing = await placesRepo.find();
  const index = existing.map((p) => ({ id: p.id, slug: p.slug, n: norm(p.name), d: distinctTokens(p.name) }));

  let created = 0, matched = 0, reviewsAdded = 0, placesReviewed = 0;

  for (let i = 0; i < gemsData.length; i++) {
    const g = gemsData[i];
    const gSlug = slugify(g.name, { lower: true, strict: true });
    const gn = norm(g.name);
    const gd = distinctTokens(g.name);

    let placeId: string | undefined;
    const hit = index.find((e) => e.slug === gSlug || e.n === gn || intersectSize(e.d, gd) >= 2);
    if (hit) {
      placeId = hit.id;
      matched++;
    } else {
      try {
        const p = await placesService.create({
          name: g.name,
          description: g.description,
          address: g.address,
          city: g.city,
          governorate: g.governorate,
          latitude: g.latitude,
          longitude: g.longitude,
          coverImage: g.coverImage,
          images: g.images,
          tags: g.tags,
          categoryId: catId(g.categoryName),
          isFeatured: g.isFeatured,
        } as any);
        placeId = p.id;
        created++;
        index.push({ id: p.id, slug: p.slug, n: gn, d: gd });
      } catch (e: any) {
        console.log(`  ⚠ skip place "${g.name}": ${e.message}`);
        continue;
      }
    }
    if (!placeId) continue;

    // reviews — idempotent: only seed if this place has no seed-user reviews yet
    const already = await reviewsRepo.count({ where: { placeId, userId: In(userIds) } });
    if (already > 0) continue;

    const r = mulberry32(1000 + i);
    const bucket = bucketFor(g.categoryName);
    const n = 2 + Math.floor(r() * 4); // 2..5 reviews
    const reviewerPool = [...userIds].sort(() => r() - 0.5).slice(0, n);

    for (const uid of reviewerPool) {
      const rating = ratingFor(r());
      const comment = makeComment(bucket, rating, g.name, g.city, r);
      const daysAgo = Math.floor(r() * 540) + 2;
      const review = reviewsRepo.create({
        rating,
        comment,
        userId: uid,
        placeId,
        createdAt: new Date(Date.now() - daysAgo * 86400000),
      } as any);
      await reviewsRepo.save(review);
      reviewsAdded++;
    }
    await placesService.updateRating(placeId);
    placesReviewed++;
  }

  console.log(`✅ Places: ${created} created, ${matched} matched existing`);
  console.log(`✅ Reviews: ${reviewsAdded} added across ${placesReviewed} places`);
  console.log('🎉 Hidden-gems seed complete.');
  await app.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
