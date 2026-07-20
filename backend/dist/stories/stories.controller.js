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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const optional_jwt_auth_guard_1 = require("../auth/guards/optional-jwt-auth.guard");
const stories_service_1 = require("./stories.service");
class CreateStoryDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(12_000_000),
    __metadata("design:type", String)
], CreateStoryDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(280),
    __metadata("design:type", String)
], CreateStoryDto.prototype, "caption", void 0);
class ReactStoryDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(16),
    __metadata("design:type", String)
], ReactStoryDto.prototype, "emoji", void 0);
class ReplyStoryDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], ReplyStoryDto.prototype, "text", void 0);
let StoriesController = class StoriesController {
    constructor(stories) {
        this.stories = stories;
    }
    list(req) {
        return this.stories.listActiveGrouped(req?.user?.id || null);
    }
    create(req, body) {
        return this.stories.create(req.user.id, body);
    }
    view(req, id) {
        return this.stories.recordView(id, req?.user?.id || null);
    }
    react(req, id, body) {
        return this.stories.react(id, req.user.id, body.emoji);
    }
    unreact(req, id) {
        return this.stories.unreact(id, req.user.id);
    }
    reply(req, id, body) {
        return this.stories.reply(id, req.user.id, body.text);
    }
    viewers(req, id) {
        return this.stories.listViewers(id, req.user.id);
    }
    highlights(handle) {
        return this.stories.listHighlights(handle);
    }
    highlight(req, id) {
        return this.stories.toggleHighlight(id, req.user.id);
    }
    remove(req, id) {
        return this.stories.remove(id, req.user.id);
    }
};
exports.StoriesController = StoriesController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Active stories grouped by author' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StoriesController.prototype, "list", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a 24h story' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateStoryDto]),
    __metadata("design:returntype", void 0)
], StoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/view'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Record a view on a story (idempotent, per viewer)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StoriesController.prototype, "view", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)(':id/react'),
    (0, swagger_1.ApiOperation)({ summary: 'Set or replace your reaction on a story' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ReactStoryDto]),
    __metadata("design:returntype", void 0)
], StoriesController.prototype, "react", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Delete)(':id/react'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove your reaction from a story' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StoriesController.prototype, "unreact", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)(':id/reply'),
    (0, swagger_1.ApiOperation)({ summary: 'Reply to a story — delivered as a DM to the author' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ReplyStoryDto]),
    __metadata("design:returntype", void 0)
], StoriesController.prototype, "reply", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)(':id/viewers'),
    (0, swagger_1.ApiOperation)({ summary: 'Author-only: who watched this story' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StoriesController.prototype, "viewers", null);
__decorate([
    (0, common_1.Get)('highlights/:handle'),
    (0, swagger_1.ApiOperation)({ summary: 'A user\'s highlighted stories (persist past 24h)' }),
    __param(0, (0, common_1.Param)('handle')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StoriesController.prototype, "highlights", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)(':id/highlight'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle pinning a story to your profile highlights' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StoriesController.prototype, "highlight", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StoriesController.prototype, "remove", null);
exports.StoriesController = StoriesController = __decorate([
    (0, swagger_1.ApiTags)('stories'),
    (0, common_1.Controller)('stories'),
    __metadata("design:paramtypes", [stories_service_1.StoriesService])
], StoriesController);
//# sourceMappingURL=stories.controller.js.map