import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Badge } from './badge.entity';

@Entity('user_badges')
export class UserBadge {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => Badge, { eager: true })
    @JoinColumn({ name: 'badgeId' })
    badge: Badge;

    @Column()
    badgeId: string;

    @CreateDateColumn()
    earnedAt: Date;
}
