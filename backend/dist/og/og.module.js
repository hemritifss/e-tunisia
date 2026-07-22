"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OgModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const og_service_1 = require("./og.service");
const og_controller_1 = require("./og.controller");
const user_entity_1 = require("../users/user.entity");
const place_entity_1 = require("../places/place.entity");
const post_entity_1 = require("../posts/post.entity");
const trip_plan_entity_1 = require("../itineraries/trip-plan.entity");
const wrapped_module_1 = require("../wrapped/wrapped.module");
const mapping_module_1 = require("../mapping/mapping.module");
let OgModule = class OgModule {
};
exports.OgModule = OgModule;
exports.OgModule = OgModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, place_entity_1.Place, post_entity_1.Post, trip_plan_entity_1.TripPlan]), wrapped_module_1.WrappedModule, mapping_module_1.MappingModule],
        controllers: [og_controller_1.OgController],
        providers: [og_service_1.OgService],
        exports: [og_service_1.OgService],
    })
], OgModule);
//# sourceMappingURL=og.module.js.map