import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Place } from '../places/place.entity';
import { User } from '../users/user.entity';
import { BeachReport } from './beach-report.entity';
import { GamificationService } from '../gamification/gamification.service';

/**
 * "Famma 9nadel?" — the jellyfish & beach report (GROWTH §7).
 * In Tunisian summer this is a DAILY question. Community-updated conditions per
 * beach: jellyfish level, water, crowd — freshest report wins, decays after 24h.
 */

export interface BeachReportInput {
    jellyfish: 'none' | 'few' | 'lots';
    water?: 'clear' | 'seaweed' | 'murky';
    crowd?: 'empty' | 'ok' | 'packed';
    note?: string;
}

const JELLYFISH = new Set(['none', 'few', 'lots']);
const WATER = new Set(['clear', 'seaweed', 'murky']);
const CROWD = new Set(['empty', 'ok', 'packed']);

/** Governorates with a coastline — beach reports only make sense here. */
const COASTAL = new Set([
    'tunis', 'ariana', 'ben arous', 'nabeul', 'bizerte', 'jendouba',
    'sousse', 'monastir', 'mahdia', 'sfax', 'gabes', 'gabès', 'medenine', 'médenine',
]);

const FRESH_MS = 24 * 60 * 60 * 1000;   // a report counts as "current" for 24h
const XP_THROTTLE_MS = 3 * 60 * 60 * 1000; // reward fresh, distinct reports only

@Injectable()
export class BeachesService {
    constructor(
        @InjectRepository(Place) private readonly places: Repository<Place>,
        @InjectRepository(User) private readonly users: Repository<User>,
        @InjectRepository(BeachReport) private readonly reports: Repository<BeachReport>,
        private readonly gamification: GamificationService,
    ) {}

    private fold(s?: string): string {
        return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    }

    private isBeach(place: Place): boolean {
        const cat = this.fold((place as any).category?.name);
        const gov = this.fold(place.governorate);
        const name = this.fold(place.name);
        // Strong signal: the name literally says beach.
        if (/beach|plage|marsa|corniche|lido/.test(name)) return true;
        // The "Nature & Beaches" category also holds mountains, oases and springs —
        // so require a coastal governorate AND exclude obviously-inland features.
        const inland = /\bain |montagne| mont|jebel|jbel|forest|foret|gorge|barrage|\blac |lake|oasis|dune|sahara|source|grotte|\bcaves?\b|cascade|parc national|national park|lagoon|hot spring|thermal|\bhammam\b|medina|mosqu|kasbah|ribat|\bfort|musee|museum|ruins|ruine/;
        return cat.includes('beach') && COASTAL.has(gov) && !inland.test(name);
    }

    /** All beaches with their current condition (freshest report < 24h). */
    async list(governorate?: string) {
        // Postgres has no unaccent by default; do the coastal/beach filter in JS to
        // stay dependency-free (the beach set is small — a few hundred places max).
        const all = await this.places.find({
            where: { isActive: true, isApproved: true },
            relations: ['category'],
        });
        let beaches = all.filter((p) => this.isBeach(p));
        if (governorate) {
            const g = this.fold(governorate);
            beaches = beaches.filter((p) => this.fold(p.governorate) === g);
        }
        if (beaches.length === 0) return [];

        const ids = beaches.map((b) => b.id);
        const since = new Date(Date.now() - FRESH_MS);
        const recent = await this.reports
            .createQueryBuilder('r')
            .where('r.placeId IN (:...ids)', { ids })
            .andWhere('r.createdAt > :since', { since })
            .orderBy('r.createdAt', 'DESC')
            .getMany();

        const latest = new Map<string, BeachReport>();
        const todayCount = new Map<string, number>();
        for (const r of recent) {
            if (!latest.has(r.placeId)) latest.set(r.placeId, r);
            todayCount.set(r.placeId, (todayCount.get(r.placeId) || 0) + 1);
        }

        return beaches
            .map((b) => {
                const r = latest.get(b.id) || null;
                return {
                    placeId: b.id,
                    name: b.name,
                    slug: b.slug,
                    city: b.city,
                    governorate: b.governorate,
                    coverImage: b.coverImage || (b.images && b.images[0]) || null,
                    latitude: b.latitude != null ? Number(b.latitude) : null,
                    longitude: b.longitude != null ? Number(b.longitude) : null,
                    jellyfish: r?.jellyfish || null,
                    water: r?.water || null,
                    crowd: r?.crowd || null,
                    note: r?.note || null,
                    reportedAt: r?.createdAt || null,
                    reportsToday: todayCount.get(b.id) || 0,
                };
            })
            // Beaches with a fresh report first (that's the useful info), then by name.
            .sort((a, b) => {
                if (!!a.reportedAt !== !!b.reportedAt) return a.reportedAt ? -1 : 1;
                if (a.reportedAt && b.reportedAt) return +new Date(b.reportedAt) - +new Date(a.reportedAt);
                return a.name.localeCompare(b.name);
            });
    }

    /** A single beach: current status + a short timeline of recent reports. */
    async beach(placeId: string) {
        const place = await this.places.findOne({ where: { id: placeId }, relations: ['category'] });
        if (!place) throw new NotFoundException('Beach not found');
        const since = new Date(Date.now() - FRESH_MS);
        const recent = await this.reports.find({
            where: { placeId, createdAt: MoreThan(since) },
            order: { createdAt: 'DESC' },
            take: 12,
        });
        // Redact reporter ids; surface just the community signal.
        const timeline = recent.map((r) => ({
            jellyfish: r.jellyfish, water: r.water, crowd: r.crowd, note: r.note, at: r.createdAt,
        }));
        return {
            place: { id: place.id, name: place.name, slug: place.slug, city: place.city, governorate: place.governorate },
            current: timeline[0] || null,
            reportsToday: timeline.length,
            timeline,
        };
    }

    async report(userId: string, placeId: string, input: BeachReportInput) {
        if (!JELLYFISH.has(input.jellyfish)) throw new BadRequestException('jellyfish must be none | few | lots');
        if (input.water && !WATER.has(input.water)) throw new BadRequestException('invalid water value');
        if (input.crowd && !CROWD.has(input.crowd)) throw new BadRequestException('invalid crowd value');

        const place = await this.places.findOne({ where: { id: placeId }, relations: ['category'] });
        if (!place) throw new NotFoundException('Beach not found');
        if (!this.isBeach(place)) throw new BadRequestException('This place is not a beach');

        const saved = await this.reports.save(this.reports.create({
            placeId,
            userId,
            jellyfish: input.jellyfish,
            water: input.water || null,
            crowd: input.crowd || null,
            note: input.note ? String(input.note).slice(0, 160) : null,
        }));

        // Reward fresh, distinct reports — throttled so re-reporting the same beach
        // can't be farmed. (Data over volume.)
        const prior = await this.reports.count({
            where: { placeId, userId, createdAt: MoreThan(new Date(Date.now() - XP_THROTTLE_MS)) },
        });
        if (prior <= 1) {
            void this.gamification.addPoints(userId, 5, 'Reported beach conditions').catch(() => {});
        }

        return { id: saved.id, awarded: prior <= 1 };
    }
}
