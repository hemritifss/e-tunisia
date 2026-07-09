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

    // Mirror of followedId used by the social/feed subsystem (social/follow.entity
    // maps the SAME table). Declared identically in both entities and nullable so
    // TypeORM synchronize doesn't churn/drop this column across the two mappings.
    @Column({ nullable: true })
    followingId: string;

    @CreateDateColumn()
    createdAt: Date;
}
