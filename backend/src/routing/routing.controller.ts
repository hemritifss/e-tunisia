import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoutingService } from './routing.service';

@ApiTags('routing')
@Controller('routing')
export class RoutingController {
    constructor(private readonly routing: RoutingService) {}

    /** Real road route through the given stops, in the given order. */
    @Get('route')
    @ApiOperation({ summary: 'Driving route (road geometry + per-leg distance/duration)' })
    route(@Query('coords') coords: string) {
        return this.routing.route(this.routing.parseCoords(coords));
    }

    /** Best visiting order for the given stops (start fixed), plus its route. */
    @Get('optimize')
    @ApiOperation({ summary: 'Optimize stop order for shortest drive (TSP), returns route' })
    optimize(@Query('coords') coords: string) {
        return this.routing.optimize(this.routing.parseCoords(coords));
    }
}
