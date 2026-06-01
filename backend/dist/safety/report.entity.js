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
exports.Report = exports.ReportStatus = exports.ReportReason = exports.ReportTargetType = void 0;
const typeorm_1 = require("typeorm");
var ReportTargetType;
(function (ReportTargetType) {
    ReportTargetType["POST"] = "post";
    ReportTargetType["COMMENT"] = "comment";
    ReportTargetType["USER"] = "user";
    ReportTargetType["MESSAGE"] = "message";
    ReportTargetType["REVIEW"] = "review";
    ReportTargetType["PLACE"] = "place";
})(ReportTargetType || (exports.ReportTargetType = ReportTargetType = {}));
var ReportReason;
(function (ReportReason) {
    ReportReason["SPAM"] = "spam";
    ReportReason["HARASSMENT"] = "harassment";
    ReportReason["HATE"] = "hate_speech";
    ReportReason["NUDITY"] = "nudity";
    ReportReason["VIOLENCE"] = "violence";
    ReportReason["MISINFO"] = "misinformation";
    ReportReason["SCAM"] = "scam";
    ReportReason["OTHER"] = "other";
})(ReportReason || (exports.ReportReason = ReportReason = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["OPEN"] = "open";
    ReportStatus["REVIEWED"] = "reviewed";
    ReportStatus["ACTIONED"] = "actioned";
    ReportStatus["DISMISSED"] = "dismissed";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
let Report = class Report {
};
exports.Report = Report;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Report.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Report.prototype, "reporterId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-enum', enum: ReportTargetType }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Report.prototype, "targetType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Report.prototype, "targetId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Report.prototype, "targetOwnerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-enum', enum: ReportReason, default: ReportReason.OTHER }),
    __metadata("design:type", String)
], Report.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 600, nullable: true }),
    __metadata("design:type", String)
], Report.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-enum', enum: ReportStatus, default: ReportStatus.OPEN }),
    __metadata("design:type", String)
], Report.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Report.prototype, "resolvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Report.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Report.prototype, "createdAt", void 0);
exports.Report = Report = __decorate([
    (0, typeorm_1.Entity)('reports')
], Report);
//# sourceMappingURL=report.entity.js.map