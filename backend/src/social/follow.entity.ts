import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

// NOTE: this maps the SAME `follows` table as users/follow.entity. The two MUST
// declare an identical schema or TypeORM synchronize fights over the columns
// (it was dropping + re-adding followingId as NOT NULL and failing on existing
// rows, which aborted the whole schema sync). Keep both in lock-step.
@Entity('follows')
@Unique(['followerId', 'followedId'])
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  followerId: string; // Who is following

  // Mirror of followedId; nullable so inserts from either subsystem succeed.
  @Column({ nullable: true })
  followingId: string; // Who is being followed

  @Column()
  @Index()
  followedId: string;

  @CreateDateColumn()
  createdAt: Date;
}
