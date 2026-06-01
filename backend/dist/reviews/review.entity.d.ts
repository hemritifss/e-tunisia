import { User } from '../users/user.entity';
import { Place } from '../places/place.entity';
export declare class Review {
    id: string;
    rating: number;
    comment: string;
    images: string[];
    user: User;
    userId: string;
    place: Place;
    placeId: string;
    verifiedInquiryId: string | null;
    hostReply: string | null;
    hostRepliedAt: Date | null;
    createdAt: Date;
}
