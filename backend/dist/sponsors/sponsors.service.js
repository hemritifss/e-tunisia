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
                logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Tunisair_logo.svg/300px-Tunisair_logo.svg.png',
                description: 'Tunisia\'s national airline — connecting the world to Tunisia with comfort and heritage.',
                website: 'https://www.tunisair.com',
                tier: sponsor_entity_1.SponsorTier.GOLD,
                contactEmail: 'partnerships@tunisair.com.tn',
                amountPaid: 8000,
                isActive: true,
            },
            {
                name: 'Ooredoo Tunisie',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Ooredoo_logo_English.svg/320px-Ooredoo_logo_English.svg.png',
                description: 'Enjoy the best 4G/5G network coverage across all tourist destinations in Tunisia.',
                website: 'https://www.ooredoo.tn',
                tier: sponsor_entity_1.SponsorTier.GOLD,
                contactEmail: 'sponsoring@ooredoo.tn',
                amountPaid: 10000,
                isActive: true,
            },
            {
                name: 'BIAT',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Banque_Internationale_Arabe_de_Tunisie_Logo.svg/300px-Banque_Internationale_Arabe_de_Tunisie_Logo.svg.png',
                description: 'Banque Internationale Arabe de Tunisie - The leading bank in Tunisia, ensuring your financial peace of mind during your stay.',
                website: 'https://www.biat.tn',
                tier: sponsor_entity_1.SponsorTier.GOLD,
                contactEmail: 'partenariat@biat.tn',
                amountPaid: 9000,
                isActive: true,
            },
            {
                name: 'Banque Zitouna',
                logo: 'https://upload.wikimedia.org/wikipedia/fr/5/5a/Banque_Zitouna_Logo.svg',
                description: 'Islamic Banking in Tunisia. Values and modern banking combined for our visitors and locals.',
                website: 'https://www.banquezitouna.com',
                tier: sponsor_entity_1.SponsorTier.SILVER,
                contactEmail: 'contact@banquezitouna.com',
                amountPaid: 4500,
                isActive: true,
            },
            {
                name: 'Orange Tunisie',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/200px-Orange_logo.svg.png',
                description: 'Stay connected anywhere in Tunisia with Orange Holiday prepaid SIMs.',
                website: 'https://www.orange.tn',
                tier: sponsor_entity_1.SponsorTier.SILVER,
                contactEmail: 'sponsors@orange.tn',
                amountPaid: 4000,
                isActive: true,
            },
            {
                name: 'Office National du Tourisme',
                logo: 'https://www.tourisme.gov.tn/sites/default/files/logo_ontt.png',
                description: 'The national tourism board promoting Tunisia as a world-class travel destination.',
                website: 'https://www.tourisme.gov.tn',
                tier: sponsor_entity_1.SponsorTier.SILVER,
                contactEmail: 'contact@ontt.tourism.tn',
                amountPaid: 5000,
                isActive: true,
            },
            {
                name: 'Safia',
                logo: 'https://sn-bg-tn-medias.s3.fr-par.scw.cloud/wp-content/uploads/2021/06/07130026/Safi.jpg',
                description: 'Tunisia\'s most trusted bottled water. Stay hydrated on your adventures.',
                website: 'https://www.sn-bg.com',
                tier: sponsor_entity_1.SponsorTier.BRONZE,
                contactEmail: 'marketing@sfbt.com.tn',
                amountPaid: 1500,
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