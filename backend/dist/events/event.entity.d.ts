import { User } from '../users/user.entity';
import { Place } from '../places/place.entity';
export declare class Event {
    id: string;
    title: string;
    description: string;
    coverImage: string;
    place: Place;
    placeId: string;
    startDate: Date;
    endDate: Date;
    category: string;
    price: number;
    currency: string;
    isFree: boolean;
    isOnline: boolean;
    location: string;
    organizer: User;
    organizerId: string;
    attendeeCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
