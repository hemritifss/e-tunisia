import { EventsService } from './events.service';
export declare class EventsController {
    private eventsService;
    constructor(eventsService: EventsService);
    findAll(category?: string): Promise<import("./event.entity").Event[]>;
    getUpcoming(): Promise<import("./event.entity").Event[]>;
    findOne(id: string): Promise<import("./event.entity").Event>;
    create(req: any, body: any): Promise<import("./event.entity").Event>;
    attend(id: string): Promise<import("./event.entity").Event>;
}
