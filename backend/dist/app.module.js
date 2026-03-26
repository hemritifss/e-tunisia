"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const places_module_1 = require("./places/places.module");
const categories_module_1 = require("./categories/categories.module");
const reviews_module_1 = require("./reviews/reviews.module");
const media_module_1 = require("./media/media.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const tips_module_1 = require("./tips/tips.module");
const events_module_1 = require("./events/events.module");
const itineraries_module_1 = require("./itineraries/itineraries.module");
const collections_module_1 = require("./collections/collections.module");
const admin_module_1 = require("./admin/admin.module");
const sponsors_module_1 = require("./sponsors/sponsors.module");
const ads_module_1 = require("./ads/ads.module");
const gamification_module_1 = require("./gamification/gamification.module");
const notifications_module_1 = require("./notifications/notifications.module");
const contact_module_1 = require("./contact/contact.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'better-sqlite3',
                database: 'etunisia.db',
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: true,
                logging: false,
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            places_module_1.PlacesModule,
            categories_module_1.CategoriesModule,
            reviews_module_1.ReviewsModule,
            media_module_1.MediaModule,
            subscriptions_module_1.SubscriptionsModule,
            tips_module_1.TipsModule,
            events_module_1.EventsModule,
            itineraries_module_1.ItinerariesModule,
            collections_module_1.CollectionsModule,
            admin_module_1.AdminModule,
            sponsors_module_1.SponsorsModule,
            ads_module_1.AdsModule,
            gamification_module_1.GamificationModule,
            notifications_module_1.NotificationsModule,
            contact_module_1.ContactModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map