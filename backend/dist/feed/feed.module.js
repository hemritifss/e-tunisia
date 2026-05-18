"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const posts_module_1 = require("../posts/posts.module");
const reviews_module_1 = require("../reviews/reviews.module");
const ads_module_1 = require("../ads/ads.module");
const places_module_1 = require("../places/places.module");
const follow_entity_1 = require("../social/follow.entity");
const safety_module_1 = require("../safety/safety.module");
const feed_controller_1 = require("./feed.controller");
const feed_service_1 = require("./feed.service");
let FeedModule = class FeedModule {
};
exports.FeedModule = FeedModule;
exports.FeedModule = FeedModule = __decorate([
    (0, common_1.Module)({
        imports: [
            posts_module_1.PostsModule, reviews_module_1.ReviewsModule, ads_module_1.AdsModule, places_module_1.PlacesModule, safety_module_1.SafetyModule,
            typeorm_1.TypeOrmModule.forFeature([follow_entity_1.Follow]),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (cfg) => ({
                    secret: cfg.get('JWT_SECRET'),
                }),
            }),
        ],
        controllers: [feed_controller_1.FeedController],
        providers: [feed_service_1.FeedService],
    })
], FeedModule);
//# sourceMappingURL=feed.module.js.map