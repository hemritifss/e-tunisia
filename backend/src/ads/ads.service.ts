import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Ad, AdPlacement } from './ad.entity';

/** Advertiser name reserved for e-Tunisia's own promos; feed labels these as house ads. */
export const HOUSE_ADVERTISER = 'e-Tunisia';

/** Impersonating brand ads shipped by an earlier seed — purged on boot (see seed()). */
const LEGACY_FAKE_ADVERTISERS = ['Ooredoo Tunisie', 'Tunisair', 'BIAT', 'Banque Zitouna'];

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
        // Purge any impersonating brand ads a previous build seeded — they must not
        // survive, even on an already-populated DB (trust > "table already seeded").
        await this.adsRepo.delete({ advertiserName: In(LEGACY_FAKE_ADVERTISERS) });

        const count = await this.adsRepo.count();
        if (count > 0) return;

        // House ads only. We do NOT ship fake third-party campaigns (impersonating
        // real brands with stock photos destroys trust). These promote e-Tunisia's
        // own features, carry branded self-contained creatives, and point at internal
        // routes — the feed labels them "e-Tunisia", never "Sponsored". Real paid
        // partners get created via the admin API with an external targetUrl.
        const ads: Partial<Ad>[] = [
            {
                title: 'Plan your whole Tunisia trip in 5 minutes',
                imageUrl: AdsService.houseBanner('#3d6c9e', '#2a4d73', AdsService.GLYPHS.planner),
                targetUrl: '/ai-planner',
                advertiserName: HOUSE_ADVERTISER,
                placement: AdPlacement.FEED,
                description: 'Tell us your dates and vibe — the AI planner builds a day-by-day itinerary with real road routes and drive times. Free, no account needed.',
                costPerClick: 0,
                budget: 0,
                isActive: true,
            },
            {
                title: 'Be one of the first 1,000 Founders',
                imageUrl: AdsService.houseBanner('#b45c3f', '#7a3f2b', AdsService.GLYPHS.founder),
                targetUrl: '/register',
                advertiserName: HOUSE_ADVERTISER,
                placement: AdPlacement.HOME,
                description: 'Founder passports are numbered and gold-trimmed — forever. Once №1000 is claimed, they are gone. Create your account and claim your number.',
                costPerClick: 0,
                budget: 0,
                isActive: true,
            },
            {
                title: '800+ real places on one map',
                imageUrl: AdsService.houseBanner('#4a7c59', '#2f5d43', AdsService.GLYPHS.map),
                targetUrl: '/map',
                advertiserName: HOUSE_ADVERTISER,
                placement: AdPlacement.DETAIL,
                description: 'Every beach, medina, ruin and hidden gem — mapped with real photos and reviews. Find what is worth your time near you.',
                costPerClick: 0,
                budget: 0,
                isActive: true,
            },
            {
                title: 'Know a spot we are missing? Add it',
                imageUrl: AdsService.houseBanner('#c98a2b', '#8a6a1f', AdsService.GLYPHS.contribute),
                targetUrl: '/explore',
                advertiserName: HOUSE_ADVERTISER,
                placement: AdPlacement.SEARCH,
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

    // ── Branded house-ad creatives ───────────────────────────────────────────
    // Self-contained inline-SVG banners (no network, never 404). White line-art
    // glyph on a two-tone brand gradient + the e-Tunisia wordmark; the message
    // lives in the ad title/body, so the creative stays clean across placements.
    private static readonly GLYPHS = {
        planner: "<path d='M12 3l2.1 4.5L19 8l-3.5 3.4.9 4.9L12 14l-4.4 2.3.9-4.9L5 8l4.9-.5z'/>",
        founder: "<rect x='5' y='3.5' width='14' height='17' rx='2'/><circle cx='12' cy='10' r='3'/><path d='M8.5 17c.6-2 2-3 3.5-3s2.9 1 3.5 3'/>",
        map: "<path d='M12 21s-6.5-5.8-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 15.2 12 21 12 21z'/><circle cx='12' cy='10.5' r='2.4'/>",
        contribute: "<circle cx='12' cy='12' r='8.5'/><path d='M12 8v8M8 12h8'/>",
    };

    private static houseBanner(from: string, to: string, glyph: string): string {
        const svg =
            `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='360' viewBox='0 0 800 360'>` +
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
}
