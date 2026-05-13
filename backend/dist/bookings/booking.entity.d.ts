import { Place } from '../places/place.entity';
import { User } from '../users/user.entity';
import { InventoryItem } from '../inventory/inventory.entity';
export interface BookingGuest {
    name: string;
    email?: string;
    phone?: string;
    age?: number;
}
export interface BookingAddon {
    name: string;
    price: number;
    quantity: number;
}
export declare class Booking {
    id: string;
    userId: string;
    user: User;
    placeId: string;
    place: Place;
    itemId: string;
    item: InventoryItem;
    type: 'hotel' | 'tour' | 'experience' | 'event' | 'restaurant';
    checkIn: Date;
    checkOut: Date;
    startTime: string;
    endTime: string;
    guests: number;
    guestDetails: BookingGuest[];
    addons: BookingAddon[];
    subtotal: number;
    platformFee: number;
    hostPayout: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
    status: 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled' | 'refunded';
    paymentIntentId: string;
    paymentMethod: string;
    cancellationPolicy: 'flexible' | 'moderate' | 'strict';
    specialRequests: string;
    qrCode: string;
    metadata: Record<string, unknown>;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
