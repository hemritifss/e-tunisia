import { RoutingService } from './routing.service';
export declare class RoutingController {
    private readonly routing;
    constructor(routing: RoutingService);
    route(coords: string): Promise<import("./routing.service").RouteResult>;
    optimize(coords: string): Promise<import("./routing.service").OptimizeResult>;
    transport(from: string, to: string, fromCity?: string, toCity?: string): {
        distanceKm: number;
        straightKm: number;
        options: any[];
    };
}
