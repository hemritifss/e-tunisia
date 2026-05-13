import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Place } from '../places/place.entity';

export interface AvailabilityRule {
  dayOfWeek: number; // 0-6
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAvailable: boolean;
  priceOverride?: number;
}

export interface BlockedDate {
  date: string; // YYYY-MM-DD
  reason?: string;
}

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  placeId: string;

  @ManyToOne(() => Place, (place) => place.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'placeId' })
  place: Place;

  @Column({
    type: 'simple-enum',
    enum: ['room', 'tour_slot', 'experience_slot', 'table', 'ticket'],
  })
  type: 'room' | 'tour_slot' | 'experience_slot' | 'table' | 'ticket';

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'TND' })
  currency: string;

  @Column({ type: 'int', default: 1 })
  capacity: number;

  @Column({ type: 'simple-json', nullable: true })
  availability: AvailabilityRule[];

  @Column({ type: 'simple-json', nullable: true })
  blockedDates: BlockedDate[];

  @Column({ type: 'simple-json', nullable: true })
  images: string[];

  @Column({ type: 'int', default: 0 })
  minAdvanceBookingHours: number;

  @Column({ type: 'int', default: 365 })
  maxAdvanceBookingDays: number;

  @Column({ type: 'int', default: 1 })
  minQuantity: number;

  @Column({ type: 'int', default: 10 })
  maxQuantity: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
