import { Repository } from 'typeorm';
import { Itinerary } from './itinerary.entity';
export declare class ItinerariesService {
    private itinerariesRepo;
    constructor(itinerariesRepo: Repository<Itinerary>);
    findAll(): Promise<Itinerary[]>;
    findById(id: string): Promise<Itinerary>;
    create(authorId: string, data: Partial<Itinerary>): Promise<Itinerary>;
    like(id: string): Promise<Itinerary>;
}
