"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigestModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("../users/user.entity");
const streak_entity_1 = require("../challenges/streak.entity");
const place_entity_1 = require("../places/place.entity");
const email_module_1 = require("../email/email.module");
const push_module_1 = require("../push/push.module");
const digest_service_1 = require("./digest.service");
const digest_controller_1 = require("./digest.controller");
const scheduled_tasks_service_1 = require("../scheduled/scheduled-tasks.service");
let DigestModule = class DigestModule {
};
exports.DigestModule = DigestModule;
exports.DigestModule = DigestModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, streak_entity_1.UserStreak, place_entity_1.Place]), email_module_1.EmailModule, push_module_1.PushModule],
        controllers: [digest_controller_1.DigestController],
        providers: [
            digest_service_1.DigestService,
            { provide: scheduled_tasks_service_1.WeeklyDigestRunner, useExisting: digest_service_1.DigestService },
        ],
        exports: [digest_service_1.DigestService, scheduled_tasks_service_1.WeeklyDigestRunner],
    })
], DigestModule);
//# sourceMappingURL=digest.module.js.map