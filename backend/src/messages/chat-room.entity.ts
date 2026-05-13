import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ type: 'simple-array' })
  participantIds: string[];

  @Column({ nullable: true })
  creatorId: string;

  @Column({ type: 'simple-enum', enum: ['direct', 'group'], default: 'direct' })
  type: 'direct' | 'group';

  @Column({ type: 'simple-json', nullable: true })
  lastMessage: {
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
  };

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
