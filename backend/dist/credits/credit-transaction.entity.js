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
exports.CreditTransaction = exports.CreditTxKind = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
var CreditTxKind;
(function (CreditTxKind) {
    CreditTxKind["DEPOSIT"] = "deposit";
    CreditTxKind["WITHDRAWAL"] = "withdrawal";
    CreditTxKind["DONATION_OUT"] = "donation_out";
    CreditTxKind["DONATION_IN"] = "donation_in";
    CreditTxKind["PLATFORM_FEE"] = "platform_fee";
    CreditTxKind["REFUND"] = "refund";
})(CreditTxKind || (exports.CreditTxKind = CreditTxKind = {}));
let CreditTransaction = class CreditTransaction {
};
exports.CreditTransaction = CreditTransaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CreditTransaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], CreditTransaction.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], CreditTransaction.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-enum', enum: CreditTxKind }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], CreditTransaction.prototype, "kind", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], CreditTransaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], CreditTransaction.prototype, "counterpartyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 280, nullable: true }),
    __metadata("design:type", String)
], CreditTransaction.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], CreditTransaction.prototype, "balanceAfter", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], CreditTransaction.prototype, "donationId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CreditTransaction.prototype, "createdAt", void 0);
exports.CreditTransaction = CreditTransaction = __decorate([
    (0, typeorm_1.Entity)('credit_transactions')
], CreditTransaction);
//# sourceMappingURL=credit-transaction.entity.js.map