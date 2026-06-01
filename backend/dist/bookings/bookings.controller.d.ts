import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    create(userId: string, dto: CreateBookingDto): Promise<import("./booking.entity").Booking>;
    findMyBookings(userId: string): Promise<import("./booking.entity").Booking[]>;
    findHostBookings(userId: string): Promise<import("./booking.entity").Booking[]>;
    findByPlace(placeId: string): Promise<import("./booking.entity").Booking[]>;
    findOne(id: string): Promise<import("./booking.entity").Booking>;
    confirmPayment(id: string, paymentIntentId: string): Promise<import("./booking.entity").Booking>;
    cancel(userId: string, id: string, reason?: string): Promise<import("./booking.entity").Booking>;
    complete(id: string): Promise<import("./booking.entity").Booking>;
    getRevenueStats(placeId?: string): Promise<{
        totalRevenue: number;
        totalBookings: number;
        totalPlatformFees: number;
        totalHostPayouts: number;
    }>;
}
