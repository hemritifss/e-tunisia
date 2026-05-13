import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ChallengeType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  SEASONAL = 'seasonal',
  SPECIAL = 'special',
}

export enum ChallengeCategory {
  EXPLORE = 'explore',
  PHOTO = 'photo',
  REVIEW = 'review',
  SOCIAL = 'social',
  STREAK = 'streak',
}

@Entity('challenges')
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-enum', enum: ChallengeType, default: ChallengeType.DAILY })
  type: ChallengeType;

  @Column({ type: 'simple-enum', enum: ChallengeCategory, default: ChallengeCategory.EXPLORE })
  category: ChallengeCategory;

  @Column({ type: 'text', nullable: true })
  imageUrl: string;

  @Column({ default: 0 })
  pointsReward: number;

  @Column({ default: 0 })
  xpReward: number;

  @Column({ nullable: true })
  badgeId: string; // Badge awarded on completion

  @Column({ type: 'simple-json', nullable: true })
  requirements: {
    action: string; // 'visit_place', 'write_review', 'share_post', 'upload_photo', etc.
    targetCount: number;
    targetPlaceId?: string;
    targetCategory?: string;
    targetGovernorate?: string;
  };

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
