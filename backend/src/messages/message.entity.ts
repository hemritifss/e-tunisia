import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('messages')
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
