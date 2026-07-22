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
exports.BeachesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const beaches_service_1 = require("./beaches.service");
class BeachReportDto {
}
__decorate([
    (0, class_validator_1.IsIn)(['none', 'few', 'lots']),
    __metadata("design:type", String)
], BeachReportDto.prototype, "jellyfish", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['clear', 'seaweed', 'murky']),
    __metadata("design:type", String)
], BeachReportDto.prototype, "water", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['empty', 'ok', 'packed']),
    __metadata("design:type", String)
], BeachReportDto.prototype, "crowd", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], BeachReportDto.prototype, "note", void 0);
let BeachesController = class BeachesController {
    constructor(beaches) {
        this.beaches = beaches;
    }
    list(governorate) {
        return this.beaches.list(governorate);
    }
    beach(placeId) {
        return this.beaches.beach(placeId);
    }
    report(req, placeId, dto) {
        return this.beaches.report(req.user.id, placeId, dto);
    }
};
exports.BeachesController = BeachesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Beach conditions — famma 9nadel? (jellyfish/water/crowd)' }),
    __param(0, (0, common_1.Query)('governorate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BeachesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':placeId'),
    (0, swagger_1.ApiOperation)({ summary: 'One beach — current status + recent report timeline' }),
    __param(0, (0, common_1.Param)('placeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BeachesController.prototype, "beach", null);
__decorate([
    (0, common_1.Post)(':placeId/report'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Report beach conditions (+5 XP, throttled)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('placeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, BeachReportDto]),
    __metadata("design:returntype", void 0)
], BeachesController.prototype, "report", null);
exports.BeachesController = BeachesController = __decorate([
    (0, swagger_1.ApiTags)('beaches'),
    (0, common_1.Controller)('beaches'),
    __metadata("design:paramtypes", [beaches_service_1.BeachesService])
], BeachesController);
//# sourceMappingURL=beaches.controller.js.map