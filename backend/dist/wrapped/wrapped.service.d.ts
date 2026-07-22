import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Place } from '../places/place.entity';
import { Review } from '../reviews/review.entity';
import { PlaceVisit } from '../users/place-visit.entity';
import { BeachReport } from '../beaches/beach-report.entity';
export interface WrappedPersonality {
    key: string;
    label: string;
    emoji: string;
    blurb: string;
}
export interface WrappedDto {
    handle: string;
    fullName: string;
    avatar: string | null;
    period: {
        label: string;
        from: string;
        to: string;
        year: number;
    };
    isEmpty: boolean;
    stats: {
        checkIns: number;
        citiesCount: number;
        governoratesCount: number;
        reviews: number;
        gems: number;
        beachReports: number;
    };
    cities: string[];
    topCity: {
        city: string;
        count: number;
    } | null;
    firstTrip: {
        city: string;
        at: string;
    } | null;
    personality: WrappedPersonality;
    points: number;
    passportLevel: string;
    founderNumber: number | null;
}
export declare class WrappedService {
    private readonly users;
    private readonly places;
    private readonly reviews;
    private readonly visits;
    private readonly beachReports;
    constructor(users: Repository<User>, places: Repository<Place>, reviews: Repository<Review>, visits: Repository<PlaceVisit>, beachReports: Repository<BeachReport>);
    private fold;
    private summerWindow;
    build(handle: string): Promise<WrappedDto>;
    private derivePersonality;
}
