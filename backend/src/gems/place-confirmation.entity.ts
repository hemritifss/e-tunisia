import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, Index, Unique,
} from 'typeorm';

/**
 * One community confirmation of a place ("still exists, still worth it").
 * The contribution ladder's rung 2 — and the quality gate for community-submitted
 * gems: a pending gem goes live once TWO other users confirm it.
 */
@Entity('place_confirmations')
@Unique(['placeId', 'userId'])
export class PlaceConfirmation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    placeId: string;

    @Column()
    @Index()
    userId: string;

    @CreateDateColumn()
    createdAt: Date;
}
