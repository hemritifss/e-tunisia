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
exports.Endorsement = void 0;
const typeorm_1 = require("typeorm");
let Endorsement = class Endorsement {
};
exports.Endorsement = Endorsement;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Endorsement.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Endorsement.prototype, "endorserId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Endorsement.prototype, "endorsedId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 40 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Endorsement.prototype, "topic", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Endorsement.prototype, "createdAt", void 0);
exports.Endorsement = Endorsement = __decorate([
    (0, typeorm_1.Entity)('endorsements'),
    (0, typeorm_1.Unique)(['endorserId', 'endorsedId', 'topic'])
], Endorsement);
//# sourceMappingURL=endorsement.entity.js.map