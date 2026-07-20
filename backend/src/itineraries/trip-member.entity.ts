import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, Index, Unique,
} from 'typeorm';

/**
 * A co-planner on a trip (GROWTH.md §6.1 — the Figma trick). Members join via
 * the owner's invite link and can edit the trip; every trip becomes a small
 * group object that pulls its participants into the platform.
 */
@Entity('trip_members')
@Unique(['tripId', 'userId'])
export class TripMember {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    tripId: string;

    @Column()
    @Index()
    userId: string;

    /** Who shared the invite that brought this member in (the owner, in v1). */
    @Column({ nullable: true })
    invitedBy: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
