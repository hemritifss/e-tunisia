import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nService } from './i18n.service';

@ApiTags('i18n')
@Controller('i18n')
export class I18nController {
    constructor(private readonly i18n: I18nService) {}

    /**
     * Public on purpose: tourists need their language before they have an
     * account. Abuse is bounded by the Redis cache (one LLM call per locale
     * per dictionary version) and hard input caps in the service.
     */
    @Post('translate')
    @ApiOperation({ summary: 'AI-translate the UI dictionary into any locale (cached)' })
    translate(@Body() body: { locale?: string; entries?: Record<string, string> }) {
        return this.i18n.pack(body?.locale || '', body?.entries || {});
    }
}
