import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Event } from './event.entity';

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(Event)
        private eventsRepo: Repository<Event>,
    ) {}

    async findAll(category?: string) {
        const qb = this.eventsRepo
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.place', 'place')
            .leftJoinAndSelect('event.organizer', 'organizer')
            .where('event.isActive = :active', { active: true });

        if (category) {
            qb.andWhere('event.category = :category', { category });
        }

        qb.orderBy('event.startDate', 'ASC');
        return qb.getMany();
    }

    async findUpcoming() {
        return this.eventsRepo.find({
            where: { isActive: true, startDate: MoreThanOrEqual(new Date()) },
            relations: ['place', 'organizer'],
            order: { startDate: 'ASC' },
            take: 10,
        });
    }

    async findById(id: string) {
        const event = await this.eventsRepo.findOne({
            where: { id },
            relations: ['place', 'organizer'],
        });
        if (!event) throw new NotFoundException('Event not found');
        return event;
    }

    async create(organizerId: string, data: Partial<Event>) {
        const event = this.eventsRepo.create({ ...data, organizerId });
        return this.eventsRepo.save(event);
    }

    async attend(id: string) {
        const event = await this.findById(id);
        event.attendeeCount += 1;
        return this.eventsRepo.save(event);
    }

    async findAllAdmin() {
        return this.eventsRepo.find({ order: { createdAt: 'DESC' }, relations: ['place', 'organizer'] });
    }

    async toggleActive(id: string) {
        const event = await this.findById(id);
        event.isActive = !event.isActive;
        return this.eventsRepo.save(event);
    }
}
