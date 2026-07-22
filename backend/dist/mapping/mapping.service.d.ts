import { Repository } from 'typeorm';
import { MappingEvent } from './mapping-event.entity';
import { Place } from '../places/place.entity';
import { User } from '../users/user.entity';
import { PlaceConfirmation } from '../gems/place-confirmation.entity';
import { PlaceVisit } from '../users/place-visit.entity';
import { Review } from '../reviews/review.entity';
import { BeachReport } from '../beaches/beach-report.entity';
export type EventStatus = 'upcoming' | 'live' | 'ended';
export declare class MappingService {
    private readonly events;
    private readonly places;
    private readonly users;
    private readonly confirmations;
    private readonly visits;
    private readonly reviews;
    private readonly beachReports;
    constructor(events: Repository<MappingEvent>, places: Repository<Place>, users: Repository<User>, confirmations: Repository<PlaceConfirmation>, visits: Repository<PlaceVisit>, reviews: Repository<Review>, beachReports: Repository<BeachReport>);
    private fold;
    featured(): Promise<MappingEvent | null>;
    status(event: MappingEvent, now?: Date): EventStatus;
    standings(slug?: string, viewerId?: string): Promise<{
        event: {
            slug: string;
            title: string;
            subtitle: string;
            startsAt: Date;
            endsAt: Date;
            prizes: string;
        };
        status: EventStatus;
        now: string;
        totals: {
            contributors: number;
            gems: number;
            governorates: number;
            points: number;
        };
        governorates: {
            rank: number;
            governorate: string;
            points: number;
            gems: number;
            contributors: number;
        }[];
        topContributors: {
            handle: any;
            fullName: any;
            avatar: any;
            governorate: string;
            points: number;
            rank: number;
        }[];
        me: {
            points: number;
            rank: number;
            governorate: string | null;
        };
    }>;
    create(input: {
        slug: string;
        title: string;
        subtitle?: string;
        startsAt: string;
        endsAt: string;
        prizes?: string;
        featured?: boolean;
    }): Promise<MappingEvent>;
}
