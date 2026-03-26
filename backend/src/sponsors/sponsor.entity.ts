import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum SponsorTier { GOLD = 'gold', SILVER = 'silver', BRONZE = 'bronze' }

@Entity('sponsors')
export class Sponsor {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    logo: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    website: string;

    @Column({ default: SponsorTier.BRONZE })
    tier: SponsorTier;

    @Column({ nullable: true })
    contactEmail: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    amountPaid: number;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    startDate: Date;

    @Column({ nullable: true })
    endDate: Date;

    @Column({ default: 0 })
    clickCount: number;

    @Column({ default: 0 })
    impressionCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
