"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("./user.entity");
const follow_entity_1 = require("./follow.entity");
const endorsement_entity_1 = require("./endorsement.entity");
const review_entity_1 = require("../reviews/review.entity");
const place_entity_1 = require("../places/place.entity");
const trip_plan_entity_1 = require("../itineraries/trip-plan.entity");
const saved_post_entity_1 = require("../posts/saved-post.entity");
const users_service_1 = require("./users.service");
const follows_service_1 = require("./follows.service");
const endorsements_service_1 = require("./endorsements.service");
const activity_service_1 = require("./activity.service");
const users_controller_1 = require("./users.controller");
const badges_module_1 = require("../badges/badges.module");
const og_module_1 = require("../og/og.module");
const notifications_module_1 = require("../notifications/notifications.module");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, follow_entity_1.Follow, endorsement_entity_1.Endorsement, review_entity_1.Review, place_entity_1.Place, trip_plan_entity_1.TripPlan, saved_post_entity_1.SavedPost]), badges_module_1.BadgesModule, og_module_1.OgModule, notifications_module_1.NotificationsModule],
        providers: [users_service_1.UsersService, follows_service_1.FollowsService, endorsements_service_1.EndorsementsService, activity_service_1.ActivityService],
        controllers: [users_controller_1.UsersController],
        exports: [users_service_1.UsersService, follows_service_1.FollowsService, endorsements_service_1.EndorsementsService, activity_service_1.ActivityService],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map