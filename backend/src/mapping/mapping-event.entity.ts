import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * "The Great Tunisia Mapping Weekend" (GROWTH §8) — a time-boxed contribution
 * contest. A live leaderboard ranks every governorate (and every contributor)
 * by what they mapped during the window. Everything else — gems, confirmations,
 * ambassadors, check-ins — converges here for the launch moment.
 */
@Entity('mapping_events')
export class MappingEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index({ unique: true })
    @Column()
    slug: string;

    @Column()
    title: string;

    @Column({ type: 'varchar', length: 240, nullable: true })
    subtitle: string | null;

    @Index()
    @Column({ type: 'timestamptz' })
    startsAt: Date;

    @Index()
    @Column({ type: 'timestamptz' })
    endsAt: Date;

    /** Free-text prize description shown on the event page. */
    @Column({ type: 'text', nullable: true })
    prizes: string | null;

    /** The single event surfaced at /mapping-weekend. */
    @Column({ default: true })
    isFeatured: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
