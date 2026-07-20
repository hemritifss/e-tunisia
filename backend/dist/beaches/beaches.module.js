"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeachesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const place_entity_1 = require("../places/place.entity");
const user_entity_1 = require("../users/user.entity");
const beach_report_entity_1 = require("./beach-report.entity");
const beaches_service_1 = require("./beaches.service");
const beaches_controller_1 = require("./beaches.controller");
const gamification_module_1 = require("../gamification/gamification.module");
let BeachesModule = class BeachesModule {
};
exports.BeachesModule = BeachesModule;
exports.BeachesModule = BeachesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([place_entity_1.Place, user_entity_1.User, beach_report_entity_1.BeachReport]), gamification_module_1.GamificationModule],
        controllers: [beaches_controller_1.BeachesController],
        providers: [beaches_service_1.BeachesService],
        exports: [beaches_service_1.BeachesService],
    })
], BeachesModule);
//# sourceMappingURL=beaches.module.js.map