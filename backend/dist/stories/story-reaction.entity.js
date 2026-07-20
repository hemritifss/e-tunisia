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
exports.STORY_REACTIONS = exports.StoryReaction = void 0;
exports.isValidStoryReaction = isValidStoryReaction;
const typeorm_1 = require("typeorm");
let StoryReaction = class StoryReaction {
};
exports.StoryReaction = StoryReaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StoryReaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], StoryReaction.prototype, "storyId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], StoryReaction.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 16 }),
    __metadata("design:type", String)
], StoryReaction.prototype, "emoji", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StoryReaction.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StoryReaction.prototype, "updatedAt", void 0);
exports.StoryReaction = StoryReaction = __decorate([
    (0, typeorm_1.Entity)('story_reactions'),
    (0, typeorm_1.Unique)(['storyId', 'userId'])
], StoryReaction);
exports.STORY_REACTIONS = ['❤️', '😂', '😮', '😢', '👏', '🔥'];
function isValidStoryReaction(emoji) {
    return exports.STORY_REACTIONS.includes(emoji);
}
//# sourceMappingURL=story-reaction.entity.js.map