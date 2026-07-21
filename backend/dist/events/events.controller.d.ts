import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
export declare class EventsController {
    private eventsService;
    constructor(eventsService: EventsService);
    findAll(category?: string, city?: string): Promise<import("./event.entity").Event[]>;
    getUpcoming(): Promise<import("./event.entity").Event[]>;
    findOne(id: string): Promise<import("./event.entity").Event>;
    create(req: any, body: CreateEventDto): Promise<import("./event.entity").Event>;
    attend(id: string): Promise<import("./event.entity").Event>;
}
