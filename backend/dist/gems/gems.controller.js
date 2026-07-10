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
exports.GemsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const optional_jwt_auth_guard_1 = require("../auth/guards/optional-jwt-auth.guard");
const gems_service_1 = require("./gems.service");
class SubmitGemDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], SubmitGemDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], SubmitGemDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SubmitGemDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SubmitGemDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], SubmitGemDto.prototype, "images", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], SubmitGemDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], SubmitGemDto.prototype, "governorate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SubmitGemDto.prototype, "categoryId", void 0);
let GemsController = class GemsController {
    constructor(gems) {
        this.gems = gems;
    }
    submit(req, dto) {
        return this.gems.submit(req.user.id, dto);
    }
    confirm(req, placeId) {
        return this.gems.confirm(placeId, req.user.id);
    }
    completeness() {
        return this.gems.completeness();
    }
    status(req, placeId) {
        return this.gems.status(placeId, req.user?.id);
    }
};
exports.GemsController = GemsController;
__decorate([
    (0, common_1.Post)('submit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a hidden gem (community place, pending until confirmed)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, SubmitGemDto]),
    __metadata("design:returntype", void 0)
], GemsController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)(':placeId/confirm'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm a gem — still exists, still worth it (+10 XP)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('placeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GemsController.prototype, "confirm", null);
__decorate([
    (0, common_1.Get)('completeness'),
    (0, swagger_1.ApiOperation)({ summary: 'The completeness game — % mapped per governorate' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GemsController.prototype, "completeness", null);
__decorate([
    (0, common_1.Get)(':placeId/status'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Confirmation status for a place' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('placeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GemsController.prototype, "status", null);
exports.GemsController = GemsController = __decorate([
    (0, swagger_1.ApiTags)('gems'),
    (0, common_1.Controller)('gems'),
    __metadata("design:paramtypes", [gems_service_1.GemsService])
], GemsController);
//# sourceMappingURL=gems.controller.js.map