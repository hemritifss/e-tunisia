import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ActivityType {
  VISITED_PLACE = 'visited_place',
  WROTE_REVIEW = 'wrote_review',
  SHARED_POST = 'shared_post',
  ADDED_FAVORITE = 'added_favorite',
  EARNED_BADGE = 'earned_badge',
  COMPLETED_CHALLENGE = 'completed_challenge',
  FOLLOWED_USER = 'followed_user',
  BOOKED_EXPERIENCE = 'booked_experience',
}

@Entity('activities')
// Following-feed: userId IN (…) ORDER BY createdAt. Global feed: isPublic +
// createdAt. Both scanned the whole table before this.
@Index(['userId', 'createdAt'])
@Index(['isPublic', 'createdAt'])
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string; // Who did the action

  @Column({ type: 'simple-enum', enum: ActivityType })
  type: ActivityType;

  @Column({ type: 'simple-json' })
  data: {
    placeId?: string;
    placeName?: string;
    placeImage?: string;
    reviewId?: string;
    postId?: string;
    badgeName?: string;
    badgeIcon?: string;
    targetUserId?: string;
    targetUserName?: string;
    bookingId?: string;
    challengeTitle?: string;
  };

  @Column({ default: false })
  isPublic: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
