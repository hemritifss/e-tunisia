import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * Normalized record of "user visited place" — one row per (user, place). Replaces the
 * cross-user-unfriendly `User.visitedPlaceIds` simple-array for analytics: it makes
 * honest rarity ("N explorers stamped this city") and visit counts a cheap GROUP BY.
 * `city` is denormalized from the place so per-city rarity needs no join.
 * `User.visitedPlaceIds` is still maintained (dual-written) for existing read paths.
 */
@Entity('place_visits')
@Index(['userId', 'placeId'], { unique: true })
export class PlaceVisit {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    userId: string;

    @Index()
    @Column()
    placeId: string;

    @Index()
    @Column({ nullable: true })
    city: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
