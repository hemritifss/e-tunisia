import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    findByPlace(placeId: string): Promise<import("./inventory.entity").InventoryItem[]>;
    findOne(id: string): Promise<import("./inventory.entity").InventoryItem>;
    checkAvailability(id: string, checkIn: string, checkOut: string, guests: number): Promise<{
        available: boolean;
        price: number;
        blockedDates?: string[];
    }>;
    create(dto: any): Promise<import("./inventory.entity").InventoryItem>;
    update(id: string, dto: any): Promise<import("./inventory.entity").InventoryItem>;
    remove(id: string): Promise<void>;
}
