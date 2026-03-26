import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sponsor, SponsorTier } from './sponsor.entity';

@Injectable()
export class SponsorsService {
    constructor(
        @InjectRepository(Sponsor)
        private sponsorsRepo: Repository<Sponsor>,
    ) {}

    async findAll() {
        return this.sponsorsRepo.find({ order: { tier: 'ASC', createdAt: 'DESC' } });
    }

    async findActive() {
        return this.sponsorsRepo.find({
            where: { isActive: true },
            order: { tier: 'ASC', createdAt: 'DESC' },
        });
    }

    async findOne(id: string) {
        const sponsor = await this.sponsorsRepo.findOne({ where: { id } });
        if (!sponsor) throw new NotFoundException('Sponsor not found');
        return sponsor;
    }

    async create(data: Partial<Sponsor>) {
        const sponsor = this.sponsorsRepo.create(data);
        return this.sponsorsRepo.save(sponsor);
    }

    async update(id: string, data: Partial<Sponsor>) {
        await this.findOne(id);
        await this.sponsorsRepo.update(id, data);
        return this.findOne(id);
    }

    async remove(id: string) {
        await this.findOne(id);
        await this.sponsorsRepo.delete(id);
        return { message: 'Sponsor deleted' };
    }

    async trackClick(id: string) {
        const sponsor = await this.findOne(id);
        sponsor.clickCount += 1;
        return this.sponsorsRepo.save(sponsor);
    }

    async trackImpression(id: string) {
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
        if (count > 0) return;

        const sponsors = [
            {
                name: 'Tunisair',
                logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Tunisair_logo.svg/1200px-Tunisair_logo.svg.png',
                description: 'Tunisia\'s national airline — connecting the world to Tunisia with comfort and heritage.',
                website: 'https://www.tunisair.com',
                tier: SponsorTier.GOLD,
                contactEmail: 'partnerships@tunisair.com.tn',
                amountPaid: 5000,
                isActive: true,
            },
            {
                name: 'Office National du Tourisme Tunisien',
                logo: 'https://www.tourisme.gov.tn/sites/default/files/logo_ontt.png',
                description: 'The national tourism board promoting Tunisia as a world-class travel destination.',
                website: 'https://www.tourisme.gov.tn',
                tier: SponsorTier.GOLD,
                contactEmail: 'contact@ontt.tourism.tn',
                amountPaid: 8000,
                isActive: true,
            },
            {
                name: 'Dar El Jeld Restaurant',
                logo: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200',
                description: 'Fine Tunisian cuisine in a restored 18th-century palace in the Medina of Tunis.',
                website: 'https://www.dareljeld.com',
                tier: SponsorTier.SILVER,
                contactEmail: 'info@dareljeld.com',
                amountPaid: 2000,
                isActive: true,
            },
            {
                name: 'La Badira Hotel',
                logo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200',
                description: 'Five-star Art Deco beachfront luxury hotel in Hammamet.',
                website: 'https://www.labadira.com',
                tier: SponsorTier.SILVER,
                contactEmail: 'marketing@labadira.com',
                amountPaid: 3000,
                isActive: true,
            },
            {
                name: 'Artisanat de Tunisie',
                logo: 'https://images.unsplash.com/photo-1590071089561-8f55e0b2b866?w=200',
                description: 'Supporting local artisans and traditional Tunisian craftsmanship.',
                website: 'https://www.artisanat.nat.tn',
                tier: SponsorTier.BRONZE,
                contactEmail: 'contact@artisanat.nat.tn',
                amountPaid: 1000,
                isActive: true,
            },
        ];

        for (const s of sponsors) {
            await this.sponsorsRepo.save(this.sponsorsRepo.create(s));
        }
    }
}
