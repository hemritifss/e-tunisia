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
let OgController = class OgController {
    constructor(config, users, places, posts, trips) {
        this.config = config;
        this.users = users;
        this.places = places;
        this.posts = posts;
        this.trips = trips;
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
        res.send(renderOgHtml({
            title: `${name} — Tunisia Travel Passport`,
            description: user?.bio
                || `Follow ${name}'s journey across Tunisia — stamps, reviews and trips on e-Tunisia.`,
            image: `${this.apiOrigin(req)}/api/v1/users/by-handle/${encodeURIComponent(handle)}/og.png`,
            canonical: `${this.webOrigin()}/u/${encodeURIComponent(handle)}`,
            largeCard: true,
        }));
    }
    async place(id, req, res) {
        const place = await this.places.findOne({ where: { id } }).catch(() => null);
        res.send(renderOgHtml({
            title: place ? `${place.name} — ${place.city}, Tunisia` : 'Discover Tunisia',
            description: place?.description?.slice(0, 200)
                || 'Places, tips and reviews from travelers across Tunisia.',
            image: this.absolutize(place?.coverImage || place?.images?.[0], req),
            canonical: `${this.webOrigin()}/place/${encodeURIComponent(id)}`,
            largeCard: true,
        }));
    }
    async post(id, req, res) {
        const post = await this.posts.findOne({ where: { id } }).catch(() => null);
        const author = post?.author?.fullName;
        res.send(renderOgHtml({
            title: post?.title || (author ? `${author} on e-Tunisia` : 'A moment from Tunisia'),
            description: post?.body?.slice(0, 200) || 'Shared on e-Tunisia — Tunisia, told by the people who live it.',
            image: this.absolutize(post?.images?.[0] || post?.author?.avatar, req),
            canonical: `${this.webOrigin()}/post/${encodeURIComponent(id)}`,
            largeCard: !!post?.images?.length,
        }));
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
            image: this.absolutize(cover, req),
            canonical: `${this.webOrigin()}/trip/${encodeURIComponent(slug)}`,
            largeCard: !!cover,
        }));
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
        typeorm_2.Repository])
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