import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    create(userId: string, dto: CreateBookingDto): Promise<import("./booking.entity").Booking>;
    findMyBookings(userId: string): Promise<import("./booking.entity").Booking[]>;
    findHostBookings(userId: string): Promise<import("./booking.entity").Booking[]>;
    findByPlace(placeId: string): Promise<import("./booking.entity").Booking[]>;
    ownerEarnings(userId: string): Promise<{
        summary: {
            bookings: number;
            grossTnd: number;
            commissionTnd: number;
            netTnd: number;
            owedTnd: number;
            paidOutTnd: number;
        };
        entries: {
            id: any;
            placeId: any;
            placeName: any;
            currency: any;
            grossTnd: number;
            commissionTnd: number;
            netTnd: number;
            status: any;
            checkIn: any;
            settled: boolean;
            payoutSettledAt: any;
            createdAt: any;
        }[];
    }>;
    settlePayout(id: string): Promise<{
        id: string;
        payoutSettledAt: Date;
    }>;
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
