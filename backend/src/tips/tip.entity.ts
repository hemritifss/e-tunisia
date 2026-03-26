import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('tips')
export class Tip {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 200 })
    title: string;

    @Column('text')
    content: string;

    @Column({ default: 'general' })
    category: string; // food | transport | cultural | safety | money | general

    @Column({ nullable: true })
    coverImage: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'authorId' })
    author: User;

    @Column()
    authorId: string;

    @Column({ default: 0 })
    likes: number;

    @Column({ default: true })
    isApproved: boolean;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
