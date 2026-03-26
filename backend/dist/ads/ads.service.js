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
exports.AdsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ad_entity_1 = require("./ad.entity");
let AdsService = class AdsService {
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
        const count = await this.adsRepo.count();
        if (count > 0)
            return;
        const ads = [
            {
                title: 'Discover Djerba — Island Paradise',
                imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
                targetUrl: 'https://www.visitdjerba.com',
                advertiserName: 'Visit Djerba',
                placement: ad_entity_1.AdPlacement.HOME,
                description: 'Explore the largest island in North Africa — pristine beaches, ancient heritage, and vibrant street art.',
                costPerClick: 0.8,
                budget: 2000,
                isActive: true,
            },
            {
                title: 'Hammamet Luxury Resorts — Book Now',
                imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
                targetUrl: 'https://www.hammamet-hotels.com',
                advertiserName: 'Hammamet Hotels',
                placement: ad_entity_1.AdPlacement.DETAIL,
                description: 'Experience 5-star beachfront luxury. Special rates for e-Tunisia users.',
                costPerClick: 1.0,
                budget: 3000,
                isActive: true,
            },
            {
                title: 'Tunisian Olive Oil — Premium Export',
                imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacdc50f5a?w=800',
                targetUrl: 'https://www.tunisian-olive-oil.com',
                advertiserName: 'Tunisia Olive',
                placement: ad_entity_1.AdPlacement.FEED,
                description: 'Award-winning organic olive oil — direct from Tunisian groves to your table.',
                costPerClick: 0.5,
                budget: 1000,
                isActive: true,
            },
            {
                title: 'Sahara Desert Expeditions',
                imageUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800',
                targetUrl: 'https://www.sahara-adventures.tn',
                advertiserName: 'Sahara Adventures',
                placement: ad_entity_1.AdPlacement.SEARCH,
                description: 'Camel treks, dune bashing, star camping — authentic Saharan experiences.',
                costPerClick: 0.7,
                budget: 1500,
                isActive: true,
            },
        ];
        for (const ad of ads) {
            await this.adsRepo.save(this.adsRepo.create(ad));
        }
    }
};
exports.AdsService = AdsService;
exports.AdsService = AdsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ad_entity_1.Ad)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AdsService);
//# sourceMappingURL=ads.service.js.map