import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Booking } from './booking.entity';
import { InventoryItem } from '../inventory/inventory.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    @InjectRepository(InventoryItem)
    private inventoryRepo: Repository<InventoryItem>,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async create(userId: string, dto: CreateBookingDto): Promise<Booking> {
    const item = await this.inventoryRepo.findOne({
      where: { id: dto.itemId, isActive: true },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    // Check availability
    const isAvailable = await this.checkAvailability(
      dto.itemId,
      dto.checkIn,
      dto.checkOut,
      dto.guests,
    );

    if (!isAvailable) {
      throw new ConflictException('This item is not available for the selected dates');
    }

    // Validate min/max advance booking
    const checkInDate = new Date(dto.checkIn);
    const now = new Date();
    const hoursUntilCheckIn =
      (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilCheckIn < item.minAdvanceBookingHours) {
      throw new BadRequestException(
        `Must book at least ${item.minAdvanceBookingHours} hours in advance`,
      );
    }

    const daysUntilCheckIn = hoursUntilCheckIn / 24;
    if (daysUntilCheckIn > item.maxAdvanceBookingDays) {
      throw new BadRequestException(
        `Can only book up to ${item.maxAdvanceBookingDays} days in advance`,
      );
    }

    // Calculate pricing
    const nights = dto.checkOut
      ? Math.ceil(
          (new Date(dto.checkOut).getTime() - checkInDate.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 1;

    const subtotal = item.price * dto.guests * nights;
    const platformFeePercent = this.getPlatformFeePercent(subtotal);
    const platformFee = Math.round(subtotal * platformFeePercent * 100) / 100;
    const taxRate = 0.07; // 7% tourism tax
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const totalAmount = subtotal + platformFee + taxAmount;
    const hostPayout = subtotal - platformFee;

    // Create booking with 15-minute hold
    const booking = this.bookingRepo.create({
      userId,
      placeId: dto.placeId,
      itemId: dto.itemId,
      type: dto.type,
      checkIn: checkInDate,
      checkOut: dto.checkOut ? new Date(dto.checkOut) : null,
      startTime: dto.startTime || null,
      guests: dto.guests,
      guestDetails: dto.guestDetails || [],
      addons: dto.addons || [],
      subtotal,
      platformFee,
      hostPayout,
      taxAmount,
      totalAmount,
      currency: item.currency,
      status: 'pending',
      cancellationPolicy: 'moderate',
      specialRequests: dto.specialRequests || null,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min hold
    });

    const saved = await this.bookingRepo.save(booking);

    // Set cache hold
    await this.redisService.set(
      `booking:hold:${dto.itemId}:${dto.checkIn}`,
      saved.id,
      15 * 60,
    );

    return saved;
  }

  async findByUser(userId: string): Promise<Booking[]> {
    return this.bookingRepo.find({
      where: { userId },
      relations: ['place', 'item'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByPlace(placeId: string): Promise<Booking[]> {
    return this.bookingRepo.find({
      where: { placeId },
      relations: ['user', 'item'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByHost(hostId: string): Promise<Booking[]> {
    // Find bookings for places owned by this host
    return this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.place', 'place')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.item', 'item')
      .where('place.submittedBy = :hostId', { hostId })
      .orderBy('booking.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['place', 'user', 'item'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async confirmPayment(id: string, paymentIntentId: string): Promise<Booking> {
    const booking = await this.findOne(id);

    if (booking.status !== 'pending') {
      throw new BadRequestException('Booking is not in pending status');
    }

    if (new Date() > booking.expiresAt) {
      throw new BadRequestException('Booking hold has expired');
    }

    booking.status = 'confirmed';
    booking.paymentIntentId = paymentIntentId;
    booking.qrCode = this.generateQRCode(booking.id);

    return this.bookingRepo.save(booking);
  }

  async cancel(id: string, userId: string, reason?: string): Promise<Booking> {
    const booking = await this.findOne(id);

    if (booking.userId !== userId) {
      throw new BadRequestException('Not authorized to cancel this booking');
    }

    if (['cancelled', 'refunded', 'completed'].includes(booking.status)) {
      throw new BadRequestException('Booking cannot be cancelled');
    }

    // Calculate refund based on policy
    const refundAmount = this.calculateRefund(booking);

    booking.status = refundAmount > 0 ? 'refunded' : 'cancelled';
    booking.metadata = {
      ...booking.metadata,
      cancellationReason: reason,
      refundAmount,
      cancelledAt: new Date().toISOString(),
    };

    // Release hold
    await this.redisService.del(
      `booking:hold:${booking.itemId}:${booking.checkIn.toISOString().split('T')[0]}`,
    );

    return this.bookingRepo.save(booking);
  }

  async complete(id: string): Promise<Booking> {
    const booking = await this.findOne(id);
    booking.status = 'completed';
    return this.bookingRepo.save(booking);
  }

  async getRevenueStats(placeId?: string): Promise<{
    totalRevenue: number;
    totalBookings: number;
    totalPlatformFees: number;
    totalHostPayouts: number;
  }> {
    const qb = this.bookingRepo
      .createQueryBuilder('booking')
      .select([
        'SUM(booking.totalAmount) as totalRevenue',
        'COUNT(*) as totalBookings',
        'SUM(booking.platformFee) as totalPlatformFees',
        'SUM(booking.hostPayout) as totalHostPayouts',
      ])
      .where('booking.status IN (:...statuses)', {
        statuses: ['confirmed', 'paid', 'completed'],
      });

    if (placeId) {
      qb.andWhere('booking.placeId = :placeId', { placeId });
    }

    const result = await qb.getRawOne();

    return {
      totalRevenue: Number(result.totalRevenue) || 0,
      totalBookings: Number(result.totalBookings) || 0,
      totalPlatformFees: Number(result.totalPlatformFees) || 0,
      totalHostPayouts: Number(result.totalHostPayouts) || 0,
    };
  }

  private async checkAvailability(
    itemId: string,
    checkIn: string,
    checkOut: string | undefined,
    guests: number,
  ): Promise<boolean> {
    const item = await this.inventoryRepo.findOne({ where: { id: itemId } });
    if (!item) return false;

    if (guests > item.capacity) return false;

    // Check if there's a conflicting booking
    const qb = this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.itemId = :itemId', { itemId })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: ['pending', 'confirmed', 'paid'],
      });

    // Date overlap check
    if (checkOut) {
      qb.andWhere(
        '((booking.checkIn <= :checkOut AND booking.checkOut >= :checkIn) OR (booking.checkIn <= :checkIn AND booking.checkOut >= :checkIn))',
        { checkIn, checkOut },
      );
    } else {
      qb.andWhere('booking.checkIn = :checkIn', { checkIn });
    }

    const conflicting = await qb.getCount();
    return conflicting === 0;
  }

  private getPlatformFeePercent(subtotal: number): number {
    // Tiered commission
    if (subtotal >= 1000) return 0.1; // 10% for high value
    if (subtotal >= 500) return 0.12; // 12% for medium value
    return 0.15; // 15% for small value
  }

  private calculateRefund(booking: Booking): number {
    const now = new Date();
    const checkIn = new Date(booking.checkIn);
    const hoursUntil = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);

    switch (booking.cancellationPolicy) {
      case 'flexible':
        return hoursUntil >= 24 ? booking.totalAmount : booking.totalAmount * 0.5;
      case 'moderate':
        return hoursUntil >= 72 ? booking.totalAmount : hoursUntil >= 24 ? booking.subtotal * 0.5 : 0;
      case 'strict':
        return hoursUntil >= 168 ? booking.totalAmount * 0.8 : hoursUntil >= 72 ? booking.totalAmount * 0.5 : 0;
      default:
        return 0;
    }
  }

  private generateQRCode(bookingId: string): string {
    // Simple base64 encoded QR-like data
    // In production, use a QR code library
    return `ETUNISIA:${bookingId}:${Date.now()}`;
  }

  // Clean up expired pending bookings
  async cleanupExpiredBookings(): Promise<number> {
    const expired = await this.bookingRepo.find({
      where: {
        status: 'pending',
        expiresAt: LessThan(new Date()),
      },
    });

    for (const booking of expired) {
      booking.status = 'cancelled';
      booking.metadata = {
        ...booking.metadata,
        cancellationReason: 'Expired - payment not completed within 15 minutes',
      };
    }

    if (expired.length > 0) {
      await this.bookingRepo.save(expired);
    }

    return expired.length;
  }
}
