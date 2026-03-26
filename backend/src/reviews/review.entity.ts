import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Place } from '../places/place.entity';

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('decimal', { precision: 2, scale: 1 })
    rating: number;

    @Column('text')
    comment: string;

    @Column('simple-array', { nullable: true })
    images: string[];

    @ManyToOne(() => User, (user) => user.reviews, { eager: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => Place, (place) => place.reviews, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'placeId' })
    place: Place;

    @Column()
    placeId: string;

    @CreateDateColumn()
    createdAt: Date;
}