import { OnModuleInit } from '@nestjs/common';
import { PassportDto } from '../users/dto/passport.dto';
export declare class OgService implements OnModuleInit {
    private readonly logger;
    private regular;
    private bold;
    onModuleInit(): Promise<void>;
    private loadFont;
    private fetchBinary;
    isReady(): boolean;
    renderPassportCard(p: PassportDto): Promise<Buffer>;
}
