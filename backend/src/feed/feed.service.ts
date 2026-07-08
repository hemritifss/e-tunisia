import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostsService } from '../posts/posts.service';
import { ReviewsService } from '../reviews/reviews.service';
import { AdsService } from '../ads/ads.service';
import { PlacesService } from '../places/places.service';
import { Follow } from '../social/follow.entity';
import { SafetyService } from '../safety/safety.service';
import { User } from '../users/user.entity';
import { PlaceVisit } from '../users/place-visit.entity';
import { effectivePlan } from '../users/effective-plan';

type FeedSort = 'new' | 'top' | 'hot' | 'foryou';

interface FeedOpts {
    page?: number;
    limit?: number;
    sort?: FeedSort;
    mine?: boolean;
    following?: boolean;
    userId?: string;
    category?: string;
    /** Filter posts whose body contains "#tag" — case-insensitive. */
    hashtag?: string;
}

@Injectable()
export class FeedService {
    constructor(
        private posts: PostsService,
        private reviews: ReviewsService,
        private ads: AdsService,
        private places: PlacesService,
        @InjectRepository(Follow) private follows: Repository<Follow>,
        @InjectRepository(User) private users: Repository<User>,
        @InjectRepository(PlaceVisit) private placeVisits: Repository<PlaceVisit>,
        private safety: SafetyService,
    ) {}

    async unified(opts: FeedOpts = {}) {
        const page = Math.max(1, Number(opts.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(opts.limit) || 10));
        const sort: FeedSort = opts.sort || 'hot';
        // 'foryou' re-ranks a 'hot' candidate window with personalization, so fetch as 'hot'.
        const baseSort: 'new' | 'top' | 'hot' = sort === 'foryou' ? 'hot' : sort;

        // If 'mine' filter is requested, only return that user's posts (no reviews mixed in).
        if (opts.mine && opts.userId) {
            return this.posts.list({ page, limit, sort: 'new', authorId: opts.userId });
        }

        // 'following' filter: posts authored by users the current user follows.
        if (opts.following && opts.userId) {
            const followed = await this.follows.find({
                where: { followerId: opts.userId },
                select: { followingId: true },
            });
            const ids = followed.map(f => (f as any).followingId).filter(Boolean);
            if (ids.length === 0) {
                return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
            }
            // Pull a wide window, filter to followed authors, sort, slice.
            const wide = await this.posts.list({ page: 1, limit: page * limit + 50, sort: baseSort });
            const filtered = (wide.data || []).filter((p: any) => ids.includes(p.authorId));
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

        // Pull enough rows from each source on EVERY page to cover the current offset+limit.
        // Then sort deterministically and slice. The sort key includes the id as a final
        // tiebreaker so the order is stable across pages — no duplicates, no skipped items.
        const need = page * limit + limit; // headroom
        const fetchN = Math.max(need, 30);
        const [postsRes, reviewsRes] = await Promise.all([
            this.posts.list({ page: 1, limit: fetchN, sort: baseSort, category: opts.category }),
            this.reviews.findFeed({ page: 1, limit: fetchN, sort: baseSort }),
        ]);

        const reviewsTagged = reviewsRes.data.map((r: any) => ({ ...r, type: 'review' as const }));
        let merged = [...postsRes.data, ...reviewsTagged];

        // Filter out content authored by anyone the viewer blocked OR who blocked them.
        if (opts.userId) {
            const hidden = await this.safety.getHiddenUserIds(opts.userId);
            if (hidden.size > 0) {
                merged = merged.filter((m: any) => !hidden.has(m.authorId));
            }
        }

        // Optional hashtag filter (matches in title/body case-insensitive).
        if (opts.hashtag) {
            const needle = ('#' + opts.hashtag.replace(/^#/, '')).toLowerCase();
            merged = merged.filter((m: any) => {
                const hay = `${m.title || ''}\n${m.body || ''}`.toLowerCase();
                return hay.includes(needle);
            });
        }

        // Engagement-weighted score with time decay — the "Hot" / "For You" ranking.
        //   score = (upvotes - downvotes) + 1.2*comments + 0.6*saves + 0.4*reactions
        //   weighted by an age-decay factor: half-weight at ~36h, near zero past 14d.
        // For 'top', no time decay — pure quality over the window.
        const HALF_LIFE_HOURS = 36;
        const decay = (createdAt: any): number => {
            const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
            if (ageHours <= 0) return 1;
            return Math.pow(0.5, ageHours / HALF_LIFE_HOURS);
        };
        const engagement = (a: any): number =>
            (a.upvotes || 0)
            - (a.downvotes || 0)
            + 1.2 * (a.commentCount || 0)
            + 0.6 * (a.savesCount || a.saveCount || 0)
            + 0.4 * (a.reactionsCount || a.reactionCount || 0)
            + 0.8 * (a.repostCount || 0);
        const hotScore = (a: any): number => engagement(a) * decay(a.createdAt);

        // Freshness boost: content < 1h gets extra visibility (real-time pulse)
        const freshnessBoost = (a: any): number => {
            const ageHours = (Date.now() - new Date(a.createdAt).getTime()) / 3_600_000;
            if (ageHours < 1) return 1.4;   // +40% for first hour
            if (ageHours < 4) return 1.15;  // +15% for first 4 hours
            return 1;
        };

        // ─── "For You": hot score × creator-tier boost × interest match ───
        // Paid creators get amplified reach (transparent value exchange — Free is
        // never hidden, just not boosted), and items matching the viewer's interests
        // surface higher. Falls back to plain hot when the viewer is anonymous.
        const viewerInterests = new Set<string>();
        const viewerCities = new Set<string>();
        if (sort === 'foryou' && opts.userId) {
            const u = await this.users.findOne({ where: { id: opts.userId }, select: ['interests'] as any });
            for (const it of (u?.interests || [])) viewerInterests.add(String(it).toLowerCase());
            // Real behavior signal: cities the viewer has actually visited (place_visits).
            const visitRows = await this.placeVisits.createQueryBuilder('v')
                .select('DISTINCT v.city', 'city')
                .where('v.userId = :id AND v.city IS NOT NULL', { id: opts.userId })
                .getRawMany();
            for (const r of visitRows) viewerCities.add(String(r.city).toLowerCase());
        }
        const tierBoost = (a: any): number => {
            const author = a.author || a.user;
            const plan = author ? effectivePlan(author) : 'free';
            return plan === 'business' ? 1.5 : plan === 'premium' ? 1.2 : 1;
        };
        const interestBoost = (a: any): number => {
            if (viewerInterests.size === 0 && viewerCities.size === 0) return 1;
            let matches = 0;
            if (viewerInterests.size) {
                const tags = [
                    ...(Array.isArray(a.tags) ? a.tags : []),
                    a.category,
                    a.place?.category?.name,
                ].filter(Boolean).map((s: string) => String(s).toLowerCase());
                for (const t of tags) if (viewerInterests.has(t)) matches++;
            }
            if (viewerCities.size) {
                // Affinity for content about cities the viewer has been to.
                const cities = [a.city, a.location, a.place?.city]
                    .filter(Boolean).map((s: string) => String(s).toLowerCase());
                if (cities.some((c) => viewerCities.has(c))) matches++;
            }
            return 1 + 0.25 * Math.min(matches, 2); // up to +50%
        };
        // +0.5 floor so brand-new, zero-engagement posts still differentiate by tier/interest.
        const forYouScore = (a: any): number => (hotScore(a) + 0.5) * tierBoost(a) * interestBoost(a) * freshnessBoost(a);

        if (sort === 'foryou') {
            merged.sort((a: any, b: any) => {
                const sb = forYouScore(b); const sa = forYouScore(a);
                if (sb !== sa) return sb - sa;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            // Diversity: cap same-author content to 2 per page window
            const authorCounts = new Map<string, number>();
            const diverse: any[] = [];
            for (const item of merged) {
                const aid = item.authorId || item.userId || 'unknown';
                const count = authorCounts.get(aid) || 0;
                if (count < 2) {
                    diverse.push(item);
                    authorCounts.set(aid, count + 1);
                }
            }
            merged = diverse;
        } else if (sort === 'hot') {
            merged.sort((a: any, b: any) => {
                const sb = hotScore(b); const sa = hotScore(a);
                if (sb !== sa) return sb - sa;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
        } else if (sort === 'top') {
            merged.sort((a: any, b: any) => {
                const sb = engagement(b); const sa = engagement(a);
                if (sb !== sa) return sb - sa;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
        } else {
            merged.sort((a: any, b: any) => {
                const ta = new Date(a.createdAt).getTime();
                const tb = new Date(b.createdAt).getTime();
                if (ta !== tb) return tb - ta;
                return String(a.id).localeCompare(String(b.id));
            });
        }

        const offset = (page - 1) * limit;
        let pageItems = merged.slice(offset, offset + limit);

        // Inject sponsored ads — one every 4 items. Try 'feed' placement first, fall back to 'home'.
        const feedAds = await this.ads.findActive('feed').catch(() => [] as any[]);
        const homeAds = (feedAds && feedAds.length) ? feedAds : await this.ads.findActive('home').catch(() => [] as any[]);
        const adPool = (homeAds || []).filter((a: any) => a.isActive);
        if (adPool.length > 0) {
            const out: any[] = [];
            for (let i = 0; i < pageItems.length; i++) {
                out.push(pageItems[i]);
                if ((i + 1) % 4 === 0) {
                    const ad = adPool[Math.floor(Math.random() * adPool.length)];
                    // House ads (our own promos) point at internal routes and are
                    // labeled honestly — never "Sponsored". Paid partners use https.
                    const isHouse = !/^https?:\/\//i.test(ad.targetUrl || '');
                    out.push({
                        id: `ad-${ad.id}-${page}-${i}`,
                        type: 'ad' as const,
                        adId: ad.id,
                        title: ad.title,
                        body: ad.description,
                        cta: isHouse ? 'Open' : 'Learn More',
                        ctaUrl: ad.targetUrl,
                        images: ad.imageUrl ? [ad.imageUrl] : [],
                        sponsor: ad.advertiserName || 'Sponsored',
                        isHouse,
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

    /**
     * Scan recent posts + reviews for #hashtags and return the top N by frequency.
     * Stop-word filtered, case-folded, 30-day window.
     */
    async trendingHashtags(limit = 8) {
        const lim = Math.max(1, Math.min(30, limit));
        const days = 30;

        // Pull a generous window — small platform, cheap scan
        const [postsRes, reviewsRes] = await Promise.all([
            this.posts.list({ page: 1, limit: 200, sort: 'new' }).catch(() => ({ data: [] })),
            this.reviews.findFeed({ page: 1, limit: 200, sort: 'new' }).catch(() => ({ data: [] })),
        ]);
        const items = [...((postsRes as any).data || []), ...((reviewsRes as any).data || [])];
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

        const counts = new Map<string, { count: number; original: string; lastAt: number }>();
        const TAG_RE = /#([\p{L}\p{N}_]{2,40})/gu;

        for (const item of items) {
            const at = new Date(item.createdAt).getTime();
            if (!Number.isFinite(at) || at < cutoff) continue;
            const blob = `${item.title || ''} ${item.body || ''}`;
            let m: RegExpExecArray | null;
            while ((m = TAG_RE.exec(blob)) !== null) {
                const raw = m[1];
                const key = raw.toLowerCase();
                const prev = counts.get(key);
                if (prev) {
                    prev.count++;
                    if (at > prev.lastAt) { prev.lastAt = at; prev.original = raw; }
                } else {
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
        // Featured places become "stories" at top of feed.
        const placesPage = await this.places
            .findAll({ limit, featured: 'true', sortBy: 'rating', order: 'DESC' } as any)
            .catch(() => null);
        const featured = (placesPage?.data || []).slice(0, limit);
        return {
            stories: featured.map((p: any) => ({
                id: p.id,
                kind: 'place' as const,
                title: p.name,
                subtitle: p.city,
                image: p.coverImage || (p.images && p.images[0]) || null,
                slug: p.slug,
            })),
        };
    }
}
