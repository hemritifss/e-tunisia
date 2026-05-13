import { Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { InventoryItem } from '../inventory/inventory.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
export declare class BookingsService {
    private bookingRepo;
    private inventoryRepo;
    private configService;
    private redisService;
    constructor(bookingRepo: Repository<Booking>, inventoryRepo: Repository<InventoryItem>, configService: ConfigService, redisService: RedisService);
    create(userId: string, dto: CreateBookingDto): Promise<Booking>;
    findByUser(userId: string): Promise<Booking[]>;
    findByPlace(placeId: string): Promise<Booking[]>;
    findByHost(hostId: string): Promise<Booking[]>;
    findOne(id: string): Promise<Booking>;
    confirmPayment(id: string, paymentIntentId: string): Promise<Booking>;
    cancel(id: string, userId: string, reason?: string): Promise<Booking>;
    complete(id: string): Promise<Booking>;
    getRevenueStats(placeId?: string): Promise<{
        totalRevenue: number;
        totalBookings: number;
        totalPlatformFees: number;
        totalHostPayouts: number;
    }>;
    private checkAvailability;
    private getPlatformFeePercent;
    private calculateRefund;
    private generateQRCode;
    cleanupExpiredBookings(): Promise<number>;
}
