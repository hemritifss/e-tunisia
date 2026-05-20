import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

/**
 * Pre-priced experiences a host attaches to a Place.
 * Example: "Sahara 3-day camel trek — 800 TND/person".
 * Becomes a "Book this package" CTA on the place page.
 */
@Entity('tour_packages')
export class TourPackage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    placeId: string;

    @Column({ length: 200 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'int', default: 1 })
    durationDays: number;

    @Column({ type: 'int' })
    pricePerPerson: number;

    @Column({ length: 8, default: 'TND' })
    currency: string;

    @Column({ type: 'int', default: 1 })
    minPartySize: number;

    @Column({ type: 'int', default: 12 })
    maxPartySize: number;

    @Column('simple-array', { nullable: true })
    includes: string[]; // e.g. ['Transport', 'Local guide', 'Lunch']

    @Column('simple-array', { nullable: true })
    images: string[];

    @Column({ length: 60, nullable: true })
    badge: string | null; // e.g. "Bestseller", "Limited", "New"

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
