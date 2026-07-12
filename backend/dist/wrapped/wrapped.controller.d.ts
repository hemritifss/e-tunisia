import { WrappedService } from './wrapped.service';
export declare class WrappedController {
    private readonly wrapped;
    constructor(wrapped: WrappedService);
    get(handle: string): Promise<import("./wrapped.service").WrappedDto>;
}
