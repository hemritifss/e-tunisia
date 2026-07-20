import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, Index,
} from 'typeorm';

/**
 * One community beach report ("famma 9nadel?" — are there jellyfish?).
 * Time-sensitive by nature: only reports from the last 24h count as "current".
 * simple varchar (not simple-enum) to dodge TypeORM's enum sync churn on Postgres.
 */
@Entity('beach_reports')
export class BeachReport {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    placeId: string;

    @Column()
    @Index()
    userId: string;

    /** none | few | lots — the headline signal. */
    @Column({ length: 8 })
    jellyfish: string;

    /** clear | seaweed | murky */
    @Column({ length: 8, nullable: true })
    water: string | null;

    /** empty | ok | packed */
    @Column({ length: 8, nullable: true })
    crowd: string | null;

    @Column({ length: 160, nullable: true })
    note: string | null;

    @Index()
    @CreateDateColumn()
    createdAt: Date;
}
