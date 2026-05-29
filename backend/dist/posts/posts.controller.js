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
exports.PostsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const posts_service_1 = require("./posts.service");
const post_reaction_entity_1 = require("./post-reaction.entity");
class CreatePostDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(240),
    __metadata("design:type", String)
], CreatePostDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], CreatePostDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePostDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePostDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePostDto.prototype, "placeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatePostDto.prototype, "images", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatePostDto.prototype, "tags", void 0);
class VotePostDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VotePostDto.prototype, "direction", void 0);
class ReactPostDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(post_reaction_entity_1.ReactionType),
    __metadata("design:type", String)
], ReactPostDto.prototype, "type", void 0);
let PostsController = class PostsController {
    constructor(posts) {
        this.posts = posts;
    }
    list(page, limit, sort, authorId, category) {
        return this.posts.list({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            sort,
            authorId,
            category,
        });
    }
    mine(req, page, limit) {
        return this.posts.list({
            authorId: req.user.id,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            sort: 'new',
        });
    }
    saved(req, page, limit) {
        return this.posts.listSaved(req.user.id, {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
    }
    savedByHandle(handle, page, limit) {
        return this.posts.listSavedByHandle((handle || '').toLowerCase(), {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
    }
    save(req, id) {
        return this.posts.savePost(id, req.user.id);
    }
    unsave(req, id) {
        return this.posts.unsavePost(id, req.user.id);
    }
    byUser(userId, page, limit) {
        return this.posts.list({
            authorId: userId,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : 12,
            sort: 'new',
        });
    }
    create(req, body) {
        return this.posts.create(req.user.id, body);
    }
    vote(id, body) {
        return this.posts.vote(id, body.direction);
    }
    remove(req, id) {
        return this.posts.remove(id, req.user.id);
    }
    async one(id) {
        const post = await this.posts.findOne(id);
        this.posts.trackView(id).catch(() => { });
        return post;
    }
    listComments(req, id) {
        return this.posts.listComments(id, req?.user?.id);
    }
    likeComment(req, id) {
        return this.posts.toggleCommentLike(id, req.user.id);
    }
    reactions(req, id) {
        return this.posts.aggregate(id, req?.user?.id);
    }
    reactors(id, type, page, limit) {
        return this.posts.listReactors(id, {
            type: type || null,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
    }
    react(req, id, body) {
        return this.posts.react(id, req.user.id, body?.type ?? null);
    }
    addComment(req, id, body) {
        return this.posts.addComment(id, req.user.id, body?.body || '', body?.parentId || null);
    }
    repost(req, id, body) {
        return this.posts.repost(id, req.user.id, body?.comment);
    }
    undoRepost(req, id) {
        return this.posts.undoRepost(id, req.user.id);
    }
    listReposts(id) {
        return this.posts.listReposts(id);
    }
};
exports.PostsController = PostsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false, enum: ['new', 'top', 'hot'] }),
    (0, swagger_1.ApiQuery)({ name: 'authorId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('sort')),
    __param(3, (0, common_1.Query)('authorId')),
    __param(4, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "list", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('mine'),
    (0, swagger_1.ApiOperation)({ summary: "List the current user's posts" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "mine", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('saved'),
    (0, swagger_1.ApiOperation)({ summary: "List the current user's saved posts" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "saved", null);
__decorate([
    (0, common_1.Get)('saved-by-handle/:handle'),
    (0, swagger_1.ApiOperation)({ summary: 'Public list of saved posts for a given handle (passport tab)' }),
    __param(0, (0, common_1.Param)('handle')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "savedByHandle", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)(':id/save'),
    (0, swagger_1.ApiOperation)({ summary: 'Bookmark a post' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "save", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Delete)(':id/save'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a post bookmark' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "unsave", null);
__decorate([
    (0, common_1.Get)('by-user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: "Public list of a user's posts" }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "byUser", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new post' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreatePostDto]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)(':id/vote'),
    (0, swagger_1.ApiOperation)({ summary: 'Vote on a post (up | down | clear)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, VotePostDto]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "vote", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single post by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "one", null);
__decorate([
    (0, common_1.Get)(':id/comments'),
    (0, swagger_1.ApiOperation)({ summary: 'List comments for a post (threaded)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "listComments", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('comments/:id/like'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle like on a comment' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "likeComment", null);
__decorate([
    (0, common_1.Get)(':id/reactions'),
    (0, swagger_1.ApiOperation)({ summary: 'Reaction breakdown for a post' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "reactions", null);
__decorate([
    (0, common_1.Get)(':id/reactors'),
    (0, swagger_1.ApiOperation)({ summary: 'List users who reacted to a post (paginated)' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, description: 'Filter by reaction type (e.g. love, laugh)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "reactors", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)(':id/react'),
    (0, swagger_1.ApiOperation)({ summary: 'Set or clear your reaction on a post' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ReactPostDto]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "react", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)(':id/comments'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a comment or reply (when parentId is given)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "addComment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)(':id/repost'),
    (0, swagger_1.ApiOperation)({ summary: 'Repost a post with optional comment' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "repost", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Delete)(':id/repost'),
    (0, swagger_1.ApiOperation)({ summary: 'Undo repost' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "undoRepost", null);
__decorate([
    (0, common_1.Get)(':id/reposts'),
    (0, swagger_1.ApiOperation)({ summary: 'List reposts of a post' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "listReposts", null);
exports.PostsController = PostsController = __decorate([
    (0, swagger_1.ApiTags)('posts'),
    (0, common_1.Controller)('posts'),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], PostsController);
//# sourceMappingURL=posts.controller.js.map