import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
} from 'typeorm';
import { Place } from '../places/place.entity';

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100 })
    name: string;

    @Column({ length: 100 })
    nameAr: string;

    @Column({ length: 100 })
    nameFr: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    icon: string;

    @Column({ nullable: true })
    image: string;

    @Column({ nullable: true })
    color: string;

    @Column({ default: 0 })
    sortOrder: number;

    @OneToMany(() => Place, (place) => place.category)
    places: Place[];

    @CreateDateColumn()
    createdAt: Date;
}