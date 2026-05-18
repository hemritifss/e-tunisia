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
exports.Donation = exports.DonationTarget = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
var DonationTarget;
(function (DonationTarget) {
    DonationTarget["USER"] = "user";
    DonationTarget["PLATFORM"] = "platform";
})(DonationTarget || (exports.DonationTarget = DonationTarget = {}));
let Donation = class Donation {
};
exports.Donation = Donation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Donation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'fromUserId' }),
    __metadata("design:type", user_entity_1.User)
], Donation.prototype, "fromUser", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Donation.prototype, "fromUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'toUserId' }),
    __metadata("design:type", user_entity_1.User)
], Donation.prototype, "toUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Donation.prototype, "toUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-enum', enum: DonationTarget, default: DonationTarget.USER }),
    __metadata("design:type", String)
], Donation.prototype, "target", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], Donation.prototype, "grossAmount", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], Donation.prototype, "platformFee", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], Donation.prototype, "netAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 280, nullable: true }),
    __metadata("design:type", String)
], Donation.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Donation.prototype, "isAnonymous", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Donation.prototype, "createdAt", void 0);
exports.Donation = Donation = __decorate([
    (0, typeorm_1.Entity)('donations')
], Donation);
//# sourceMappingURL=donation.entity.js.map