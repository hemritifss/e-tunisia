import { Repository } from 'typeorm';
import { InventoryItem } from './inventory.entity';
import { Booking } from '../bookings/booking.entity';
export declare class InventoryService {
    private inventoryRepo;
    private bookingRepo;
    constructor(inventoryRepo: Repository<InventoryItem>, bookingRepo: Repository<Booking>);
    create(dto: Partial<InventoryItem>): Promise<InventoryItem>;
    findByPlace(placeId: string): Promise<InventoryItem[]>;
    findOne(id: string): Promise<InventoryItem>;
    update(id: string, dto: Partial<InventoryItem>): Promise<InventoryItem>;
    remove(id: string): Promise<void>;
    checkAvailability(itemId: string, checkIn: string, checkOut: string, guests: number): Promise<{
        available: boolean;
        price: number;
        blockedDates?: string[];
    }>;
}
