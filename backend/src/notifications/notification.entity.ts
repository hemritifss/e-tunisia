import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum NotificationType {
    EVENT = 'event', TIP = 'tip', BADGE = 'badge',
    SPONSOR = 'sponsor', SYSTEM = 'system', PROMO = 'promo',
    FOLLOW = 'follow', COMMENT = 'comment', DONATION = 'donation', MENTION = 'mention',
    PASSPORT_VIEW = 'passport_view',
}

@Entity('notifications')
@Index(['userId', 'isRead', 'createdAt'])
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    @Index()
    userId: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    body: string;

    @Column({ default: NotificationType.SYSTEM })
    type: NotificationType;

    @Column({ default: false })
    isRead: boolean;

    @Column({ type: 'simple-json', nullable: true })
    data: any; // extra payload (event ID, badge ID, etc.)

    @CreateDateColumn()
    createdAt: Date;
}
