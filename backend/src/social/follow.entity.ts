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

  @CreateDateColumn()
  createdAt: Date;
}
