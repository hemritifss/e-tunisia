"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const posts_service_1 = require("../posts/posts.service");
const reviews_service_1 = require("../reviews/reviews.service");
const ads_service_1 = require("../ads/ads.service");
const places_service_1 = require("../places/places.service");
const follow_entity_1 = require("../social/follow.entity");
const safety_service_1 = require("../safety/safety.service");
const user_entity_1 = require("../users/user.entity");
const place_visit_entity_1 = require("../users/place-visit.entity");
const effective_plan_1 = require("../users/effective-plan");
let FeedService = class FeedService {
    constructor(posts, reviews, ads, places, follows, users, placeVisits, safety) {
        this.posts = posts;
        this.reviews = reviews;
        this.ads = ads;
        this.places = places;
        this.follows = follows;
        this.users = users;
        this.placeVisits = placeVisits;
        this.safety = safety;
    }
    async unified(opts = {}) {
        const page = Math.max(1, Number(opts.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(opts.limit) || 10));
        const sort = opts.sort || 'hot';
        const baseSort = sort === 'foryou' ? 'hot' : sort;
        if (opts.mine && opts.userId) {
            return this.posts.list({ page, limit, sort: 'new', authorId: opts.userId });
        }
        if (opts.following && opts.userId) {
            const followed = await this.follows.find({
                where: { followerId: opts.userId },
                select: { followingId: true },
            });
            const ids = followed.map(f => f.followingId).filter(Boolean);
            if (ids.length === 0) {
                return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
            }
            const wide = await this.posts.list({ page: 1, limit: page * limit + 50, sort: baseSort });
            const filtered = (wide.data || []).filter((p) => ids.includes(p.authorId));
            const offset = (page - 1) * limit;
            return {
                data: filtered.slice(offset, offset + limit),
                meta: {
                    page, limit,
                    total: filtered.length,
                    totalPages: Math.ceil(filtered.length / limit),
                },
            };
        }
        const need = page * limit + limit;
        const fetchN = Math.max(need, 30);
        const [postsRes, reviewsRes] = await Promise.all([
            this.posts.list({ page: 1, limit: fetchN, sort: baseSort, category: opts.category }),
            this.reviews.findFeed({ page: 1, limit: fetchN, sort: baseSort }),
        ]);
        const reviewsTagged = reviewsRes.data.map((r) => ({ ...r, type: 'review' }));
        let merged = [...postsRes.data, ...reviewsTagged];
        if (opts.userId) {
            const hidden = await this.safety.getHiddenUserIds(opts.userId);
            if (hidden.size > 0) {
                merged = merged.filter((m) => !hidden.has(m.authorId));
            }
        }
        if (opts.hashtag) {
            const needle = ('#' + opts.hashtag.replace(/^#/, '')).toLowerCase();
            merged = merged.filter((m) => {
                const hay = `${m.title || ''}\n${m.body || ''}`.toLowerCase();
                return hay.includes(needle);
            });
        }
        const HALF_LIFE_HOURS = 36;
        const decay = (createdAt) => {
            const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
            if (ageHours <= 0)
                return 1;
            return Math.pow(0.5, ageHours / HALF_LIFE_HOURS);
        };
        const engagement = (a) => (a.upvotes || 0)
            - (a.downvotes || 0)
            + 1.2 * (a.commentCount || 0)
            + 0.6 * (a.savesCount || a.saveCount || 0)
            + 0.4 * (a.reactionsCount || a.reactionCount || 0);
        const hotScore = (a) => engagement(a) * decay(a.createdAt);
        const viewerInterests = new Set();
        const viewerCities = new Set();
        if (sort === 'foryou' && opts.userId) {
            const u = await this.users.findOne({ where: { id: opts.userId }, select: ['interests'] });
            for (const it of (u?.interests || []))
                viewerInterests.add(String(it).toLowerCase());
            const visitRows = await this.placeVisits.createQueryBuilder('v')
                .select('DISTINCT v.city', 'city')
                .where('v.userId = :id AND v.city IS NOT NULL', { id: opts.userId })
                .getRawMany();
            for (const r of visitRows)
                viewerCities.add(String(r.city).toLowerCase());
        }
        const tierBoost = (a) => {
            const author = a.author || a.user;
            const plan = author ? (0, effective_plan_1.effectivePlan)(author) : 'free';
            return plan === 'business' ? 1.5 : plan === 'premium' ? 1.2 : 1;
        };
        const interestBoost = (a) => {
            if (viewerInterests.size === 0 && viewerCities.size === 0)
                return 1;
            let matches = 0;
            if (viewerInterests.size) {
                const tags = [
                    ...(Array.isArray(a.tags) ? a.tags : []),
                    a.category,
                    a.place?.category?.name,
                ].filter(Boolean).map((s) => String(s).toLowerCase());
                for (const t of tags)
                    if (viewerInterests.has(t))
                        matches++;
            }
            if (viewerCities.size) {
                const cities = [a.city, a.location, a.place?.city]
                    .filter(Boolean).map((s) => String(s).toLowerCase());
                if (cities.some((c) => viewerCities.has(c)))
                    matches++;
            }
            return 1 + 0.25 * Math.min(matches, 2);
        };
        const forYouScore = (a) => (hotScore(a) + 0.5) * tierBoost(a) * interestBoost(a);
        if (sort === 'foryou') {
            merged.sort((a, b) => {
                const sb = forYouScore(b);
                const sa = forYouScore(a);
                if (sb !== sa)
                    return sb - sa;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
        }
        else if (sort === 'hot') {
            merged.sort((a, b) => {
                const sb = hotScore(b);
                const sa = hotScore(a);
                if (sb !== sa)
                    return sb - sa;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
        }
        else if (sort === 'top') {
            merged.sort((a, b) => {
                const sb = engagement(b);
                const sa = engagement(a);
                if (sb !== sa)
                    return sb - sa;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
        }
        else {
            merged.sort((a, b) => {
                const ta = new Date(a.createdAt).getTime();
                const tb = new Date(b.createdAt).getTime();
                if (ta !== tb)
                    return tb - ta;
                return String(a.id).localeCompare(String(b.id));
            });
        }
        const offset = (page - 1) * limit;
        let pageItems = merged.slice(offset, offset + limit);
        const feedAds = await this.ads.findActive('feed').catch(() => []);
        const homeAds = (feedAds && feedAds.length) ? feedAds : await this.ads.findActive('home').catch(() => []);
        const adPool = (homeAds || []).filter((a) => a.isActive);
        if (adPool.length > 0) {
            const out = [];
            for (let i = 0; i < pageItems.length; i++) {
                out.push(pageItems[i]);
                if ((i + 1) % 4 === 0) {
                    const ad = adPool[Math.floor(Math.random() * adPool.length)];
                    out.push({
                        id: `ad-${ad.id}-${page}-${i}`,
                        type: 'ad',
                        adId: ad.id,
                        title: ad.title,
                        body: ad.description,
                        cta: 'Learn More',
                        ctaUrl: ad.targetUrl,
                        images: ad.imageUrl ? [ad.imageUrl] : [],
                        sponsor: ad.advertiserName || 'Sponsored',
                        createdAt: new Date().toISOString(),
                    });
                }
            }
            pageItems = out;
        }
        const total = postsRes.meta.total + reviewsRes.meta.total;
        return {
            data: pageItems,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async trendingHashtags(limit = 8) {
        const lim = Math.max(1, Math.min(30, limit));
        const days = 30;
        const [postsRes, reviewsRes] = await Promise.all([
            this.posts.list({ page: 1, limit: 200, sort: 'new' }).catch(() => ({ data: [] })),
            this.reviews.findFeed({ page: 1, limit: 200, sort: 'new' }).catch(() => ({ data: [] })),
        ]);
        const items = [...(postsRes.data || []), ...(reviewsRes.data || [])];
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        const counts = new Map();
        const TAG_RE = /#([\p{L}\p{N}_]{2,40})/gu;
        for (const item of items) {
            const at = new Date(item.createdAt).getTime();
            if (!Number.isFinite(at) || at < cutoff)
                continue;
            const blob = `${item.title || ''} ${item.body || ''}`;
            let m;
            while ((m = TAG_RE.exec(blob)) !== null) {
                const raw = m[1];
                const key = raw.toLowerCase();
                const prev = counts.get(key);
                if (prev) {
                    prev.count++;
                    if (at > prev.lastAt) {
                        prev.lastAt = at;
                        prev.original = raw;
                    }
                }
                else {
                    counts.set(key, { count: 1, original: raw, lastAt: at });
                }
            }
        }
        return Array.from(counts.entries())
            .sort((a, b) => b[1].count - a[1].count || b[1].lastAt - a[1].lastAt)
            .slice(0, lim)
            .map(([key, v]) => ({ tag: key, display: v.original, count: v.count }));
    }
    async stories(limit = 12) {
        const placesPage = await this.places
            .findAll({ limit, featured: 'true', sortBy: 'rating', order: 'DESC' })
            .catch(() => null);
        const featured = (placesPage?.data || []).slice(0, limit);
        return {
            stories: featured.map((p) => ({
                id: p.id,
                kind: 'place',
                title: p.name,
                subtitle: p.city,
                image: p.coverImage || (p.images && p.images[0]) || null,
                slug: p.slug,
            })),
        };
    }
};
exports.FeedService = FeedService;
exports.FeedService = FeedService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, typeorm_1.InjectRepository)(follow_entity_1.Follow)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(6, (0, typeorm_1.InjectRepository)(place_visit_entity_1.PlaceVisit)),
    __metadata("design:paramtypes", [posts_service_1.PostsService,
        reviews_service_1.ReviewsService,
        ads_service_1.AdsService,
        places_service_1.PlacesService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        safety_service_1.SafetyService])
], FeedService);
//# sourceMappingURL=feed.service.js.map