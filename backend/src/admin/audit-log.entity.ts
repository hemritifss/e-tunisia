import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

/** One row per admin mutation — written by AuditInterceptor. Read-only from the UI. */
@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    actorId: string;

    @Column({ nullable: true })
    actorName: string;

    @Column({ nullable: true })
    actorEmail: string;

    /** Coarse action key, e.g. "PATCH /users/:id/ban". */
    @Column()
    action: string;

    /** Resource family, e.g. "users", "places", "subscriptions". */
    @Column({ nullable: true })
    targetType: string;

    /** Affected resource id (from route params), when present. */
    @Column({ nullable: true })
    targetId: string;

    /** Human-readable one-liner shown in the audit table. */
    @Column({ type: 'text', nullable: true })
    summary: string;

    @Index()
    @CreateDateColumn()
    createdAt: Date;
}
