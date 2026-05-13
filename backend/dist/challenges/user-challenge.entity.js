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
exports.UserChallenge = exports.UserChallengeStatus = void 0;
const typeorm_1 = require("typeorm");
const challenge_entity_1 = require("./challenge.entity");
var UserChallengeStatus;
(function (UserChallengeStatus) {
    UserChallengeStatus["IN_PROGRESS"] = "in_progress";
    UserChallengeStatus["COMPLETED"] = "completed";
    UserChallengeStatus["CLAIMED"] = "claimed";
    UserChallengeStatus["EXPIRED"] = "expired";
})(UserChallengeStatus || (exports.UserChallengeStatus = UserChallengeStatus = {}));
let UserChallenge = class UserChallenge {
};
exports.UserChallenge = UserChallenge;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserChallenge.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserChallenge.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserChallenge.prototype, "challengeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => challenge_entity_1.Challenge, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'challengeId' }),
    __metadata("design:type", challenge_entity_1.Challenge)
], UserChallenge.prototype, "challenge", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-enum', enum: UserChallengeStatus, default: UserChallengeStatus.IN_PROGRESS }),
    __metadata("design:type", String)
], UserChallenge.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], UserChallenge.prototype, "progress", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], UserChallenge.prototype, "target", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], UserChallenge.prototype, "progressDetails", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], UserChallenge.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], UserChallenge.prototype, "claimedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], UserChallenge.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], UserChallenge.prototype, "updatedAt", void 0);
exports.UserChallenge = UserChallenge = __decorate([
    (0, typeorm_1.Entity)('user_challenges')
], UserChallenge);
//# sourceMappingURL=user-challenge.entity.js.map