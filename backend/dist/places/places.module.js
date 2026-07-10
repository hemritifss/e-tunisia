"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlacesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const place_entity_1 = require("./place.entity");
const user_entity_1 = require("../users/user.entity");
const place_inquiry_entity_1 = require("./place-inquiry.entity");
const tour_package_entity_1 = require("./tour-package.entity");
const places_service_1 = require("./places.service");
const places_controller_1 = require("./places.controller");
const inquiries_service_1 = require("./inquiries.service");
const inquiries_controller_1 = require("./inquiries.controller");
const packages_service_1 = require("./packages.service");
const packages_controller_1 = require("./packages.controller");
const notifications_module_1 = require("../notifications/notifications.module");
const credits_module_1 = require("../credits/credits.module");
let PlacesModule = class PlacesModule {
};
exports.PlacesModule = PlacesModule;
exports.PlacesModule = PlacesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([place_entity_1.Place, user_entity_1.User, place_inquiry_entity_1.PlaceInquiry, tour_package_entity_1.TourPackage]), notifications_module_1.NotificationsModule, credits_module_1.CreditsModule],
        providers: [places_service_1.PlacesService, inquiries_service_1.InquiriesService, packages_service_1.PackagesService],
        controllers: [places_controller_1.PlacesController, inquiries_controller_1.InquiriesController, packages_controller_1.PackagesController],
        exports: [places_service_1.PlacesService, inquiries_service_1.InquiriesService, packages_service_1.PackagesService],
    })
], PlacesModule);
//# sourceMappingURL=places.module.js.map