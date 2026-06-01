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
exports.TripsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const optional_jwt_auth_guard_1 = require("../auth/guards/optional-jwt-auth.guard");
const trips_service_1 = require("./trips.service");
class StopDto {
}
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], StopDto.prototype, "placeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], StopDto.prototype, "packageId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(29),
    __metadata("design:type", Number)
], StopDto.prototype, "dayIndex", void 0);
class UpsertTripDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpsertTripDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], UpsertTripDto.prototype, "travelers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(8),
    __metadata("design:type", String)
], UpsertTripDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(30),
    __metadata("design:type", Number)
], UpsertTripDto.prototype, "days", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpsertTripDto.prototype, "isPublic", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => StopDto),
    __metadata("design:type", Array)
], UpsertTripDto.prototype, "stops", void 0);
class BatchInquiryDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], BatchInquiryDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], BatchInquiryDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], BatchInquiryDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], BatchInquiryDto.prototype, "dateFrom", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], BatchInquiryDto.prototype, "dateTo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], BatchInquiryDto.prototype, "budget", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], BatchInquiryDto.prototype, "message", void 0);
let TripsController = class TripsController {
    constructor(trips) {
        this.trips = trips;
    }
    create(req, body) {
        const userId = req?.user?.id || null;
        return this.trips.create(userId, body);
    }
    listMine(req) {
        return this.trips.listMine(req.user.id);
    }
    discover(page, limit, city, minDays, maxDays, sort) {
        return this.trips.discover({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            city: city,
            minDays: minDays ? Number(minDays) : undefined,
            maxDays: maxDays ? Number(maxDays) : undefined,
            sort,
        });
    }
    byHandle(handle) {
        return this.trips.listByHandle((handle || '').toLowerCase());
    }
    one(req, slug) {
        return this.trips.findBySlug(slug, req?.user?.id || null);
    }
    update(req, slug, body) {
        return this.trips.update(slug, req.user.id, body);
    }
    batchInquire(req, slug, body) {
        const userId = req?.user?.id || null;
        return this.trips.batchInquire(slug, userId, body);
    }
    remove(req, slug) {
        return this.trips.remove(slug, req.user.id);
    }
};
exports.TripsController = TripsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Save a trip plan. Anonymous users get an unowned shareable slug.' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UpsertTripDto]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('mine'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List my saved trips' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "listMine", null);
__decorate([
    (0, common_1.Get)('discover'),
    (0, swagger_1.ApiOperation)({ summary: 'Public list of community trip plans (most popular first)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'city', required: false, description: 'Match any city in the trip' }),
    (0, swagger_1.ApiQuery)({ name: 'minDays', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'maxDays', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false, enum: ['popular', 'new'] }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('city')),
    __param(3, (0, common_1.Query)('minDays')),
    __param(4, (0, common_1.Query)('maxDays')),
    __param(5, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "discover", null);
__decorate([
    (0, common_1.Get)('by-handle/:handle'),
    (0, swagger_1.ApiOperation)({ summary: 'Public trips authored by the given user handle' }),
    __param(0, (0, common_1.Param)('handle')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "byHandle", null);
__decorate([
    (0, common_1.Get)(':slug'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Read a trip by its public slug' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "one", null);
__decorate([
    (0, common_1.Put)(':slug'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a trip (owner only)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slug')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpsertTripDto]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':slug/inquiry'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Fan-out one inquiry per stop in the trip (guests allowed)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slug')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, BatchInquiryDto]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "batchInquire", null);
__decorate([
    (0, common_1.Delete)(':slug'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a trip (owner only)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TripsController.prototype, "remove", null);
exports.TripsController = TripsController = __decorate([
    (0, swagger_1.ApiTags)('trips'),
    (0, common_1.Controller)('trips'),
    __metadata("design:paramtypes", [trips_service_1.TripsService])
], TripsController);
//# sourceMappingURL=trips.controller.js.map