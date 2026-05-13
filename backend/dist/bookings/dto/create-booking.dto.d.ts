declare class BookingGuestDto {
    name: string;
    email?: string;
    phone?: string;
    age?: number;
}
declare class BookingAddonDto {
    name: string;
    price: number;
    quantity: number;
}
export declare class CreateBookingDto {
    placeId: string;
    itemId: string;
    type: 'hotel' | 'tour' | 'experience' | 'event' | 'restaurant';
    checkIn: string;
    checkOut?: string;
    startTime?: string;
    guests: number;
    guestDetails?: BookingGuestDto[];
    addons?: BookingAddonDto[];
    specialRequests?: string;
}
export {};
