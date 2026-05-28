import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { Category } from '../categories/category.entity';
import { Review } from '../reviews/review.entity';

@Entity('places')
export class Place {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 200 })
    name: string;

    @Column({ length: 200, nullable: true })
    nameAr: string;

    @Column({ length: 200, nullable: true })
    nameFr: string;

    @Column({ unique: true })
    slug: string;

    @Column('text')
    description: string;

    @Column('text', { nullable: true })
    descriptionAr: string;

    @Column('text', { nullable: true })
    descriptionFr: string;

    @Column({ length: 200 })
    address: string;

    @Column({ length: 100 })
    @Index()
    city: string;

    @Column({ length: 100 })
    governorate: string;

    @Column('decimal', { precision: 10, scale: 7 })
    latitude: number;

    @Column('decimal', { precision: 10, scale: 7 })
    longitude: number;

    @Column('simple-array', { nullable: true })
    images: string[];

    @Column({ nullable: true })
    coverImage: string;

    @Column({ nullable: true })
    videoUrl: string;

    @Column({ nullable: true })
    website: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    openingHours: string;

    @Column({ nullable: true })
    priceRange: string;

    @Column('decimal', { precision: 2, scale: 1, default: 0 })
    @Index()
    rating: number;

    @Column({ default: 0 })
    reviewCount: number;

    @Column({ default: 0 })
    viewCount: number;

    @Column('simple-array', { nullable: true })
    tags: string[];

    @Column({ default: true })
    @Index()
    isActive: boolean;

    @Column({ default: false })
    @Index()
    isFeatured: boolean;

    @Column({ default: false })
    isBoosted: boolean;

    @Column({ nullable: true })
    boostExpiresAt: Date;

    @Column({ default: true })
    @Index()
    isApproved: boolean;

    @Column({ nullable: true })
    @Index()
    submittedBy: string;

    @ManyToOne(() => Category, (category) => category.places, {
        eager: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'categoryId' })
    category: Category;

    @Column({ nullable: true })
    categoryId: string;

    @OneToMany(() => Review, (review) => review.place)
    reviews: Review[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}