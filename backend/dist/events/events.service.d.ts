import { Repository } from 'typeorm';
import { Event } from './event.entity';
export declare class EventsService {
    private eventsRepo;
    constructor(eventsRepo: Repository<Event>);
    findAll(category?: string): Promise<Event[]>;
    findUpcoming(): Promise<Event[]>;
    findById(id: string): Promise<Event>;
    create(organizerId: string, data: Partial<Event>): Promise<Event>;
    attend(id: string): Promise<Event>;
    findAllAdmin(): Promise<Event[]>;
    toggleActive(id: string): Promise<Event>;
}
