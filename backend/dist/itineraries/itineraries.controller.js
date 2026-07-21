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
exports.ItinerariesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const itineraries_service_1 = require("./itineraries.service");
const circuits_service_1 = require("./circuits.service");
const create_itinerary_dto_1 = require("./dto/create-itinerary.dto");
let ItinerariesController = class ItinerariesController {
    constructor(itinerariesService, circuitsService) {
        this.itinerariesService = itinerariesService;
        this.circuitsService = circuitsService;
    }
    findAll() {
        return this.itinerariesService.findAll();
    }
    listCircuits() {
        return this.circuitsService.list();
    }
    getCircuit(slug) {
        return this.circuitsService.findOne(slug);
    }
    findOne(id) {
        return this.itinerariesService.findById(id);
    }
    create(req, body) {
        const { days, ...rest } = body;
        return this.itinerariesService.create(req.user.id, {
            ...rest,
            ...(days
                ? {
                    days: days.map((d) => ({
                        day: d.day,
                        title: d.title ?? '',
                        placeIds: d.placeIds ?? [],
                        notes: d.notes ?? '',
                    })),
                }
                : {}),
        });
    }
    like(id) {
        return this.itinerariesService.like(id);
    }
};
exports.ItinerariesController = ItinerariesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all public itineraries' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ItinerariesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('circuits'),
    (0, swagger_1.ApiOperation)({ summary: 'Curated circuits, hydrated from the live place catalog' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ItinerariesController.prototype, "listCircuits", null);
__decorate([
    (0, common_1.Get)('circuits/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'One circuit with its day-by-day stops' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ItinerariesController.prototype, "getCircuit", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get itinerary by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ItinerariesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new itinerary' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_itinerary_dto_1.CreateItineraryDto]),
    __metadata("design:returntype", void 0)
], ItinerariesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/like'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Like an itinerary' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ItinerariesController.prototype, "like", null);
exports.ItinerariesController = ItinerariesController = __decorate([
    (0, swagger_1.ApiTags)('itineraries'),
    (0, common_1.Controller)('itineraries'),
    __metadata("design:paramtypes", [itineraries_service_1.ItinerariesService,
        circuits_service_1.CircuitsService])
], ItinerariesController);
//# sourceMappingURL=itineraries.controller.js.map