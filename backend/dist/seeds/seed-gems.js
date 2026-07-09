"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const slugify_1 = require("slugify");
const categories_service_1 = require("../categories/categories.service");
const places_service_1 = require("../places/places.service");
const place_entity_1 = require("../places/place.entity");
const review_entity_1 = require("../reviews/review.entity");
const user_entity_1 = require("../users/user.entity");
const gems_data_1 = require("./gems.data");
const reviewers_data_1 = require("./reviewers.data");
function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const GENERIC = new Set([
    'tunisia', 'the', 'and', 'of', 'de', 'des', 'la', 'le', 'el', 'dar', 'bou', 'ain', 'cap',
    'sidi', 'ksar', 'hammam', 'great', 'old', 'town', 'city', 'site', 'sites', 'beach', 'island',
    'islands', 'national', 'park', 'mosque', 'medina', 'fort', 'museum', 'village', 'canyon',
    'oasis', 'rocks', 'quarter', 'ruins', 'roman', 'grand', 'mount', 'house', 'centre', 'center',
    'springs', 'spring', 'gate', 'port', 'market', 'souk', 'festival', 'wars', 'star', 'cafe',
    'new', 'north', 'south', 'sea', 'hot', 'borj',
]);
function norm(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
function distinctTokens(s) {
    return new Set(norm(s).split(' ').filter((t) => t.length >= 3 && !GENERIC.has(t)));
}
function intersectSize(a, b) {
    let n = 0;
    for (const t of a)
        if (b.has(t))
            n++;
    return n;
}
function bucketFor(categoryName) {
    switch (categoryName) {
        case 'Historical Sites': return 'historical';
        case 'Nature & Beaches': return 'nature';
        case 'Gastronomy': return 'food';
        case 'Artisanat': return 'artisan';
        default: return 'generic';
    }
}
function ratingFor(x) {
    if (x < 0.46)
        return 5;
    if (x < 0.80)
        return 4;
    if (x < 0.95)
        return 3;
    return 2;
}
function pick(arr, r) { return arr[Math.floor(r() * arr.length)]; }
function makeComment(bucket, rating, place, city, r) {
    const s = reviewers_data_1.reviewSnippets[bucket];
    const pool = rating >= 4 ? s.pos : rating === 3 ? s.mid : s.neg;
    let body = pick(pool, r);
    if (rating >= 4 && r() < 0.5)
        body += ' ' + pick(reviewers_data_1.reviewClosers, r);
    return body.replace(/\{place\}/g, place).replace(/\{city\}/g, city);
}
async function run() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const categoriesService = app.get(categories_service_1.CategoriesService);
    const placesService = app.get(places_service_1.PlacesService);
    const placesRepo = app.get((0, typeorm_1.getRepositoryToken)(place_entity_1.Place));
    const reviewsRepo = app.get((0, typeorm_1.getRepositoryToken)(review_entity_1.Review));
    const usersRepo = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    await categoriesService.seed();
    const cats = await categoriesService.findAll();
    const catId = (name) => cats.find((c) => c.name === name)?.id;
    const pwd = await bcrypt.hash('traveler123', 10);
    const userIds = [];
    let usersCreated = 0;
    for (const rv of reviewers_data_1.reviewers) {
        const email = (0, reviewers_data_1.reviewerEmail)(rv.handle);
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
                plan: rv.plan,
                onboardingComplete: true,
            }));
            usersCreated++;
        }
        userIds.push(u.id);
    }
    console.log(`✅ Travellers: ${usersCreated} created, ${userIds.length} total`);
    const existing = await placesRepo.find();
    const index = existing.map((p) => ({ id: p.id, slug: p.slug, n: norm(p.name), d: distinctTokens(p.name) }));
    let created = 0, matched = 0, reviewsAdded = 0, placesReviewed = 0;
    for (let i = 0; i < gems_data_1.gemsData.length; i++) {
        const g = gems_data_1.gemsData[i];
        const gSlug = (0, slugify_1.default)(g.name, { lower: true, strict: true });
        const gn = norm(g.name);
        const gd = distinctTokens(g.name);
        let placeId;
        const hit = index.find((e) => e.slug === gSlug || e.n === gn || intersectSize(e.d, gd) >= 2);
        if (hit) {
            placeId = hit.id;
            matched++;
        }
        else {
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
                });
                placeId = p.id;
                created++;
                index.push({ id: p.id, slug: p.slug, n: gn, d: gd });
            }
            catch (e) {
                console.log(`  ⚠ skip place "${g.name}": ${e.message}`);
                continue;
            }
        }
        if (!placeId)
            continue;
        const already = await reviewsRepo.count({ where: { placeId, userId: (0, typeorm_2.In)(userIds) } });
        if (already > 0)
            continue;
        const r = mulberry32(1000 + i);
        const bucket = bucketFor(g.categoryName);
        const n = 2 + Math.floor(r() * 4);
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
            });
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
//# sourceMappingURL=seed-gems.js.map