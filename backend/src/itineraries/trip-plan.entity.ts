import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

/**
 * Personal "trip cart" — a user's selected stack of places + packages
 * that they can save, share, and turn into a combined inquiry.
 * Distinct from the curated `Itinerary` entity (which is editorial content).
 */
export interface TripStop {
    placeId: string;
    placeName?: string;
    placeCity?: string;
    placeCover?: string;
    packageId?: string | null;
    packageTitle?: string | null;
    pricePerPerson?: number | null;
    currency?: string | null;
    dayIndex: number;         // 0-indexed
    addedAt: string;
}

@Entity('trip_plans')
export class TripPlan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 32, unique: true })
    @Index()
    slug: string; // short shareable id (no UUID exposure)

    @Column({ nullable: true })
    @Index()
    userId: string | null; // null = anonymous draft

    @Column({ length: 200, default: 'My Tunisia trip' })
    title: string;

    @Column({ type: 'int', default: 2 })
    travelers: number;

    @Column({ length: 8, default: 'TND' })
    currency: string;

    @Column({ type: 'simple-json' })
    stops: TripStop[];

    @Column({ type: 'int', default: 1 })
    days: number;

    @Column({ default: true })
    isPublic: boolean; // anyone with the slug can view

    @Column({ type: 'int', default: 0 })
    viewCount: number;

    /** Number of times another user cloned this trip as their starting point. */
    @Column({ type: 'int', default: 0 })
    cloneCount: number;

    /** Soft heart count — anyone can tap the heart, frontend prevents repeat-likes via localStorage. */
    @Column({ type: 'int', default: 0 })
    likeCount: number;

    /** Slug of the source trip when this one was created via /clone. Null for originals. */
    @Column({ length: 32, nullable: true })
    @Index()
    cloneOf: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
