import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Follow } from './follow.entity';
import { Endorsement } from './endorsement.entity';
import { Review } from '../reviews/review.entity';
import { Place } from '../places/place.entity';
import { TripPlan } from '../itineraries/trip-plan.entity';
import { UsersService } from './users.service';
export type ActivityType = 'review' | 'trip' | 'endorse' | 'follow';
export interface ActivityActor {
    id: string;
    handle: string | null;
    fullName: string;
    avatar: string | null;
    plan: 'free' | 'premium' | 'business';
    role?: string;
}
export interface ActivityEntry {
    type: ActivityType;
    createdAt: string;
    actor: ActivityActor;
    target?: any;
}
export declare class ActivityService {
    private followsRepo;
    private reviewsRepo;
    private tripsRepo;
    private endorsementsRepo;
    private usersRepo;
    private placesRepo;
    private users;
    constructor(followsRepo: Repository<Follow>, reviewsRepo: Repository<Review>, tripsRepo: Repository<TripPlan>, endorsementsRepo: Repository<Endorsement>, usersRepo: Repository<User>, placesRepo: Repository<Place>, users: UsersService);
    globalFeed(limit?: number): Promise<ActivityEntry[]>;
    followingFeed(viewerId: string, limit?: number): Promise<ActivityEntry[]>;
}
