import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum NotificationType {
    EVENT = 'event', TIP = 'tip', BADGE = 'badge',
    SPONSOR = 'sponsor', SYSTEM = 'system', PROMO = 'promo',
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
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
