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
exports.OgController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const place_entity_1 = require("../places/place.entity");
const post_entity_1 = require("../posts/post.entity");
const trip_plan_entity_1 = require("../itineraries/trip-plan.entity");
const og_service_1 = require("./og.service");
const wrapped_service_1 = require("../wrapped/wrapped.service");
const mapping_service_1 = require("../mapping/mapping.service");
let OgController = class OgController {
    constructor(config, users, places, posts, trips, og, wrapped, mapping) {
        this.config = config;
        this.users = users;
        this.places = places;
        this.posts = posts;
        this.trips = trips;
        this.og = og;
        this.wrapped = wrapped;
        this.mapping = mapping;
    }
    webOrigin() {
        return (this.config.get('FRONTEND_URL') || 'http://localhost:5173').replace(/\/+$/, '');
    }
    apiOrigin(req) {
        const proto = req.headers['x-forwarded-proto']?.split(',')[0] || req.protocol || 'http';
        return `${proto}://${req.get('host')}`;
    }
    absolutize(image, req) {
        if (!image)
            return null;
        if (/^https?:\/\//i.test(image))
            return image;
        return `${this.apiOrigin(req)}${image.startsWith('/') ? '' : '/'}${image}`;
    }
    async user(rawHandle, req, res) {
        const handle = (rawHandle || '').toLowerCase();
        const user = await this.users.findOne({ where: { handle } }).catch(() => null);
        const name = user?.fullName || `@${handle}`;
        const ref = typeof req.query.ref === 'string' ? req.query.ref.trim().toLowerCase() : '';
        const refQs = ref ? `?ref=${encodeURIComponent(ref)}` : '';
        res.send(renderOgHtml({
            title: `${name} — Tunisia Travel Passport`,
            description: user?.bio
                || `Follow ${name}'s journey across Tunisia — stamps, reviews and trips on e-Tunisia.`,
            image: `${this.apiOrigin(req)}/api/v1/users/by-handle/${encodeURIComponent(handle)}/og.png`,
            canonical: `${this.webOrigin()}/u/${encodeURIComponent(handle)}${refQs}`,
            largeCard: true,
        }));
    }
    async place(id, req, res) {
        const place = await this.places.findOne({ where: { id } }).catch(() => null);
        res.send(renderOgHtml({
            title: place ? `${place.name} — ${place.city}, Tunisia` : 'Discover Tunisia',
            description: place?.description?.slice(0, 200)
                || 'Places, tips and reviews from travelers across Tunisia.',
            image: place
                ? `${this.apiOrigin(req)}/api/v1/og/place/${encodeURIComponent(id)}/image.png`
                : this.absolutize(place?.coverImage || place?.images?.[0], req),
            canonical: `${this.webOrigin()}/place/${encodeURIComponent(id)}`,
            largeCard: true,
        }));
    }
    async placeImage(id, req, res) {
        const place = await this.places.findOne({ where: { id } }).catch(() => null);
        const rawPhoto = this.absolutize(place?.coverImage || place?.images?.[0], req);
        try {
            if (!place)
                throw new Error('not found');
            res.send(await this.og.renderPlacePostcard({
                id: place.id,
                name: place.name,
                city: place.city,
                governorate: place.governorate,
                rating: place.rating,
                reviewCount: place.reviewCount,
                imageUrl: rawPhoto,
            }));
        }
        catch {
            if (rawPhoto) {
                res.redirect(302, rawPhoto);
                return;
            }
            res.setHeader('Content-Type', 'image/png');
            res.send(Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000000000200015c34a40d0000000049454e44ae426082', 'hex'));
        }
    }
    async post(id, req, res) {
        const post = await this.posts.findOne({ where: { id } }).catch(() => null);
        const author = post?.author?.fullName;
        res.send(renderOgHtml({
            title: post?.title || (author ? `${author} on e-Tunisia` : 'A moment from Tunisia'),
            description: post?.body?.slice(0, 200) || 'Shared on e-Tunisia — Tunisia, told by the people who live it.',
            image: post?.images?.length
                ? `${this.apiOrigin(req)}/api/v1/og/post/${encodeURIComponent(id)}/image.png`
                : this.absolutize(post?.author?.avatar, req),
            canonical: `${this.webOrigin()}/post/${encodeURIComponent(id)}`,
            largeCard: !!post?.images?.length,
        }));
    }
    async postImage(id, req, res) {
        const post = await this.posts.findOne({ where: { id } }).catch(() => null);
        const rawPhoto = this.absolutize(post?.images?.[0], req);
        try {
            if (!post)
                throw new Error('not found');
            res.send(await this.og.renderPostPostcard({
                id: post.id,
                title: post.title,
                body: post.body,
                location: post.location,
                authorName: post.author?.fullName,
                authorHandle: post.author?.handle,
                imageUrl: rawPhoto,
            }));
        }
        catch {
            if (rawPhoto) {
                res.redirect(302, rawPhoto);
                return;
            }
            res.setHeader('Content-Type', 'image/png');
            res.send(Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000000000200015c34a40d0000000049454e44ae426082', 'hex'));
        }
    }
    async trip(slug, req, res) {
        const trip = await this.trips.findOne({ where: { slug } }).catch(() => null);
        const stops = Array.isArray(trip?.stops) ? trip.stops : [];
        const stopCount = stops.length;
        const days = trip?.days || 1;
        const cover = stops.map((s) => s.placeCover).find(Boolean) || null;
        const cities = Array.from(new Set(stops.map((s) => s.placeCity).filter(Boolean)));
        const citiesLabel = cities.slice(0, 3).join(', ');
        const parts = [
            `${stopCount} ${stopCount === 1 ? 'stop' : 'stops'}`,
            `${days} ${days === 1 ? 'day' : 'days'}`,
        ];
        if (citiesLabel)
            parts.push(citiesLabel);
        res.send(renderOgHtml({
            title: trip ? `${trip.title} — a Tunisia trip` : 'Plan your Tunisia trip',
            description: trip
                ? `${parts.join(' · ')}. See the route, drive times and stops on e-Tunisia.`
                : 'Build a day-by-day Tunisia itinerary with real road routes — free on e-Tunisia.',
            image: cover
                ? `${this.apiOrigin(req)}/api/v1/og/trip/${encodeURIComponent(slug)}/image.png`
                : null,
            canonical: `${this.webOrigin()}/trip/${encodeURIComponent(slug)}`,
            largeCard: !!cover,
        }));
    }
    async tripImage(slug, req, res) {
        const trip = await this.trips.findOne({ where: { slug } }).catch(() => null);
        const stops = Array.isArray(trip?.stops) ? trip.stops : [];
        const rawCover = this.absolutize(stops.map((s) => s.placeCover).find(Boolean), req);
        try {
            if (!trip)
                throw new Error('not found');
            res.send(await this.og.renderTripPostcard({
                slug: trip.slug,
                title: trip.title,
                days: trip.days || 1,
                stops: stops.map((s) => ({
                    placeCity: s.placeCity,
                    placeCover: this.absolutize(s.placeCover, req) || undefined,
                })),
            }));
        }
        catch {
            if (rawCover) {
                res.redirect(302, rawCover);
                return;
            }
            res.setHeader('Content-Type', 'image/png');
            res.send(Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000000000200015c34a40d0000000049454e44ae426082', 'hex'));
        }
    }
    async cityQuiz(rawSlug, req, res) {
        const slug = (rawSlug || '').toLowerCase();
        const a = og_service_1.QUIZ_ARCHETYPES[slug];
        const title = a ? `I'm ${a.city} ${a.tagline ? `— ${a.tagline}` : ''} · Which Tunisian city are you?` : 'Which Tunisian city are you?';
        res.send(renderOgHtml({
            title,
            description: a
                ? `${a.traits.join(' · ')}. Take the 60-second quiz and find your Tunisian city on e-Tunisia.`
                : 'Answer 7 quick questions and discover which Tunisian city matches your soul — free on e-Tunisia.',
            image: a ? `${this.apiOrigin(req)}/api/v1/og/city-quiz/${encodeURIComponent(slug)}/image.png` : null,
            canonical: a ? `${this.webOrigin()}/city-quiz?r=${encodeURIComponent(slug)}` : `${this.webOrigin()}/city-quiz`,
            largeCard: !!a,
        }));
    }
    async cityQuizImage(rawSlug, res) {
        const a = og_service_1.QUIZ_ARCHETYPES[(rawSlug || '').toLowerCase()];
        try {
            if (!a)
                throw new Error('unknown archetype');
            res.send(await this.og.renderCityQuizCard(a));
        }
        catch {
            const transparent = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000000000200015c34a40d0000000049454e44ae426082', 'hex');
            res.send(transparent);
        }
    }
    async wrappedOg(rawHandle, req, res) {
        const handle = (rawHandle || '').toLowerCase();
        const w = await this.wrapped.build(handle).catch(() => null);
        const name = w?.fullName || `@${handle}`;
        res.send(renderOgHtml({
            title: w ? `${name}'s ${w.period.label} in Tunisia — ${w.personality.label}` : 'Your Summer in Tunisia — Wrapped',
            description: w && !w.isEmpty
                ? `${w.stats.checkIns} check-ins · ${w.stats.citiesCount} cities · ${w.stats.governoratesCount} governorates. See the Wrapped and make yours on e-Tunisia.`
                : 'Your summer across Tunisia, wrapped up: cities, check-ins and your traveler personality. Free on e-Tunisia.',
            image: `${this.apiOrigin(req)}/api/v1/og/wrapped/${encodeURIComponent(handle)}/image.png`,
            canonical: `${this.webOrigin()}/wrapped/${encodeURIComponent(handle)}`,
            largeCard: true,
        }));
    }
    async wrappedImage(rawHandle, res) {
        try {
            const w = await this.wrapped.build((rawHandle || '').toLowerCase());
            res.send(await this.og.renderWrappedCard({
                fullName: w.fullName,
                periodLabel: w.period.label,
                personalityLabel: w.personality.label,
                stats: w.stats,
            }));
        }
        catch {
            const transparent = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000000000200015c34a40d0000000049454e44ae426082', 'hex');
            res.send(transparent);
        }
    }
    async mappingOg(req, res) {
        const s = await this.mapping.standings().catch(() => null);
        const leader = s?.governorates?.[0];
        res.send(renderOgHtml({
            title: s ? s.event.title : 'The Great Tunisia Mapping Weekend',
            description: s && leader
                ? `${leader.governorate} leads with ${leader.points} pts · ${s.totals.contributors} mappers · ${s.totals.gems} gems. Help your governorate win — on e-Tunisia.`
                : 'Every governorate racing to map Tunisia\'s hidden treasures. Join the live leaderboard on e-Tunisia.',
            image: `${this.apiOrigin(req)}/api/v1/og/mapping-weekend/image.png`,
            canonical: `${this.webOrigin()}/mapping-weekend`,
            largeCard: true,
        }));
    }
    async mappingImage(res) {
        try {
            const s = await this.mapping.standings();
            const statusLabel = s.status === 'live' ? 'Live leaderboard' : s.status === 'upcoming' ? 'Starting soon' : 'Final results';
            res.send(await this.og.renderMappingCard({
                title: s.event.title,
                statusLabel,
                leaders: s.governorates.map((g) => ({ governorate: g.governorate, points: g.points })),
                totals: { contributors: s.totals.contributors, gems: s.totals.gems },
            }));
        }
        catch {
            const transparent = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000000000200015c34a40d0000000049454e44ae426082', 'hex');
            res.send(transparent);
        }
    }
};
exports.OgController = OgController;
__decorate([
    (0, common_1.Get)('u/:handle'),
    (0, common_1.Header)('Content-Type', 'text/html; charset=utf-8'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400'),
    __param(0, (0, common_1.Param)('handle')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OgController.prototype, "user", null);
__decorate([
    (0, common_1.Get)('place/:id'),
    (0, common_1.Header)('Content-Type', 'text/html; charset=utf-8'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OgController.prototype, "place", null);
__decorate([
    (0, common_1.Get)('place/:id/image.png'),
    (0, common_1.Header)('Content-Type', 'image/png'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OgController.prototype, "placeImage", null);
__decorate([
    (0, common_1.Get)('post/:id'),
    (0, common_1.Header)('Content-Type', 'text/html; charset=utf-8'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OgController.prototype, "post", null);
__decorate([
    (0, common_1.Get)('post/:id/image.png'),
    (0, common_1.Header)('Content-Type', 'image/png'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OgController.prototype, "postImage", null);
__decorate([
    (0, common_1.Get)('trip/:slug'),
    (0, common_1.Header)('Content-Type', 'text/html; charset=utf-8'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OgController.prototype, "trip", null);
__decorate([
    (0, common_1.Get)('trip/:slug/image.png'),
    (0, common_1.Header)('Content-Type', 'image/png'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OgController.prototype, "tripImage", null);
__decorate([
    (0, common_1.Get)('city-quiz/:slug'),
    (0, common_1.Header)('Content-Type', 'text/html; charset=utf-8'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OgController.prototype, "cityQuiz", null);
__decorate([
    (0, common_1.Get)('city-quiz/:slug/image.png'),
    (0, common_1.Header)('Content-Type', 'image/png'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OgController.prototype, "cityQuizImage", null);
__decorate([
    (0, common_1.Get)('wrapped/:handle'),
    (0, common_1.Header)('Content-Type', 'text/html; charset=utf-8'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=1800, stale-while-revalidate=86400'),
    __param(0, (0, common_1.Param)('handle')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OgController.prototype, "wrappedOg", null);
__decorate([
    (0, common_1.Get)('wrapped/:handle/image.png'),
    (0, common_1.Header)('Content-Type', 'image/png'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=1800, stale-while-revalidate=86400'),
    __param(0, (0, common_1.Param)('handle')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OgController.prototype, "wrappedImage", null);
__decorate([
    (0, common_1.Get)('mapping-weekend'),
    (0, common_1.Header)('Content-Type', 'text/html; charset=utf-8'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=120, stale-while-revalidate=600'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OgController.prototype, "mappingOg", null);
__decorate([
    (0, common_1.Get)('mapping-weekend/image.png'),
    (0, common_1.Header)('Content-Type', 'image/png'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=120, stale-while-revalidate=600'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OgController.prototype, "mappingImage", null);
exports.OgController = OgController = __decorate([
    (0, common_1.Controller)('og'),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(place_entity_1.Place)),
    __param(3, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(4, (0, typeorm_1.InjectRepository)(trip_plan_entity_1.TripPlan)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        og_service_1.OgService,
        wrapped_service_1.WrappedService,
        mapping_service_1.MappingService])
], OgController);
function esc(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function renderOgHtml(o) {
    const image = o.image ? `
    <meta property="og:image" content="${esc(o.image)}" />
    <meta name="twitter:image" content="${esc(o.image)}" />` : '';
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>${esc(o.title)}</title>
    <meta name="description" content="${esc(o.description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="e-Tunisia" />
    <meta property="og:title" content="${esc(o.title)}" />
    <meta property="og:description" content="${esc(o.description)}" />
    <meta property="og:url" content="${esc(o.canonical)}" />${image}
    <meta name="twitter:card" content="${o.largeCard ? 'summary_large_image' : 'summary'}" />
    <meta name="twitter:title" content="${esc(o.title)}" />
    <meta name="twitter:description" content="${esc(o.description)}" />
    <link rel="canonical" href="${esc(o.canonical)}" />
    <!-- Humans get bounced to the app; crawlers only read the tags above. -->
    <meta http-equiv="refresh" content="0;url=${esc(o.canonical)}" />
    <script>location.replace(${JSON.stringify(o.canonical)});</script>
</head>
<body>
    <p>Redirecting to <a href="${esc(o.canonical)}">${esc(o.canonical)}</a>…</p>
</body>
</html>`;
}
//# sourceMappingURL=og.controller.js.map