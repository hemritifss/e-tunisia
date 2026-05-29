import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('follows')
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  followerId: string; // Who is following

  @Column()
  followingId: string; // Who is being followed

  // The `follows` table is shared with users/follow.entity, which has a NOT NULL
  // `followedId`. Mirror followingId here so inserts via this service satisfy that
  // column and both follow subsystems (social + activity/feed) see the same edges.
  @Column()
  followedId: string;

  @CreateDateColumn()
  createdAt: Date;
}
