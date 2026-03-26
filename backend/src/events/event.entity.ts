import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Place } from '../places/place.entity';

@Entity('events')
export class Event {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 200 })
    title: string;

    @Column('text')
    description: string;

    @Column({ nullable: true })
    coverImage: string;

    @ManyToOne(() => Place, { eager: true, nullable: true })
    @JoinColumn({ name: 'placeId' })
    place: Place;

    @Column({ nullable: true })
    placeId: string;

    @Column()
    startDate: Date;

    @Column({ nullable: true })
    endDate: Date;

    @Column({ default: 'culture' })
    category: string; // culture | music | food | sport | festival | workshop

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number;

    @Column({ default: 'TND' })
    currency: string;

    @Column({ default: false })
    isFree: boolean;

    @Column({ default: false })
    isOnline: boolean;

    @Column({ nullable: true })
    location: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'organizerId' })
    organizer: User;

    @Column()
    organizerId: string;

    @Column({ default: 0 })
    attendeeCount: number;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
