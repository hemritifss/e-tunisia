import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, Index, Unique,
} from 'typeorm';

/**
 * One peer endorsement. The unique constraint enforces:
 * a given endorser can only endorse a given person ONCE per topic.
 * Toggle off = delete the row (no soft-delete needed at this scale).
 */
@Entity('endorsements')
@Unique(['endorserId', 'endorsedId', 'topic'])
export class Endorsement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    endorserId: string;

    @Column()
    @Index()
    endorsedId: string;

    /** Topic slug — must come from ENDORSEMENT_TOPICS in endorsement-topics.ts. */
    @Column({ length: 40 })
    @Index()
    topic: string;

    @CreateDateColumn()
    createdAt: Date;
}
