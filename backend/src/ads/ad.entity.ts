import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum AdPlacement { HOME = 'home', DETAIL = 'detail', FEED = 'feed', SEARCH = 'search' }

@Entity('ads')
export class Ad {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    imageUrl: string;

    @Column({ nullable: true })
    targetUrl: string;

    @Column({ nullable: true })
    advertiserName: string;

    @Column({ default: AdPlacement.HOME })
    placement: AdPlacement;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ default: 0 })
    impressions: number;

    @Column({ default: 0 })
    clicks: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.5 })
    costPerClick: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    budget: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    spent: number;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    startDate: Date;

    @Column({ nullable: true })
    endDate: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
