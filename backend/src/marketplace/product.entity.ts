import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum ProductCategory {
  HANDICRAFT = 'handicraft',
  FOOD = 'food',
  ART = 'art',
  CLOTHING = 'clothing',
  EXPERIENCE = 'experience',
  SOUVENIR = 'souvenir',
  BOOK = 'book',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sellerId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'TND' })
  currency: string;

  @Column({ type: 'simple-enum', enum: ProductCategory })
  category: ProductCategory;

  @Column({ type: 'simple-json', nullable: true })
  images: string[];

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'simple-json', nullable: true })
  shippingOptions: Array<{
    name: string;
    price: number;
    estimatedDays: number;
  }>;

  @Column({ default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ type: 'simple-json', nullable: true })
  attributes: Record<string, string>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
