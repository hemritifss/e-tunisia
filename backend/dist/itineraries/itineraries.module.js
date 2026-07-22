"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItinerariesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const itinerary_entity_1 = require("./itinerary.entity");
const trip_plan_entity_1 = require("./trip-plan.entity");
const trip_member_entity_1 = require("./trip-member.entity");
const itineraries_service_1 = require("./itineraries.service");
const itineraries_controller_1 = require("./itineraries.controller");
const trips_service_1 = require("./trips.service");
const trips_controller_1 = require("./trips.controller");
const circuits_service_1 = require("./circuits.service");
const place_entity_1 = require("../places/place.entity");
const tour_package_entity_1 = require("../places/tour-package.entity");
const places_module_1 = require("../places/places.module");
const users_module_1 = require("../users/users.module");
const badges_module_1 = require("../badges/badges.module");
const billing_module_1 = require("../billing/billing.module");
let ItinerariesModule = class ItinerariesModule {
};
exports.ItinerariesModule = ItinerariesModule;
exports.ItinerariesModule = ItinerariesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([itinerary_entity_1.Itinerary, trip_plan_entity_1.TripPlan, trip_member_entity_1.TripMember, place_entity_1.Place, tour_package_entity_1.TourPackage]),
            places_module_1.PlacesModule,
            users_module_1.UsersModule,
            badges_module_1.BadgesModule,
            billing_module_1.BillingModule,
        ],
        controllers: [itineraries_controller_1.ItinerariesController, trips_controller_1.TripsController],
        providers: [itineraries_service_1.ItinerariesService, trips_service_1.TripsService, circuits_service_1.CircuitsService],
        exports: [itineraries_service_1.ItinerariesService, trips_service_1.TripsService, circuits_service_1.CircuitsService],
    })
], ItinerariesModule);
//# sourceMappingURL=itineraries.module.js.map