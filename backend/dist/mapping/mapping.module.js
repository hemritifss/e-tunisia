"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MappingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const mapping_service_1 = require("./mapping.service");
const mapping_controller_1 = require("./mapping.controller");
const mapping_event_entity_1 = require("./mapping-event.entity");
const place_entity_1 = require("../places/place.entity");
const user_entity_1 = require("../users/user.entity");
const place_confirmation_entity_1 = require("../gems/place-confirmation.entity");
const place_visit_entity_1 = require("../users/place-visit.entity");
const review_entity_1 = require("../reviews/review.entity");
const beach_report_entity_1 = require("../beaches/beach-report.entity");
let MappingModule = class MappingModule {
};
exports.MappingModule = MappingModule;
exports.MappingModule = MappingModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([mapping_event_entity_1.MappingEvent, place_entity_1.Place, user_entity_1.User, place_confirmation_entity_1.PlaceConfirmation, place_visit_entity_1.PlaceVisit, review_entity_1.Review, beach_report_entity_1.BeachReport])],
        controllers: [mapping_controller_1.MappingController],
        providers: [mapping_service_1.MappingService],
        exports: [mapping_service_1.MappingService],
    })
], MappingModule);
//# sourceMappingURL=mapping.module.js.map