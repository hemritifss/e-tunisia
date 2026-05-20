import { Injectable, NotFoundException, ForbiddenException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from './place.entity';
import { TourPackage } from './tour-package.entity';

interface CreatePackageInput {
    title: string;
    description: string;
    durationDays?: number;
    pricePerPerson: number;
    currency?: string;
    minPartySize?: number;
    maxPartySize?: number;
    includes?: string[];
    images?: string[];
    badge?: string | null;
}

@Injectable()
export class PackagesService implements OnModuleInit {
    private static UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    private readonly log = new Logger(PackagesService.name);

    constructor(
        @InjectRepository(TourPackage) private packages: Repository<TourPackage>,
        @InjectRepository(Place) private places: Repository<Place>,
    ) {}

    /** Bootstrap a few starter packages on first boot so visitors immediately
     *  see something on the place pages. Skips silently if the table isn't empty. */
    async onModuleInit() {
        try {
            const existing = await this.packages.count();
            if (existing > 0) return;

            const allPlaces = await this.places.find();
            if (allPlaces.length === 0) return;

            // Build a tag-based template selector — packages match the spirit of the place.
            const templates: Array<{
                match: (p: Place) => boolean;
                build: (p: Place) => Array<Partial<TourPackage>>;
            }> = [
                {
                    match: (p) => (p.tags || []).some(t => /sahara|oasis|berber|star wars|matmata/i.test(t)) || /tozeur|matmata|douz/i.test(p.city || ''),
                    build: (p) => [
                        {
                            title: 'Sunset camel ride + Berber dinner',
                            description: `Slow caravan into the dunes outside ${p.city}, glass of mint tea at the top of the highest dune, then a traditional Berber dinner under the stars with a local family. Pickup from your hotel.`,
                            durationDays: 1, pricePerPerson: 95, currency: 'TND',
                            minPartySize: 1, maxPartySize: 8,
                            includes: ['Hotel pickup', 'Camel + guide', 'Mint tea', 'Berber dinner'],
                            badge: 'Bestseller',
                        },
                        {
                            title: '3-day Sahara expedition',
                            description: 'Land Rover crossing through Chott el Jerid salt lake, overnight in a desert camp, sunrise hike, oasis exploration, then back to your city of origin. Small groups only.',
                            durationDays: 3, pricePerPerson: 780, currency: 'TND',
                            minPartySize: 2, maxPartySize: 6,
                            includes: ['4x4 transport', 'English guide', '2 nights camp', 'All meals', 'Park fees'],
                            badge: 'Limited',
                        },
                    ],
                },
                {
                    match: (p) => (p.tags || []).some(t => /beach|island|djerba|hammamet|sousse|coast/i.test(t)) || /djerba|hammamet|sousse|monastir|mahdia/i.test(p.city || ''),
                    build: () => [
                        {
                            title: 'Full-day catamaran cruise',
                            description: 'Skipper-led catamaran sail with three swim stops, snorkel gear, and a fresh seafood lunch served on deck. Sunset return.',
                            durationDays: 1, pricePerPerson: 220, currency: 'TND',
                            minPartySize: 1, maxPartySize: 10,
                            includes: ['Skipper', 'Snorkel kit', 'Lunch + drinks', 'Hotel pickup'],
                            badge: 'Bestseller',
                        },
                        {
                            title: 'Sunset stand-up paddle + thalassotherapy',
                            description: '90-minute coastal SUP at golden hour with a certified instructor, then a 60-min thalasso treatment at the partner spa.',
                            durationDays: 1, pricePerPerson: 140, currency: 'TND',
                            minPartySize: 1, maxPartySize: 4,
                            includes: ['SUP board + instructor', 'Thalasso session', 'Towel + locker'],
                        },
                    ],
                },
                {
                    match: (p) => (p.tags || []).some(t => /medina|unesco|culture|historical|kairouan|carthage/i.test(t)) || /tunis|kairouan|el jem|sidi bou/i.test((p.city || '') + (p.name || '')),
                    build: (p) => [
                        {
                            title: `Private walking tour of ${p.city || 'the medina'}`,
                            description: `A local historian leads you through the back alleys, palaces and souks of ${p.name}. Stops for mint tea, a stand-up brik, and the best photo spots locals actually use.`,
                            durationDays: 1, pricePerPerson: 65, currency: 'TND',
                            minPartySize: 1, maxPartySize: 8,
                            includes: ['Private licensed guide', 'Mint tea stop', 'Bottled water'],
                            badge: 'New',
                        },
                        {
                            title: 'Half-day artisan workshop crawl',
                            description: 'Visit three working artisan ateliers — a copper-beater, a leather worker, and a ceramicist. Try your hand at each. Pieces shipped home if you fall in love.',
                            durationDays: 1, pricePerPerson: 110, currency: 'TND',
                            minPartySize: 1, maxPartySize: 6,
                            includes: ['Studio visits', 'Materials to try', 'Translator', 'Snacks'],
                        },
                    ],
                },
                {
                    match: (p) => (p.tags || []).some(t => /restaurant|food|gastronomy|fine dining/i.test(t)),
                    build: () => [
                        {
                            title: "Tunisian chef's tasting menu",
                            description: 'Seven-course tasting of the house signatures with a glass-by-glass Tunisian wine pairing. Vegetarian and halal versions on request — please mention in the message.',
                            durationDays: 1, pricePerPerson: 180, currency: 'TND',
                            minPartySize: 1, maxPartySize: 10,
                            includes: ['7 courses', 'Wine pairing', 'Welcome drink'],
                            badge: 'Bestseller',
                        },
                    ],
                },
                {
                    match: (p) => (p.tags || []).some(t => /hotel|riad|5-star|boutique|heritage/i.test(t)),
                    build: () => [
                        {
                            title: '2-night Riad stay + Medina experience',
                            description: 'Two nights in a heritage suite, daily breakfast on the rooftop, a private cooking class with the host, and a guided Medina walk.',
                            durationDays: 2, pricePerPerson: 540, currency: 'TND',
                            minPartySize: 1, maxPartySize: 4,
                            includes: ['2 nights room', 'Breakfast', 'Cooking class', 'Medina walk'],
                            badge: 'Bestseller',
                        },
                    ],
                },
            ];

            let totalSeeded = 0;
            for (const place of allPlaces) {
                for (const t of templates) {
                    if (!t.match(place)) continue;
                    const items = t.build(place);
                    for (const item of items) {
                        await this.packages.save(this.packages.create({
                            placeId: place.id,
                            isActive: true,
                            ...item,
                        } as TourPackage));
                        totalSeeded++;
                    }
                    break; // only the first matching template per place — avoids duplicates
                }
            }
            if (totalSeeded > 0) {
                this.log.log(`Seeded ${totalSeeded} starter tour packages across ${allPlaces.length} places`);
            }
        } catch (e) {
            this.log.warn(`Could not bootstrap tour packages: ${(e as any)?.message || e}`);
        }
    }

    async listForPlace(placeId: string) {
        if (!PackagesService.UUID_RE.test(placeId)) return [];
        return this.packages.find({
            where: { placeId, isActive: true },
            order: { pricePerPerson: 'ASC' },
        });
    }

    async findOne(id: string): Promise<TourPackage & { place?: any }> {
        if (!PackagesService.UUID_RE.test(id)) throw new NotFoundException('Package not found');
        const pkg = await this.packages.findOne({ where: { id } });
        if (!pkg) throw new NotFoundException('Package not found');
        const place = await this.places.findOne({ where: { id: pkg.placeId } });
        return { ...pkg, place };
    }

    async create(placeId: string, ownerUserId: string, input: CreatePackageInput) {
        if (!PackagesService.UUID_RE.test(placeId)) throw new NotFoundException('Place not found');
        const place = await this.places.findOne({ where: { id: placeId } });
        if (!place) throw new NotFoundException('Place not found');
        if (place.submittedBy !== ownerUserId) {
            throw new ForbiddenException('Only the listing owner can add packages');
        }
        const sanitized = this.sanitize(input);
        return this.packages.save(this.packages.create({
            placeId,
            isActive: true,
            ...sanitized,
        }));
    }

    async update(id: string, ownerUserId: string, input: Partial<CreatePackageInput> & { isActive?: boolean }) {
        if (!PackagesService.UUID_RE.test(id)) throw new NotFoundException('Package not found');
        const pkg = await this.packages.findOne({ where: { id } });
        if (!pkg) throw new NotFoundException('Package not found');
        const place = await this.places.findOne({ where: { id: pkg.placeId } });
        if (!place || place.submittedBy !== ownerUserId) {
            throw new ForbiddenException('Only the listing owner can edit packages');
        }
        const patch = this.sanitize(input as CreatePackageInput, { allowPartial: true });
        if (typeof input.isActive === 'boolean') (patch as any).isActive = input.isActive;
        Object.assign(pkg, patch);
        return this.packages.save(pkg);
    }

    async remove(id: string, ownerUserId: string) {
        if (!PackagesService.UUID_RE.test(id)) throw new NotFoundException('Package not found');
        const pkg = await this.packages.findOne({ where: { id } });
        if (!pkg) throw new NotFoundException('Package not found');
        const place = await this.places.findOne({ where: { id: pkg.placeId } });
        if (!place || place.submittedBy !== ownerUserId) {
            throw new ForbiddenException('Only the listing owner can delete packages');
        }
        // Soft-delete keeps inquiry references intact.
        pkg.isActive = false;
        await this.packages.save(pkg);
        return { deleted: true };
    }

    private sanitize(input: CreatePackageInput, opts: { allowPartial?: boolean } = {}) {
        const out: Partial<TourPackage> = {};
        if (input.title !== undefined) {
            const t = String(input.title).trim();
            if (!t) throw new BadRequestException('Title is required');
            out.title = t.slice(0, 200);
        }
        if (input.description !== undefined) {
            const d = String(input.description).trim();
            if (!d) throw new BadRequestException('Description is required');
            out.description = d.slice(0, 4000);
        }
        if (input.pricePerPerson !== undefined) {
            const p = Number(input.pricePerPerson);
            if (!Number.isFinite(p) || p < 0) throw new BadRequestException('Invalid price');
            out.pricePerPerson = Math.floor(p);
        }
        if (input.durationDays !== undefined) {
            out.durationDays = Math.min(60, Math.max(1, Number(input.durationDays) || 1));
        }
        if (input.minPartySize !== undefined) {
            out.minPartySize = Math.min(50, Math.max(1, Number(input.minPartySize) || 1));
        }
        if (input.maxPartySize !== undefined) {
            out.maxPartySize = Math.min(100, Math.max(1, Number(input.maxPartySize) || 12));
        }
        if (input.currency !== undefined) {
            out.currency = String(input.currency || 'TND').toUpperCase().slice(0, 8);
        }
        if (input.includes !== undefined) {
            out.includes = Array.isArray(input.includes)
                ? input.includes.map(s => String(s).trim()).filter(Boolean).slice(0, 20)
                : [];
        }
        if (input.images !== undefined) {
            out.images = Array.isArray(input.images)
                ? input.images.map(s => String(s).trim()).filter(Boolean).slice(0, 10)
                : [];
        }
        if (input.badge !== undefined) {
            const b = input.badge ? String(input.badge).trim().slice(0, 60) : null;
            out.badge = b || null;
        }
        if (!opts.allowPartial) {
            if (!out.title) throw new BadRequestException('Title is required');
            if (!out.description) throw new BadRequestException('Description is required');
            if (out.pricePerPerson == null) throw new BadRequestException('Price is required');
        }
        return out;
    }
}
