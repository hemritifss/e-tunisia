import { Controller, Get, Param } from '@nestjs/common';
import { WrappedService } from './wrapped.service';

/** Public read: anyone can view a shared "Summer in Tunisia" Wrapped. */
@Controller('wrapped')
export class WrappedController {
    constructor(private readonly wrapped: WrappedService) {}

    @Get(':handle')
    get(@Param('handle') handle: string) {
        return this.wrapped.build(handle);
    }
}
