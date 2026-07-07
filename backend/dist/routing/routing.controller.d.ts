import { RoutingService } from './routing.service';
export declare class RoutingController {
    private readonly routing;
    constructor(routing: RoutingService);
    route(coords: string): Promise<import("./routing.service").RouteResult>;
    optimize(coords: string): Promise<import("./routing.service").OptimizeResult>;
}
