import { ConfigService } from '@nestjs/config';
export interface LlmMessage {
    role: 'user' | 'assistant';
    content: any;
}
export interface LlmTool {
    name: string;
    description: string;
    input_schema: Record<string, any>;
}
export interface CompleteOpts {
    system?: string;
    messages: LlmMessage[];
    model?: string;
    maxTokens?: number;
    temperature?: number;
    tools?: LlmTool[];
    toolRunner?: (name: string, input: any) => Promise<any>;
    maxToolRounds?: number;
    premium?: boolean;
    heavy?: boolean;
}
export interface LlmResult {
    text: string;
    stopReason: string | null;
    toolsUsed: string[];
}
export declare class LlmService {
    private readonly config;
    private readonly logger;
    private anthropic;
    private oai;
    private readonly freeModel;
    private readonly freeModelPro;
    private readonly claudeModel;
    private readonly claudeProModel;
    constructor(config: ConfigService);
    get live(): boolean;
    complete(opts: CompleteOpts): Promise<LlmResult>;
    private completeAnthropic;
    private completeOpenAICompat;
}
