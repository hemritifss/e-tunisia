import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Place } from '../places/place.entity';

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('decimal', { precision: 2, scale: 1 })
    rating: number;

    @Column('text')
    comment: string;

    @Column('simple-array', { nullable: true })
    images: string[];

    @ManyToOne(() => User, (user) => user.reviews, { eager: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => Place, (place) => place.reviews, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'placeId' })
    place: Place;

    @Column()
    placeId: string;

    /** When set, this review is verified as coming from a real booked inquiry.
     *  We snapshot the inquiry id so even if the inquiry row is later closed,
     *  the verified badge stays. */
    @Column({ nullable: true })
    @Index()
    verifiedInquiryId: string | null;

    /** Inline host reply — Airbnb-style. Owner of the place can post one reply. */
    @Column('text', { nullable: true })
    hostReply: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    hostRepliedAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;
}