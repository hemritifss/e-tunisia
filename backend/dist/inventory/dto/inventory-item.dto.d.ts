declare const ITEM_TYPES: readonly ["room", "tour_slot", "experience_slot", "table", "ticket"];
export declare class CreateInventoryItemDto {
    placeId: string;
    type: (typeof ITEM_TYPES)[number];
    name: string;
    description?: string;
    price: number;
    currency?: string;
    capacity?: number;
    availability?: any[];
    blockedDates?: any[];
    images?: string[];
    minAdvanceBookingHours?: number;
    maxAdvanceBookingDays?: number;
    minQuantity?: number;
    maxQuantity?: number;
}
export declare class UpdateInventoryItemDto {
    type?: (typeof ITEM_TYPES)[number];
    name?: string;
    description?: string;
    price?: number;
    currency?: string;
    capacity?: number;
    availability?: any[];
    blockedDates?: any[];
    images?: string[];
    minAdvanceBookingHours?: number;
    maxAdvanceBookingDays?: number;
    minQuantity?: number;
    maxQuantity?: number;
}
export {};
