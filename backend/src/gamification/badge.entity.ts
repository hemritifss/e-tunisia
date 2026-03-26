import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn,
} from 'typeorm';

@Entity('badges')
export class Badge {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column()
    icon: string; // emoji or icon name

    @Column({ default: 'explorer' })
    category: string; // explorer, foodie, social, contributor, premium

    @Column({ default: 0 })
    pointsRequired: number;

    @Column({ nullable: true })
    requirement: string; // e.g., "Visit 10 places"

    @Column({ default: 0 })
    sortOrder: number;

    @CreateDateColumn()
    createdAt: Date;
}
