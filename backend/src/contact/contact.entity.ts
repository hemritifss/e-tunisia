import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum ContactType { SPONSOR = 'sponsor', PARTNER = 'partner', ADVERTISER = 'advertiser', GENERAL = 'general' }
export enum ContactStatus { PENDING = 'pending', CONTACTED = 'contacted', CLOSED = 'closed' }

@Entity('contacts')
export class Contact {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    businessName: string;

    @Column({ default: ContactType.GENERAL })
    type: ContactType;

    @Column({ type: 'text' })
    message: string;

    @Column({ default: ContactStatus.PENDING })
    status: ContactStatus;

    @Column({ type: 'text', nullable: true })
    adminNotes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
