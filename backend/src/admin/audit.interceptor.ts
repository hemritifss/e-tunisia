import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable, tap } from 'rxjs';
import { AuditLog } from './audit-log.entity';

/**
 * Records every successful admin MUTATION (non-GET) to the audit log. Applied at the
 * AdminController level so it auto-covers current and future admin write endpoints —
 * no per-method bookkeeping to forget. GET/HEAD are ignored (reads aren't audited).
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(@InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const method = (req.method || 'GET').toUpperCase();

        if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
            return next.handle();
        }

        const user = req.user || {};
        const routePath = req.route?.path || req.url || '';
        const action = `${method} ${routePath}`.replace(/\/api\/v\d+/, '');
        const params = req.params || {};
        const targetType = inferTargetType(routePath);
        const targetId = params.id || null;

        return next.handle().pipe(
            tap({
                next: () => {
                    // Fire-and-forget; never let audit failures break the request.
                    this.auditRepo
                        .save(this.auditRepo.create({
                            actorId: user.id || 'unknown',
                            actorName: user.fullName || null,
                            actorEmail: user.email || null,
                            action,
                            targetType,
                            targetId,
                            summary: buildSummary(action, targetType, targetId, req.body),
                        }))
                        .catch(() => undefined);
                },
            }),
        );
    }
}

function inferTargetType(routePath: string): string | null {
    // routePath like "/users/:id/ban" → "users"
    const m = routePath.replace(/^\//, '').split('/');
    return m[0] || null;
}

function buildSummary(action: string, targetType: string | null, targetId: string | null, body: any): string {
    const target = targetId ? `${targetType}#${String(targetId).slice(0, 8)}` : targetType || '';
    let extra = '';
    if (body && typeof body === 'object') {
        const keys = Object.keys(body);
        if (keys.length) extra = ` (${keys.map((k) => `${k}=${String(body[k]).slice(0, 24)}`).join(', ')})`;
    }
    return `${action} → ${target}${extra}`.trim();
}
