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
exports.PostReaction = exports.ReactionType = void 0;
const typeorm_1 = require("typeorm");
var ReactionType;
(function (ReactionType) {
    ReactionType["LIKE"] = "like";
    ReactionType["LOVE"] = "love";
    ReactionType["CELEBRATE"] = "celebrate";
    ReactionType["INSIGHTFUL"] = "insightful";
    ReactionType["LAUGH"] = "laugh";
    ReactionType["WOW"] = "wow";
    ReactionType["SUPPORT"] = "support";
})(ReactionType || (exports.ReactionType = ReactionType = {}));
let PostReaction = class PostReaction {
};
exports.PostReaction = PostReaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PostReaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PostReaction.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PostReaction.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-enum', enum: ReactionType }),
    __metadata("design:type", String)
], PostReaction.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PostReaction.prototype, "createdAt", void 0);
exports.PostReaction = PostReaction = __decorate([
    (0, typeorm_1.Entity)('post_reactions'),
    (0, typeorm_1.Unique)(['postId', 'userId'])
], PostReaction);
//# sourceMappingURL=post-reaction.entity.js.map