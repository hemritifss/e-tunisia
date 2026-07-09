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

    /** "How do I get there?" — louage/bus/train/drive/walk estimates between two points. */
    @Get('transport')
    @ApiOperation({ summary: 'Estimated transport options between two coords' })
    transport(
        @Query('from') from: string,
        @Query('to') to: string,
        @Query('fromCity') fromCity?: string,
        @Query('toCity') toCity?: string,
    ) {
        const [a, b] = this.routing.parseCoords(`${from};${to}`);
        return this.routing.transportEstimate(a, b, fromCity, toCity);
    }
}
