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
                title: 'Ooredoo Tourist SIM — Unlimited 5G',
                imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
                targetUrl: 'https://www.ooredoo.tn/Personal/fr/tourist-sim',
                advertiserName: 'Ooredoo Tunisie',
                placement: ad_entity_1.AdPlacement.HOME,
                description: 'Stay connected! Get your tourist SIM card now at the airport. Unlimited social media and 50GB data for 30 TND.',
                costPerClick: 1.2,
                budget: 5000,
                isActive: true,
            },
            {
                title: 'Fly Tunisair — Best Fares to Europe',
                imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
                targetUrl: 'https://www.tunisair.com/fr/offres',
                advertiserName: 'Tunisair',
                placement: ad_entity_1.AdPlacement.DETAIL,
                description: 'Discover our exclusive summer offers. Direct flights from Tunis to Paris, Rome, and Istanbul starting at 350 TND.',
                costPerClick: 1.5,
                budget: 8000,
                isActive: true,
            },
            {
                title: 'BIAT Travel Card — 0% Foreign Fees',
                imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
                targetUrl: 'https://www.biat.tn/cartes',
                advertiserName: 'BIAT',
                placement: ad_entity_1.AdPlacement.FEED,
                description: 'Pay safely everywhere in Tunisia with the BIAT prepaid travel card. No hidden fees, instant top-ups.',
                costPerClick: 0.9,
                budget: 4000,
                isActive: true,
            },
            {
                title: 'Banque Zitouna — Invest in Tunisia',
                imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
                targetUrl: 'https://www.banquezitouna.com/tre',
                advertiserName: 'Banque Zitouna',
                placement: ad_entity_1.AdPlacement.SEARCH,
                description: 'Special offers for Tunisians Residing Abroad (TRE). Islamic financing for your real estate projects back home.',
                costPerClick: 1.0,
                budget: 3500,
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