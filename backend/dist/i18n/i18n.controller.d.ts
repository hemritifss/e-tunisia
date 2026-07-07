import { I18nService } from './i18n.service';
export declare class I18nController {
    private readonly i18n;
    constructor(i18n: I18nService);
    translate(body: {
        locale?: string;
        entries?: Record<string, string>;
    }): Promise<{
        entries: Record<string, string> | null;
        mock?: boolean;
        cached?: boolean;
    }>;
}
