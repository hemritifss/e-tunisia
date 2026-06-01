import { ItinerariesService } from './itineraries.service';
export declare class ItinerariesController {
    private itinerariesService;
    constructor(itinerariesService: ItinerariesService);
    findAll(): Promise<import("./itinerary.entity").Itinerary[]>;
    findOne(id: string): Promise<import("./itinerary.entity").Itinerary>;
    create(req: any, body: any): Promise<import("./itinerary.entity").Itinerary>;
    like(id: string): Promise<import("./itinerary.entity").Itinerary>;
}
