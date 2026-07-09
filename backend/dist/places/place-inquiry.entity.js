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
exports.PlaceInquiry = exports.InquiryStatus = void 0;
const typeorm_1 = require("typeorm");
var InquiryStatus;
(function (InquiryStatus) {
    InquiryStatus["NEW"] = "new";
    InquiryStatus["CONTACTED"] = "contacted";
    InquiryStatus["QUOTED"] = "quoted";
    InquiryStatus["BOOKED"] = "booked";
    InquiryStatus["CLOSED"] = "closed";
})(InquiryStatus || (exports.InquiryStatus = InquiryStatus = {}));
let PlaceInquiry = class PlaceInquiry {
};
exports.PlaceInquiry = PlaceInquiry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PlaceInquiry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PlaceInquiry.prototype, "placeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PlaceInquiry.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], PlaceInquiry.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], PlaceInquiry.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 40, nullable: true }),
    __metadata("design:type", String)
], PlaceInquiry.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], PlaceInquiry.prototype, "partySize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", String)
], PlaceInquiry.prototype, "dateFrom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", String)
], PlaceInquiry.prototype, "dateTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], PlaceInquiry.prototype, "budget", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 8, default: 'TND' }),
    __metadata("design:type", String)
], PlaceInquiry.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], PlaceInquiry.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-enum', enum: InquiryStatus, default: InquiryStatus.NEW }),
    __metadata("design:type", String)
], PlaceInquiry.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 80, nullable: true }),
    __metadata("design:type", String)
], PlaceInquiry.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PlaceInquiry.prototype, "packageId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PlaceInquiry.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PlaceInquiry.prototype, "updatedAt", void 0);
exports.PlaceInquiry = PlaceInquiry = __decorate([
    (0, typeorm_1.Entity)('place_inquiries')
], PlaceInquiry);
//# sourceMappingURL=place-inquiry.entity.js.map