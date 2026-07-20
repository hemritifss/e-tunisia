"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("../users/user.entity");
const place_entity_1 = require("../places/place.entity");
const review_entity_1 = require("../reviews/review.entity");
const subscription_entity_1 = require("../subscriptions/subscription.entity");
const event_entity_1 = require("../events/event.entity");
const tip_entity_1 = require("../tips/tip.entity");
const audit_log_entity_1 = require("./audit-log.entity");
const admin_service_1 = require("./admin.service");
const admin_controller_1 = require("./admin.controller");
const audit_interceptor_1 = require("./audit.interceptor");
const super_admin_guard_1 = require("./super-admin.guard");
const gems_module_1 = require("../gems/gems.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            gems_module_1.GemsModule,
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, place_entity_1.Place, review_entity_1.Review, subscription_entity_1.Subscription, event_entity_1.Event, tip_entity_1.Tip, audit_log_entity_1.AuditLog]),
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService, audit_interceptor_1.AuditInterceptor, super_admin_guard_1.SuperAdminGuard],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map