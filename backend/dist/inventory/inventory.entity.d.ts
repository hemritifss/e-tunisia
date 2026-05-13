import { Place } from '../places/place.entity';
export interface AvailabilityRule {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    priceOverride?: number;
}
export interface BlockedDate {
    date: string;
    reason?: string;
}
export declare class InventoryItem {
    id: string;
    placeId: string;
    place: Place;
    type: 'room' | 'tour_slot' | 'experience_slot' | 'table' | 'ticket';
    name: string;
    description: string;
    price: number;
    currency: string;
    capacity: number;
    availability: AvailabilityRule[];
    blockedDates: BlockedDate[];
    images: string[];
    minAdvanceBookingHours: number;
    maxAdvanceBookingDays: number;
    minQuantity: number;
    maxQuantity: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
