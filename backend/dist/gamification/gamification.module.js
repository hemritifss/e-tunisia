"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const badge_entity_1 = require("./badge.entity");
const user_badge_entity_1 = require("./user-badge.entity");
const user_entity_1 = require("../users/user.entity");
const gamification_service_1 = require("./gamification.service");
const gamification_controller_1 = require("./gamification.controller");
let GamificationModule = class GamificationModule {
};
exports.GamificationModule = GamificationModule;
exports.GamificationModule = GamificationModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([badge_entity_1.Badge, user_badge_entity_1.UserBadge, user_entity_1.User])],
        controllers: [gamification_controller_1.GamificationController],
        providers: [gamification_service_1.GamificationService],
        exports: [gamification_service_1.GamificationService],
    })
], GamificationModule);
//# sourceMappingURL=gamification.module.js.map