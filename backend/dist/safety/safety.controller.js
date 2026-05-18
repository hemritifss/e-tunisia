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
exports.SafetyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const safety_service_1 = require("./safety.service");
const report_entity_1 = require("./report.entity");
class ReportDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(report_entity_1.ReportTargetType),
    __metadata("design:type", String)
], ReportDto.prototype, "targetType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReportDto.prototype, "targetId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(report_entity_1.ReportReason),
    __metadata("design:type", String)
], ReportDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(600),
    __metadata("design:type", String)
], ReportDto.prototype, "details", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReportDto.prototype, "targetOwnerId", void 0);
let SafetyController = class SafetyController {
    constructor(safety) {
        this.safety = safety;
    }
    block(req, userId) {
        return this.safety.block(req.user.id, userId);
    }
    unblock(req, userId) {
        return this.safety.unblock(req.user.id, userId);
    }
    isBlocked(req, userId) {
        return this.safety.isBlocked(req.user.id, userId);
    }
    listBlocks(req) {
        return this.safety.listBlocked(req.user.id);
    }
    report(req, body) {
        return this.safety.report(req.user.id, body);
    }
    listMyReports(req) {
        return this.safety.listMyReports(req.user.id);
    }
};
exports.SafetyController = SafetyController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('block/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Block a user' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "block", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Delete)('block/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Unblock a user' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "unblock", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('is-blocked/:userId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "isBlocked", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('blocks'),
    (0, swagger_1.ApiOperation)({ summary: 'List users I have blocked' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "listBlocks", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('report'),
    (0, swagger_1.ApiOperation)({ summary: 'Report content or a user' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ReportDto]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "report", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('reports/mine'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "listMyReports", null);
exports.SafetyController = SafetyController = __decorate([
    (0, swagger_1.ApiTags)('safety'),
    (0, common_1.Controller)('safety'),
    __metadata("design:paramtypes", [safety_service_1.SafetyService])
], SafetyController);
//# sourceMappingURL=safety.controller.js.map