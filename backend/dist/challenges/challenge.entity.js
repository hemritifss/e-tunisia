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
exports.Challenge = exports.ChallengeCategory = exports.ChallengeType = void 0;
const typeorm_1 = require("typeorm");
var ChallengeType;
(function (ChallengeType) {
    ChallengeType["DAILY"] = "daily";
    ChallengeType["WEEKLY"] = "weekly";
    ChallengeType["SEASONAL"] = "seasonal";
    ChallengeType["SPECIAL"] = "special";
})(ChallengeType || (exports.ChallengeType = ChallengeType = {}));
var ChallengeCategory;
(function (ChallengeCategory) {
    ChallengeCategory["EXPLORE"] = "explore";
    ChallengeCategory["PHOTO"] = "photo";
    ChallengeCategory["REVIEW"] = "review";
    ChallengeCategory["SOCIAL"] = "social";
    ChallengeCategory["STREAK"] = "streak";
})(ChallengeCategory || (exports.ChallengeCategory = ChallengeCategory = {}));
let Challenge = class Challenge {
};
exports.Challenge = Challenge;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Challenge.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Challenge.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Challenge.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-enum', enum: ChallengeType, default: ChallengeType.DAILY }),
    __metadata("design:type", String)
], Challenge.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-enum', enum: ChallengeCategory, default: ChallengeCategory.EXPLORE }),
    __metadata("design:type", String)
], Challenge.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Challenge.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Challenge.prototype, "pointsReward", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Challenge.prototype, "xpReward", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Challenge.prototype, "badgeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], Challenge.prototype, "requirements", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Challenge.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Challenge.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Challenge.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], Challenge.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Challenge.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Challenge.prototype, "updatedAt", void 0);
exports.Challenge = Challenge = __decorate([
    (0, typeorm_1.Entity)('challenges')
], Challenge);
//# sourceMappingURL=challenge.entity.js.map