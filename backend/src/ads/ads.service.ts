import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ad, AdPlacement } from './ad.entity';

@Injectable()
export class AdsService {
    constructor(
        @InjectRepository(Ad)
        private adsRepo: Repository<Ad>,
    ) {}

    async findActive(placement?: string) {
        const where: any = { isActive: true };
        if (placement) where.placement = placement;
        return this.adsRepo.find({ where, order: { createdAt: 'DESC' } });
    }

    async findAll() {
        return this.adsRepo.find({ order: { createdAt: 'DESC' } });
    }

    async findOne(id: string) {
        const ad = await this.adsRepo.findOne({ where: { id } });
        if (!ad) throw new NotFoundException('Ad not found');
        return ad;
    }

    async create(data: Partial<Ad>) {
        return this.adsRepo.save(this.adsRepo.create(data));
    }

    async update(id: string, data: Partial<Ad>) {
        await this.findOne(id);
        await this.adsRepo.update(id, data);
        return this.findOne(id);
    }

    async remove(id: string) {
        await this.findOne(id);
        await this.adsRepo.delete(id);
        return { message: 'Ad deleted' };
    }

    async trackImpression(id: string) {
        await this.adsRepo.increment({ id }, 'impressions', 1);
    }

    async trackClick(id: string) {
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
        if (count > 0) return;

        const ads = [
            {
                title: 'Discover Djerba — Island Paradise',
                imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
                targetUrl: 'https://www.visitdjerba.com',
                advertiserName: 'Visit Djerba',
                placement: AdPlacement.HOME,
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
                placement: AdPlacement.DETAIL,
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
                placement: AdPlacement.FEED,
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
                placement: AdPlacement.SEARCH,
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
}
