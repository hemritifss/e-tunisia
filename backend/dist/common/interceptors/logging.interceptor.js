"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let LoggingInterceptor = class LoggingInterceptor {
    constructor() {
        this.logger = new common_1.Logger('HTTP');
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        const url = this.sanitizeUrl(request.url);
        const userAgent = request.get('user-agent') || 'unknown';
        const ip = request.ip;
        const userId = request.user?.id || 'anonymous';
        const requestId = request.id || 'no-id';
        const now = Date.now();
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                const response = context.switchToHttp().getResponse();
                const statusCode = response.statusCode;
                const duration = Date.now() - now;
                this.logger.log(`[${requestId}] ${method} ${url} ${statusCode} — ${duration}ms — user:${userId} — ${ip} — ${userAgent}`);
            },
            error: (error) => {
                const duration = Date.now() - now;
                const statusCode = error.status || 500;
                this.logger.error(`[${requestId}] ${method} ${url} ${statusCode} — ${duration}ms — user:${userId} — ${ip} — ${error.message}`);
            },
        }));
    }
    sanitizeUrl(url) {
        try {
            const sensitiveParams = ['token', 'password', 'resetToken', 'api_key', 'secret', 'credential'];
            const [path, query] = url.split('?');
            if (!query)
                return url;
            const params = new URLSearchParams(query);
            let sanitized = false;
            for (const param of sensitiveParams) {
                if (params.has(param)) {
                    params.set(param, '[REDACTED]');
                    sanitized = true;
                }
            }
            return sanitized ? `${path}?${params.toString()}` : url;
        }
        catch {
            return url;
        }
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map