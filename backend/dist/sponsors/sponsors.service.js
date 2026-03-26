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
exports.SponsorsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sponsor_entity_1 = require("./sponsor.entity");
let SponsorsService = class SponsorsService {
    constructor(sponsorsRepo) {
        this.sponsorsRepo = sponsorsRepo;
    }
    async findAll() {
        return this.sponsorsRepo.find({ order: { tier: 'ASC', createdAt: 'DESC' } });
    }
    async findActive() {
        return this.sponsorsRepo.find({
            where: { isActive: true },
            order: { tier: 'ASC', createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const sponsor = await this.sponsorsRepo.findOne({ where: { id } });
        if (!sponsor)
            throw new common_1.NotFoundException('Sponsor not found');
        return sponsor;
    }
    async create(data) {
        const sponsor = this.sponsorsRepo.create(data);
        return this.sponsorsRepo.save(sponsor);
    }
    async update(id, data) {
        await this.findOne(id);
        await this.sponsorsRepo.update(id, data);
        return this.findOne(id);
    }
    async remove(id) {
        await this.findOne(id);
        await this.sponsorsRepo.delete(id);
        return { message: 'Sponsor deleted' };
    }
    async trackClick(id) {
        const sponsor = await this.findOne(id);
        sponsor.clickCount += 1;
        return this.sponsorsRepo.save(sponsor);
    }
    async trackImpression(id) {
        await this.sponsorsRepo.increment({ id }, 'impressionCount', 1);
    }
    async getStats() {
        const total = await this.sponsorsRepo.count();
        const active = await this.sponsorsRepo.count({ where: { isActive: true } });
        const revenue = await this.sponsorsRepo
            .createQueryBuilder('s')
            .select('SUM(s.amountPaid)', 'totalRevenue')
            .getRawOne();
        return { total, active, totalRevenue: revenue?.totalRevenue || 0 };
    }
    async seed() {
        const count = await this.sponsorsRepo.count();
        if (count > 0)
            return;
        const sponsors = [
            {
                name: 'Tunisair',
                logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Tunisair_logo.svg/1200px-Tunisair_logo.svg.png',
                description: 'Tunisia\'s national airline — connecting the world to Tunisia with comfort and heritage.',
                website: 'https://www.tunisair.com',
                tier: sponsor_entity_1.SponsorTier.GOLD,
                contactEmail: 'partnerships@tunisair.com.tn',
                amountPaid: 5000,
                isActive: true,
            },
            {
                name: 'Office National du Tourisme Tunisien',
                logo: 'https://www.tourisme.gov.tn/sites/default/files/logo_ontt.png',
                description: 'The national tourism board promoting Tunisia as a world-class travel destination.',
                website: 'https://www.tourisme.gov.tn',
                tier: sponsor_entity_1.SponsorTier.GOLD,
                contactEmail: 'contact@ontt.tourism.tn',
                amountPaid: 8000,
                isActive: true,
            },
            {
                name: 'Dar El Jeld Restaurant',
                logo: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200',
                description: 'Fine Tunisian cuisine in a restored 18th-century palace in the Medina of Tunis.',
                website: 'https://www.dareljeld.com',
                tier: sponsor_entity_1.SponsorTier.SILVER,
                contactEmail: 'info@dareljeld.com',
                amountPaid: 2000,
                isActive: true,
            },
            {
                name: 'La Badira Hotel',
                logo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200',
                description: 'Five-star Art Deco beachfront luxury hotel in Hammamet.',
                website: 'https://www.labadira.com',
                tier: sponsor_entity_1.SponsorTier.SILVER,
                contactEmail: 'marketing@labadira.com',
                amountPaid: 3000,
                isActive: true,
            },
            {
                name: 'Artisanat de Tunisie',
                logo: 'https://images.unsplash.com/photo-1590071089561-8f55e0b2b866?w=200',
                description: 'Supporting local artisans and traditional Tunisian craftsmanship.',
                website: 'https://www.artisanat.nat.tn',
                tier: sponsor_entity_1.SponsorTier.BRONZE,
                contactEmail: 'contact@artisanat.nat.tn',
                amountPaid: 1000,
                isActive: true,
            },
        ];
        for (const s of sponsors) {
            await this.sponsorsRepo.save(this.sponsorsRepo.create(s));
        }
    }
};
exports.SponsorsService = SponsorsService;
exports.SponsorsService = SponsorsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sponsor_entity_1.Sponsor)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SponsorsService);
//# sourceMappingURL=sponsors.service.js.map