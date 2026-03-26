import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('collections')
export class Collection {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 200 })
    title: string;

    @Column('text', { nullable: true })
    description: string;

    @Column({ nullable: true })
    coverImage: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'ownerId' })
    owner: User;

    @Column()
    ownerId: string;

    @Column('simple-array', { nullable: true })
    placeIds: string[];

    @Column({ default: true })
    isPublic: boolean;

    @Column({ default: false })
    isPremium: boolean;

    @Column({ default: 0 })
    likeCount: number;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
