import { ItinerariesService } from './itineraries.service';
import { CircuitsService } from './circuits.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
export declare class ItinerariesController {
    private itinerariesService;
    private circuitsService;
    constructor(itinerariesService: ItinerariesService, circuitsService: CircuitsService);
    findAll(): Promise<import("./itinerary.entity").Itinerary[]>;
    listCircuits(): Promise<import("./circuits.service").CircuitSummary[]>;
    getCircuit(slug: string): Promise<import("./circuits.service").CircuitDetail>;
    findOne(id: string): Promise<import("./itinerary.entity").Itinerary>;
    create(req: any, body: CreateItineraryDto): Promise<import("./itinerary.entity").Itinerary>;
    like(id: string): Promise<import("./itinerary.entity").Itinerary>;
}
