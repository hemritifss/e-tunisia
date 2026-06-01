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
exports.InventoryItem = void 0;
const typeorm_1 = require("typeorm");
const place_entity_1 = require("../places/place.entity");
let InventoryItem = class InventoryItem {
};
exports.InventoryItem = InventoryItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InventoryItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryItem.prototype, "placeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => place_entity_1.Place, (place) => place.id, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'placeId' }),
    __metadata("design:type", place_entity_1.Place)
], InventoryItem.prototype, "place", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'simple-enum',
        enum: ['room', 'tour_slot', 'experience_slot', 'table', 'ticket'],
    }),
    __metadata("design:type", String)
], InventoryItem.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryItem.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], InventoryItem.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'TND' }),
    __metadata("design:type", String)
], InventoryItem.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "capacity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Array)
], InventoryItem.prototype, "availability", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Array)
], InventoryItem.prototype, "blockedDates", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Array)
], InventoryItem.prototype, "images", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "minAdvanceBookingHours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 365 }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "maxAdvanceBookingDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "minQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 10 }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "maxQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], InventoryItem.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], InventoryItem.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], InventoryItem.prototype, "updatedAt", void 0);
exports.InventoryItem = InventoryItem = __decorate([
    (0, typeorm_1.Entity)('inventory_items')
], InventoryItem);
//# sourceMappingURL=inventory.entity.js.map