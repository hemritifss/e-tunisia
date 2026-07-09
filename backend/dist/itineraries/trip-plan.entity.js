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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripPlan = void 0;
const typeorm_1 = require("typeorm");
let TripPlan = class TripPlan {
};
exports.TripPlan = TripPlan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TripPlan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 32, unique: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TripPlan.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TripPlan.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, default: 'My Tunisia trip' }),
    __metadata("design:type", String)
], TripPlan.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 2 }),
    __metadata("design:type", Number)
], TripPlan.prototype, "travelers", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 8, default: 'TND' }),
    __metadata("design:type", String)
], TripPlan.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json' }),
    __metadata("design:type", Array)
], TripPlan.prototype, "stops", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], TripPlan.prototype, "days", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TripPlan.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], TripPlan.prototype, "isPublic", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TripPlan.prototype, "viewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TripPlan.prototype, "cloneCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TripPlan.prototype, "likeCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 32, nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TripPlan.prototype, "cloneOf", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TripPlan.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TripPlan.prototype, "updatedAt", void 0);
exports.TripPlan = TripPlan = __decorate([
    (0, typeorm_1.Entity)('trip_plans')
], TripPlan);
//# sourceMappingURL=trip-plan.entity.js.map