import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = this.sanitizeUrl(request.url);
    const userAgent = request.get('user-agent') || 'unknown';
    const ip = request.ip;
    const userId = request.user?.id || 'anonymous';
    const requestId = request.id || 'no-id';

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const duration = Date.now() - now;

          this.logger.log(
            `[${requestId}] ${method} ${url} ${statusCode} — ${duration}ms — user:${userId} — ${ip} — ${userAgent}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - now;
          const statusCode = error.status || 500;

          this.logger.error(
            `[${requestId}] ${method} ${url} ${statusCode} — ${duration}ms — user:${userId} — ${ip} — ${error.message}`,
          );
        },
      }),
    );
  }

  private sanitizeUrl(url: string): string {
    try {
      // Remove query parameters that might contain sensitive data
      const sensitiveParams = ['token', 'password', 'resetToken', 'api_key', 'secret', 'credential'];
      const [path, query] = url.split('?');
      if (!query) return url;

      const params = new URLSearchParams(query);
      let sanitized = false;
      for (const param of sensitiveParams) {
        if (params.has(param)) {
          params.set(param, '[REDACTED]');
          sanitized = true;
        }
      }
      return sanitized ? `${path}?${params.toString()}` : url;
    } catch {
      return url;
    }
  }
}
