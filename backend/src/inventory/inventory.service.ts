import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from './inventory.entity';
import { Booking } from '../bookings/booking.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private inventoryRepo: Repository<InventoryItem>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
  ) {}

  async create(dto: Partial<InventoryItem>): Promise<InventoryItem> {
    const item = this.inventoryRepo.create(dto);
    return this.inventoryRepo.save(item);
  }

  async findByPlace(placeId: string): Promise<InventoryItem[]> {
    return this.inventoryRepo.find({
      where: { placeId, isActive: true },
      order: { price: 'ASC' },
    });
  }

  async findOne(id: string): Promise<InventoryItem> {
    const item = await this.inventoryRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async update(id: string, dto: Partial<InventoryItem>): Promise<InventoryItem> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.inventoryRepo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    item.isActive = false;
    await this.inventoryRepo.save(item);
  }

  async checkAvailability(
    itemId: string,
    checkIn: string,
    checkOut: string,
    guests: number,
  ): Promise<{
    available: boolean;
    price: number;
    blockedDates?: string[];
  }> {
    const item = await this.findOne(itemId);

    if (guests > item.capacity) {
      return { available: false, price: 0 };
    }

    // Check blocked dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = checkOut ? new Date(checkOut) : checkInDate;
    const blockedDates: string[] = [];

    if (item.blockedDates) {
      for (
        let d = new Date(checkInDate);
        d <= checkOutDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toISOString().split('T')[0];
        if (item.blockedDates.some((bd) => bd.date === dateStr)) {
          blockedDates.push(dateStr);
        }
      }
    }

    if (blockedDates.length > 0) {
      return { available: false, price: 0, blockedDates };
    }

    // Check conflicting bookings
    const qb = this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.itemId = :itemId', { itemId })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: ['pending', 'confirmed', 'paid'],
      });

    if (checkOut) {
      qb.andWhere(
        '(booking.checkIn <= :checkOut AND (booking.checkOut >= :checkIn OR booking.checkOut IS NULL))',
        { checkIn, checkOut },
      );
    } else {
      qb.andWhere(
        '(booking.checkIn = :checkIn OR (booking.checkIn <= :checkIn AND booking.checkOut >= :checkIn))',
        { checkIn },
      );
    }

    const conflicts = await qb.getCount();

    if (conflicts > 0) {
      return { available: false, price: 0 };
    }

    return { available: true, price: Number(item.price) };
  }
}
