"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rxjs_1 = require("rxjs");
const audit_log_entity_1 = require("./audit-log.entity");
let AuditInterceptor = class AuditInterceptor {
    constructor(auditRepo) {
        this.auditRepo = auditRepo;
    }
    intercept(context, next) {
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
        return next.handle().pipe((0, rxjs_1.tap)({
            next: () => {
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
        }));
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuditInterceptor);
function inferTargetType(routePath) {
    const m = routePath.replace(/^\//, '').split('/');
    return m[0] || null;
}
function buildSummary(action, targetType, targetId, body) {
    const target = targetId ? `${targetType}#${String(targetId).slice(0, 8)}` : targetType || '';
    let extra = '';
    if (body && typeof body === 'object') {
        const keys = Object.keys(body);
        if (keys.length)
            extra = ` (${keys.map((k) => `${k}=${String(body[k]).slice(0, 24)}`).join(', ')})`;
    }
    return `${action} → ${target}${extra}`.trim();
}
//# sourceMappingURL=audit.interceptor.js.map