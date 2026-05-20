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
let FeedService = class FeedService {
    constructor(posts, reviews, ads, places, follows, safety) {
        this.posts = posts;
        this.reviews = reviews;
        this.ads = ads;
        this.places = places;
        this.follows = follows;
        this.safety = safety;
    }
    async unified(opts = {}) {
        const page = Math.max(1, Number(opts.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(opts.limit) || 10));
        const sort = opts.sort || 'hot';
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
            const wide = await this.posts.list({ page: 1, limit: page * limit + 50, sort });
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
            this.posts.list({ page: 1, limit: fetchN, sort, category: opts.category }),
            this.reviews.findFeed({ page: 1, limit: fetchN, sort }),
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
        const score = (a) => (a.upvotes || 0) - (a.downvotes || 0) + (sort === 'hot' ? (a.commentCount || 0) : 0);
        if (sort === 'top' || sort === 'hot') {
            merged.sort((a, b) => {
                const sa = score(a);
                const sb = score(b);
                if (sa !== sb)
                    return sb - sa;
                const ta = new Date(a.createdAt).getTime();
                const tb = new Date(b.createdAt).getTime();
                if (ta !== tb)
                    return tb - ta;
                return String(a.id).localeCompare(String(b.id));
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
    __metadata("design:paramtypes", [posts_service_1.PostsService,
        reviews_service_1.ReviewsService,
        ads_service_1.AdsService,
        places_service_1.PlacesService,
        typeorm_2.Repository,
        safety_service_1.SafetyService])
], FeedService);
//# sourceMappingURL=feed.service.js.map