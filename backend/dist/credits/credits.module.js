"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const credit_balance_entity_1 = require("./credit-balance.entity");
const credit_transaction_entity_1 = require("./credit-transaction.entity");
const donation_entity_1 = require("./donation.entity");
const user_entity_1 = require("../users/user.entity");
const credits_controller_1 = require("./credits.controller");
const credits_service_1 = require("./credits.service");
const notifications_module_1 = require("../notifications/notifications.module");
let CreditsModule = class CreditsModule {
};
exports.CreditsModule = CreditsModule;
exports.CreditsModule = CreditsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([credit_balance_entity_1.CreditBalance, credit_transaction_entity_1.CreditTransaction, donation_entity_1.Donation, user_entity_1.User]),
            notifications_module_1.NotificationsModule,
        ],
        controllers: [credits_controller_1.CreditsController],
        providers: [credits_service_1.CreditsService],
        exports: [credits_service_1.CreditsService],
    })
], CreditsModule);
//# sourceMappingURL=credits.module.js.map