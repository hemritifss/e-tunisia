import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export type TopupStatus = 'pending' | 'completed' | 'failed';

/**
 * A wallet top-up intent. Created PENDING when a Flouci payment is generated and
 * keyed by `paymentReference` (`FLOUCI_<paymentId>`); the return handler verifies
 * the payment server-side, credits the wallet, and flips the row to COMPLETED.
 * The status guards against double-crediting if the return URL is hit twice.
 */
@Entity('topups')
export class Topup {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    @Index()
    userId: string;

    @Column('decimal', { precision: 12, scale: 2 })
    amount: number;

    @Column({ default: 'TND' })
    currency: string;

    // varchar (not enum) to avoid TypeORM's simple-enum sync churn on Postgres.
    @Column({ type: 'varchar', length: 16, default: 'pending' })
    status: TopupStatus;

    /** `FLOUCI_<paymentId>` — unique so the return handler matches exactly one row. */
    @Column()
    @Index({ unique: true })
    paymentReference: string;

    @Column({ default: 'flouci' })
    provider: string; // flouci | mock

    @Column({ nullable: true })
    completedAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}
