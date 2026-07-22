import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { User } from '../users/user.entity';
import { Place } from '../places/place.entity';
import { Review } from '../reviews/review.entity';
import { PlaceVisit } from '../users/place-visit.entity';
import { BeachReport } from '../beaches/beach-report.entity';
import { deriveLevel } from '../users/dto/passport.dto';

/**
 * "Your Summer in Tunisia" — Wrapped (GROWTH §6). A personal, shareable recap
 * of the season's real activity: check-ins, cities, reviews, gems, plus a
 * derived traveler personality. Wrapped is the most proven share-format there
 * is; the value is the artifact people post, so everything here is public and
 * degrades gracefully when a user has little/no summer activity.
 */

export interface WrappedPersonality { key: string; label: string; emoji: string; blurb: string; }

export interface WrappedDto {
    handle: string;
    fullName: string;
    avatar: string | null;
    period: { label: string; from: string; to: string; year: number };
    isEmpty: boolean;
    stats: {
        checkIns: number;
        citiesCount: number;
        governoratesCount: number;
        reviews: number;
        gems: number;
        beachReports: number;
    };
    cities: string[];
    topCity: { city: string; count: number } | null;
    firstTrip: { city: string; at: string } | null;
    personality: WrappedPersonality;
    points: number;
    passportLevel: string;
    founderNumber: number | null;
}

const DESERT_GOVS = new Set(['tozeur', 'kebili', 'kébili', 'douz', 'tataouine', 'gafsa', 'kasserine']);
const COASTAL_GOVS = new Set([
    'tunis', 'ariana', 'ben arous', 'nabeul', 'bizerte', 'jendouba',
    'sousse', 'monastir', 'mahdia', 'sfax', 'gabes', 'gabès', 'medenine', 'médenine',
]);

// Build emoji from code points at runtime — literal multibyte emoji get
// mojibake'd through the webpack bundle (a lone surrogate ended up in the JSON),
// and even \u{} escapes didn't survive. Pure-ASCII source is the only safe form.
const cp = (...codes: number[]) => String.fromCodePoint(...codes);
const PERSONALITIES: Record<string, WrappedPersonality> = {
    trailblazer: { key: 'trailblazer', label: 'The Trailblazer', emoji: cp(0x1F9ED), blurb: 'You did not just visit Tunisia — you put new places on the map. Others will follow the trail you left.' },
    'beach-oracle': { key: 'beach-oracle', label: 'The Beach Oracle', emoji: cp(0x1FABC), blurb: 'The whole coast checked with you before diving in. Jellyfish feared you. Summer answered to you.' },
    'coastal-explorer': { key: 'coastal-explorer', label: 'The Coastal Explorer', emoji: cp(0x1F3D6, 0xFE0F), blurb: 'Salt in your hair, sand everywhere. You chased the Mediterranean from cove to cove all season.' },
    'desert-wanderer': { key: 'desert-wanderer', label: 'The Desert Wanderer', emoji: cp(0x1F42A), blurb: 'While everyone crowded the beaches, you went where the map turns gold. The south is yours.' },
    'culture-seeker': { key: 'culture-seeker', label: 'The Culture Seeker', emoji: cp(0x1F54C), blurb: 'Medinas, mosques and old stones — you read Tunisia like a book, one ancient street at a time.' },
    'city-hopper': { key: 'city-hopper', label: 'The City Hopper', emoji: cp(0x1F3D9, 0xFE0F), blurb: 'You could not sit still. City after city, you collected Tunisia like stamps in a passport.' },
    storyteller: { key: 'storyteller', label: 'The Storyteller', emoji: cp(0x270D, 0xFE0F), blurb: 'You did not keep it to yourself — you wrote it down so the next traveler knows where to go.' },
    explorer: { key: 'explorer', label: 'The Explorer', emoji: cp(0x1F305), blurb: 'Curious, open, always moving toward the next horizon. Tunisia is bigger because you looked.' },
};

@Injectable()
export class WrappedService {
    constructor(
        @InjectRepository(User) private readonly users: Repository<User>,
        @InjectRepository(Place) private readonly places: Repository<Place>,
        @InjectRepository(Review) private readonly reviews: Repository<Review>,
        @InjectRepository(PlaceVisit) private readonly visits: Repository<PlaceVisit>,
        @InjectRepository(BeachReport) private readonly beachReports: Repository<BeachReport>,
    ) {}

    private fold(s?: string | null): string {
        return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    }

    /** Summer window for the given moment: Jun 1 – Sep 1 of the current summer
     *  (if it's before June, use last year's — a Wrapped is always retrospective). */
    private summerWindow(now = new Date()): { from: Date; to: Date; year: number } {
        const y = now.getUTCFullYear();
        const year = now.getUTCMonth() >= 5 ? y : y - 1; // month 5 = June
        return { from: new Date(Date.UTC(year, 5, 1)), to: new Date(Date.UTC(year, 8, 1)), year };
    }

    async build(handle: string): Promise<WrappedDto> {
        const user = await this.users.findOne({ where: { handle: (handle || '').toLowerCase() } });
        if (!user) throw new NotFoundException('Wrapped not found');

        const { from, to, year } = this.summerWindow();
        const range = Between(from, to);

        const [visitRows, reviewCount, beachReportCount, gemCount] = await Promise.all([
            this.visits.find({ where: { userId: user.id, createdAt: range }, order: { createdAt: 'ASC' } }),
            this.reviews.count({ where: { userId: user.id, createdAt: range } as any }).catch(() => 0),
            this.beachReports.count({ where: { userId: user.id, createdAt: range } as any }).catch(() => 0),
            this.places
                .createQueryBuilder('p')
                .where('p.submittedBy = :uid', { uid: user.id })
                .andWhere('p.createdAt BETWEEN :from AND :to', { from, to })
                .andWhere(`(p.tags LIKE '%hidden-gem%' OR p.tags LIKE '%community%')`)
                .getCount()
                .catch(() => 0),
        ]);

        // City / governorate / category breakdown from the visited places.
        const placeIds = Array.from(new Set(visitRows.map((v) => v.placeId)));
        const visitedPlaces = placeIds.length
            ? await this.places.find({ where: { id: In(placeIds) }, relations: ['category'] }).catch(() => [] as Place[])
            : [];
        const placeById = new Map(visitedPlaces.map((p) => [p.id, p]));

        const cityCount = new Map<string, number>();
        const govs = new Set<string>();
        let coastal = 0, desert = 0, culture = 0;
        for (const v of visitRows) {
            const p = placeById.get(v.placeId);
            const city = (v.city || p?.city || '').trim();
            if (city) cityCount.set(city, (cityCount.get(city) || 0) + 1);
            const gov = this.fold(p?.governorate);
            if (gov) govs.add(gov);
            const cat = this.fold((p as any)?.category?.name);
            const name = this.fold(p?.name);
            if (COASTAL_GOVS.has(gov) && /beach|plage|marsa|corniche|lido|island|ile|plage/.test(name + ' ' + cat)) coastal++;
            else if (DESERT_GOVS.has(gov) || /desert|sahara|dune|oasis/.test(name + ' ' + cat)) desert++;
            else if (/medina|mosqu|museum|musee|kasbah|ribat|fort|historic|ruin|heritage|medersa/.test(name + ' ' + cat)) culture++;
            else if (COASTAL_GOVS.has(gov)) coastal++;
        }

        const cities = [...cityCount.keys()];
        const topCityEntry = [...cityCount.entries()].sort((a, b) => b[1] - a[1])[0] || null;
        const firstVisit = visitRows[0] || null;

        const isEmpty = visitRows.length === 0 && reviewCount === 0 && gemCount === 0 && beachReportCount === 0;

        return {
            handle: user.handle as string,
            fullName: user.fullName,
            avatar: user.avatar || null,
            period: { label: `Summer ${year}`, from: from.toISOString(), to: to.toISOString(), year },
            isEmpty,
            stats: {
                checkIns: visitRows.length,
                citiesCount: cities.length,
                governoratesCount: govs.size,
                reviews: reviewCount,
                gems: gemCount,
                beachReports: beachReportCount,
            },
            cities,
            topCity: topCityEntry ? { city: topCityEntry[0], count: topCityEntry[1] } : null,
            firstTrip: firstVisit
                ? { city: (firstVisit.city || placeById.get(firstVisit.placeId)?.city || 'Tunisia'), at: firstVisit.createdAt.toISOString() }
                : null,
            personality: this.derivePersonality({ coastal, desert, culture, citiesCount: cities.length, reviews: reviewCount, gems: gemCount, beachReports: beachReportCount }),
            points: user.points || 0,
            passportLevel: deriveLevel(user.points || 0),
            founderNumber: user.founderNumber ?? null,
        };
    }

    private derivePersonality(s: {
        coastal: number; desert: number; culture: number;
        citiesCount: number; reviews: number; gems: number; beachReports: number;
    }): WrappedPersonality {
        // Contribution + signature behaviours win first — they're the rarest and
        // most flattering identities, and we want to celebrate map-makers.
        if (s.gems >= 2) return PERSONALITIES.trailblazer;
        if (s.beachReports >= 3) return PERSONALITIES['beach-oracle'];
        if (s.reviews >= 5 && s.reviews >= s.citiesCount) return PERSONALITIES.storyteller;

        const geo = Math.max(s.coastal, s.desert, s.culture);
        if (geo > 0) {
            if (s.desert === geo) return PERSONALITIES['desert-wanderer'];
            if (s.culture === geo) return PERSONALITIES['culture-seeker'];
            if (s.coastal === geo) return PERSONALITIES['coastal-explorer'];
        }
        if (s.citiesCount >= 4) return PERSONALITIES['city-hopper'];
        return PERSONALITIES.explorer;
    }
}
