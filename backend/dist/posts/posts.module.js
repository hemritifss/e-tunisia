"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const post_entity_1 = require("./post.entity");
const comment_entity_1 = require("./comment.entity");
const comment_like_entity_1 = require("./comment-like.entity");
const post_reaction_entity_1 = require("./post-reaction.entity");
const saved_post_entity_1 = require("./saved-post.entity");
const user_entity_1 = require("../users/user.entity");
const posts_controller_1 = require("./posts.controller");
const posts_service_1 = require("./posts.service");
const notifications_module_1 = require("../notifications/notifications.module");
const badges_module_1 = require("../badges/badges.module");
let PostsModule = class PostsModule {
};
exports.PostsModule = PostsModule;
exports.PostsModule = PostsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([post_entity_1.Post, comment_entity_1.Comment, comment_like_entity_1.CommentLike, post_reaction_entity_1.PostReaction, saved_post_entity_1.SavedPost, user_entity_1.User]), notifications_module_1.NotificationsModule, badges_module_1.BadgesModule],
        controllers: [posts_controller_1.PostsController],
        providers: [posts_service_1.PostsService],
        exports: [posts_service_1.PostsService],
    })
], PostsModule);
//# sourceMappingURL=posts.module.js.map