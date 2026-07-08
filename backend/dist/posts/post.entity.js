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
exports.Post = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
let Post = class Post {
};
exports.Post = Post;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Post.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 240 }),
    __metadata("design:type", String)
], Post.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], Post.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Post.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Post.prototype, "kind", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], Post.prototype, "meta", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Post.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Post.prototype, "placeId", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-array', { nullable: true }),
    __metadata("design:type", Array)
], Post.prototype, "images", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Post.prototype, "videoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-array', { nullable: true }),
    __metadata("design:type", Array)
], Post.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'authorId' }),
    __metadata("design:type", user_entity_1.User)
], Post.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Post.prototype, "authorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Post.prototype, "upvotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Post.prototype, "downvotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Post.prototype, "commentCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Post.prototype, "viewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Post.prototype, "repostCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Post.prototype, "isPinned", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Post.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Post.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Post.prototype, "updatedAt", void 0);
exports.Post = Post = __decorate([
    (0, typeorm_1.Entity)('posts')
], Post);
//# sourceMappingURL=post.entity.js.map