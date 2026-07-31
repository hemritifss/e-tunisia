import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('messages')
// Every thread fetch filters by roomId and orders by createdAt; without this
// that was a full-table scan + sort on the busiest read path in the app.
@Index(['roomId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  roomId: string;

  @Column()
  senderId: string;

  @Column('text')
  content: string;

  @Column({ default: 'text' })
  type: string; // text, image, location, booking_invite

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ default: false })
  isRead: boolean;

  /**
   * Unsent by its sender. Kept as a tombstone (content cleared) rather than
   * hard-deleted, so the thread can show "You removed a message" like the
   * apps people expect, instead of silently losing history.
   */
  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
