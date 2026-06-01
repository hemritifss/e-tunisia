import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { AuditLog } from './audit-log.entity';
export declare class AuditInterceptor implements NestInterceptor {
    private auditRepo;
    constructor(auditRepo: Repository<AuditLog>);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
