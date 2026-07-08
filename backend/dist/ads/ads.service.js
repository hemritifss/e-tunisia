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
var AdsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdsService = exports.HOUSE_ADVERTISER = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ad_entity_1 = require("./ad.entity");
exports.HOUSE_ADVERTISER = 'e-Tunisia';
const LEGACY_FAKE_ADVERTISERS = ['Ooredoo Tunisie', 'Tunisair', 'BIAT', 'Banque Zitouna'];
let AdsService = AdsService_1 = class AdsService {
    constructor(adsRepo) {
        this.adsRepo = adsRepo;
    }
    async findActive(placement) {
        const where = { isActive: true };
        if (placement)
            where.placement = placement;
        return this.adsRepo.find({ where, order: { createdAt: 'DESC' } });
    }
    async findAll() {
        return this.adsRepo.find({ order: { createdAt: 'DESC' } });
    }
    async findOne(id) {
        const ad = await this.adsRepo.findOne({ where: { id } });
        if (!ad)
            throw new common_1.NotFoundException('Ad not found');
        return ad;
    }
    async create(data) {
        return this.adsRepo.save(this.adsRepo.create(data));
    }
    async update(id, data) {
        await this.findOne(id);
        await this.adsRepo.update(id, data);
        return this.findOne(id);
    }
    async remove(id) {
        await this.findOne(id);
        await this.adsRepo.delete(id);
        return { message: 'Ad deleted' };
    }
    async trackImpression(id) {
        await this.adsRepo.increment({ id }, 'impressions', 1);
    }
    async trackClick(id) {
        const ad = await this.findOne(id);
        ad.clicks += 1;
        ad.spent = Number(ad.spent) + Number(ad.costPerClick);
        if (Number(ad.budget) > 0 && Number(ad.spent) >= Number(ad.budget)) {
            ad.isActive = false;
        }
        return this.adsRepo.save(ad);
    }
    async getStats() {
        const result = await this.adsRepo
            .createQueryBuilder('ad')
            .select('SUM(ad.spent)', 'totalRevenue')
            .addSelect('SUM(ad.clicks)', 'totalClicks')
            .addSelect('SUM(ad.impressions)', 'totalImpressions')
            .addSelect('COUNT(ad.id)', 'totalAds')
            .getRawOne();
        return result;
    }
    async seed() {
        await this.adsRepo.delete({ advertiserName: (0, typeorm_2.In)(LEGACY_FAKE_ADVERTISERS) });
        const count = await this.adsRepo.count();
        if (count > 0)
            return;
        const ads = [
            {
                title: 'Plan your whole Tunisia trip in 5 minutes',
                imageUrl: AdsService_1.houseBanner('#3d6c9e', '#2a4d73', AdsService_1.GLYPHS.planner),
                targetUrl: '/ai-planner',
                advertiserName: exports.HOUSE_ADVERTISER,
                placement: ad_entity_1.AdPlacement.FEED,
                description: 'Tell us your dates and vibe — the AI planner builds a day-by-day itinerary with real road routes and drive times. Free, no account needed.',
                costPerClick: 0,
                budget: 0,
                isActive: true,
            },
            {
                title: 'Be one of the first 1,000 Founders',
                imageUrl: AdsService_1.houseBanner('#b45c3f', '#7a3f2b', AdsService_1.GLYPHS.founder),
                targetUrl: '/register',
                advertiserName: exports.HOUSE_ADVERTISER,
                placement: ad_entity_1.AdPlacement.HOME,
                description: 'Founder passports are numbered and gold-trimmed — forever. Once №1000 is claimed, they are gone. Create your account and claim your number.',
                costPerClick: 0,
                budget: 0,
                isActive: true,
            },
            {
                title: '800+ real places on one map',
                imageUrl: AdsService_1.houseBanner('#4a7c59', '#2f5d43', AdsService_1.GLYPHS.map),
                targetUrl: '/map',
                advertiserName: exports.HOUSE_ADVERTISER,
                placement: ad_entity_1.AdPlacement.DETAIL,
                description: 'Every beach, medina, ruin and hidden gem — mapped with real photos and reviews. Find what is worth your time near you.',
                costPerClick: 0,
                budget: 0,
                isActive: true,
            },
            {
                title: 'Know a spot we are missing? Add it',
                imageUrl: AdsService_1.houseBanner('#c98a2b', '#8a6a1f', AdsService_1.GLYPHS.contribute),
                targetUrl: '/explore',
                advertiserName: exports.HOUSE_ADVERTISER,
                placement: ad_entity_1.AdPlacement.SEARCH,
                description: 'Put your city on the map. Share a hidden gem — a photo, a pin, one line — earn XP and progress toward the Gem Hunter badge.',
                costPerClick: 0,
                budget: 0,
                isActive: true,
            },
        ];
        for (const ad of ads) {
            await this.adsRepo.save(this.adsRepo.create(ad));
        }
    }
    static houseBanner(from, to, glyph) {
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='360' viewBox='0 0 800 360'>` +
            `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
            `<stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/>` +
            `</linearGradient></defs>` +
            `<rect width='800' height='360' fill='url(#g)'/>` +
            `<g transform='translate(340 60) scale(10)' fill='none' stroke='#ffffff' ` +
            `stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round' opacity='0.9'>${glyph}</g>` +
            `<text x='400' y='330' text-anchor='middle' font-family='Georgia, serif' ` +
            `font-size='26' fill='rgba(255,255,255,0.85)' letter-spacing='2'>e-Tunisia</text>` +
            `</svg>`;
        return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    }
};
exports.AdsService = AdsService;
AdsService.GLYPHS = {
    planner: "<path d='M12 3l2.1 4.5L19 8l-3.5 3.4.9 4.9L12 14l-4.4 2.3.9-4.9L5 8l4.9-.5z'/>",
    founder: "<rect x='5' y='3.5' width='14' height='17' rx='2'/><circle cx='12' cy='10' r='3'/><path d='M8.5 17c.6-2 2-3 3.5-3s2.9 1 3.5 3'/>",
    map: "<path d='M12 21s-6.5-5.8-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 15.2 12 21 12 21z'/><circle cx='12' cy='10.5' r='2.4'/>",
    contribute: "<circle cx='12' cy='12' r='8.5'/><path d='M12 8v8M8 12h8'/>",
};
exports.AdsService = AdsService = AdsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ad_entity_1.Ad)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AdsService);
//# sourceMappingURL=ads.service.js.map