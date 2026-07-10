"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GemsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const place_entity_1 = require("../places/place.entity");
const category_entity_1 = require("../categories/category.entity");
const user_entity_1 = require("../users/user.entity");
const place_confirmation_entity_1 = require("./place-confirmation.entity");
const gems_service_1 = require("./gems.service");
const gems_controller_1 = require("./gems.controller");
const ai_module_1 = require("../ai/ai.module");
const gamification_module_1 = require("../gamification/gamification.module");
const badges_module_1 = require("../badges/badges.module");
let GemsModule = class GemsModule {
};
exports.GemsModule = GemsModule;
exports.GemsModule = GemsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([place_entity_1.Place, category_entity_1.Category, user_entity_1.User, place_confirmation_entity_1.PlaceConfirmation]),
            ai_module_1.AIModule,
            gamification_module_1.GamificationModule,
            badges_module_1.BadgesModule,
        ],
        controllers: [gems_controller_1.GemsController],
        providers: [gems_service_1.GemsService],
        exports: [gems_service_1.GemsService],
    })
], GemsModule);
//# sourceMappingURL=gems.module.js.map