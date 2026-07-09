import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * First-party product event. Deliberately minimal: name + optional actor +
 * free-form props. This is the raw feed for retention/funnel questions
 * ("D7 return", "signup → first post") — aggregation happens at query time.
 */
@Entity('analytics_events')
export class AnalyticsEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ length: 64 })
    name: string;

    /** Authenticated user, when known. */
    @Index()
    @Column({ nullable: true })
    userId: string | null;

    /** Stable pre-signup id from localStorage — lets funnels cross the signup boundary. */
    @Column({ length: 64, nullable: true })
    anonId: string | null;

    @Column({ type: 'simple-json', nullable: true })
    props: Record<string, unknown> | null;

    @Index()
    @CreateDateColumn()
    createdAt: Date;
}
