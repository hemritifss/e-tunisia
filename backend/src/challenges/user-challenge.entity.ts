import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Challenge } from './challenge.entity';

export enum UserChallengeStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CLAIMED = 'claimed',
  EXPIRED = 'expired',
}

@Entity('user_challenges')
export class UserChallenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  challengeId: string;

  @ManyToOne(() => Challenge, { eager: true })
  @JoinColumn({ name: 'challengeId' })
  challenge: Challenge;

  @Column({ type: 'simple-enum', enum: UserChallengeStatus, default: UserChallengeStatus.IN_PROGRESS })
  status: UserChallengeStatus;

  @Column({ default: 0 })
  progress: number;

  @Column({ default: 0 })
  target: number;

  @Column({ type: 'simple-json', nullable: true })
  progressDetails: Record<string, unknown>;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  claimedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
