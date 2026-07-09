import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * One row per (deduped) passport view by a logged-in, non-owner viewer.
 * Powers the Pro "who viewed your passport" analytics. Anonymous views are not
 * recorded — the feature is about identified viewers, and it keeps the table bounded.
 */
@Entity('passport_views')
@Index(['ownerId', 'createdAt'])
export class PassportView {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /** The passport owner being viewed. */
    @Index()
    @Column()
    ownerId: string;

    /** The signed-in viewer. */
    @Column()
    viewerId: string;

    @CreateDateColumn()
    createdAt: Date;
}
