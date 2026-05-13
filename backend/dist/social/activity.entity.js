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
exports.Activity = exports.ActivityType = void 0;
const typeorm_1 = require("typeorm");
var ActivityType;
(function (ActivityType) {
    ActivityType["VISITED_PLACE"] = "visited_place";
    ActivityType["WROTE_REVIEW"] = "wrote_review";
    ActivityType["SHARED_POST"] = "shared_post";
    ActivityType["ADDED_FAVORITE"] = "added_favorite";
    ActivityType["EARNED_BADGE"] = "earned_badge";
    ActivityType["COMPLETED_CHALLENGE"] = "completed_challenge";
    ActivityType["FOLLOWED_USER"] = "followed_user";
    ActivityType["BOOKED_EXPERIENCE"] = "booked_experience";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
let Activity = class Activity {
};
exports.Activity = Activity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Activity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Activity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-enum', enum: ActivityType }),
    __metadata("design:type", String)
], Activity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json' }),
    __metadata("design:type", Object)
], Activity.prototype, "data", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Activity.prototype, "isPublic", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Activity.prototype, "createdAt", void 0);
exports.Activity = Activity = __decorate([
    (0, typeorm_1.Entity)('activities')
], Activity);
//# sourceMappingURL=activity.entity.js.map