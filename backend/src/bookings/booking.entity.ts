import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Place } from '../places/place.entity';
import { User } from '../users/user.entity';
import { InventoryItem } from '../inventory/inventory.entity';

export interface BookingGuest {
  name: string;
  email?: string;
  phone?: string;
  age?: number;
}

export interface BookingAddon {
  name: string;
  price: number;
  quantity: number;
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  placeId: string;

  @ManyToOne(() => Place, (place) => place.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'placeId' })
  place: Place;

  @Column()
  @Index()
  itemId: string;

  @ManyToOne(() => InventoryItem, (item) => item.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: InventoryItem;

  @Column({
    type: 'simple-enum',
    enum: ['hotel', 'tour', 'experience', 'event', 'restaurant'],
  })
  type: 'hotel' | 'tour' | 'experience' | 'event' | 'restaurant';

  @Column({ type: 'date' })
  checkIn: Date;

  @Column({ type: 'date', nullable: true })
  checkOut: Date;

  @Column({ type: 'time', nullable: true })
  startTime: string;

  @Column({ type: 'time', nullable: true })
  endTime: string;

  @Column({ type: 'int', default: 1 })
  guests: number;

  @Column({ type: 'simple-json', nullable: true })
  guestDetails: BookingGuest[];

  @Column({ type: 'simple-json', nullable: true })
  addons: BookingAddon[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  platformFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  hostPayout: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ default: 'TND' })
  currency: string;

  @Column({
    type: 'simple-enum',
    enum: ['pending', 'confirmed', 'paid', 'completed', 'cancelled', 'refunded'],
    default: 'pending',
  })
  status: 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled' | 'refunded';

  @Column({ nullable: true })
  paymentIntentId: string;

  @Column({ nullable: true })
  paymentMethod: string;

  /** When the host was manually paid their hostPayout for this booking (Tier 2.6
   *  payout ledger). Null = still owed. Nullable so synchronize adds it cleanly. */
  @Column({ type: 'timestamp', nullable: true })
  payoutSettledAt: Date | null;

  @Column({ type: 'simple-enum', enum: ['flexible', 'moderate', 'strict'], default: 'moderate' })
  cancellationPolicy: 'flexible' | 'moderate' | 'strict';

  @Column({ type: 'text', nullable: true })
  specialRequests: string;

  @Column({ nullable: true })
  qrCode: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
