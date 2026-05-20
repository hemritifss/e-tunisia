import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, Index, Unique,
} from 'typeorm';

/**
 * One row per (follower → followed) edge in the social graph.
 *
 * Denormalized counts on the User entity (followersCount / followingCount)
 * are kept in sync via FollowsService — never modify them outside that service.
 */
@Entity('follows')
@Unique(['followerId', 'followedId'])
export class Follow {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /** The user doing the following. */
    @Column()
    @Index()
    followerId: string;

    /** The user being followed. */
    @Column()
    @Index()
    followedId: string;

    @CreateDateColumn()
    createdAt: Date;
}
