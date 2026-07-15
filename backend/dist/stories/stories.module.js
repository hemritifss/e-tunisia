"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoriesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const story_entity_1 = require("./story.entity");
const story_reaction_entity_1 = require("./story-reaction.entity");
const story_view_entity_1 = require("./story-view.entity");
const user_entity_1 = require("../users/user.entity");
const stories_service_1 = require("./stories.service");
const stories_controller_1 = require("./stories.controller");
const messages_module_1 = require("../messages/messages.module");
let StoriesModule = class StoriesModule {
};
exports.StoriesModule = StoriesModule;
exports.StoriesModule = StoriesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([story_entity_1.Story, story_reaction_entity_1.StoryReaction, story_view_entity_1.StoryView, user_entity_1.User]),
            (0, common_1.forwardRef)(() => messages_module_1.MessagesModule),
        ],
        providers: [stories_service_1.StoriesService],
        controllers: [stories_controller_1.StoriesController],
        exports: [stories_service_1.StoriesService],
    })
], StoriesModule);
//# sourceMappingURL=stories.module.js.map