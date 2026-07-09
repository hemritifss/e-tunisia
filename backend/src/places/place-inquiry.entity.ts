import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export enum InquiryStatus {
    NEW = 'new',
    CONTACTED = 'contacted',
    QUOTED = 'quoted',
    BOOKED = 'booked',
    CLOSED = 'closed',
}

/**
 * Lead-gen for places: travelers send a quote/booking request from the
 * place-detail page. Visible to the place "owner" (submittedBy) + admins.
 * Logged-in users get their inquiries linked to userId; guests are allowed too.
 */
@Entity('place_inquiries')
export class PlaceInquiry {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    placeId: string;

    @Column({ nullable: true })
    @Index()
    userId: string | null; // null = guest inquiry

    @Column({ length: 120 })
    name: string;

    @Column({ length: 200 })
    email: string;

    @Column({ length: 40, nullable: true })
    phone: string | null;

    @Column({ type: 'int', default: 1 })
    partySize: number;

    @Column({ type: 'date', nullable: true })
    dateFrom: string | null;

    @Column({ type: 'date', nullable: true })
    dateTo: string | null;

    @Column({ type: 'int', nullable: true })
    budget: number | null;

    @Column({ length: 8, default: 'TND' })
    currency: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'simple-enum', enum: InquiryStatus, default: InquiryStatus.NEW })
    status: InquiryStatus;

    @Column({ length: 80, nullable: true })
    source: string | null; // utm/affiliate tag, e.g. "feed", "explore", "post:<id>"

    @Column({ nullable: true })
    @Index()
    packageId: string | null; // optional FK → TourPackage when the inquiry is for a specific package

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
