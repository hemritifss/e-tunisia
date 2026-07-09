"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const streak_entity_1 = require("../challenges/streak.entity");
const notifications_module_1 = require("../notifications/notifications.module");
const redis_module_1 = require("../redis/redis.module");
const digest_module_1 = require("../digest/digest.module");
const scheduled_tasks_service_1 = require("./scheduled-tasks.service");
let ScheduledModule = class ScheduledModule {
};
exports.ScheduledModule = ScheduledModule;
exports.ScheduledModule = ScheduledModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([streak_entity_1.UserStreak]), notifications_module_1.NotificationsModule, redis_module_1.RedisModule, digest_module_1.DigestModule],
        providers: [scheduled_tasks_service_1.ScheduledTasksService],
        exports: [scheduled_tasks_service_1.ScheduledTasksService],
    })
], ScheduledModule);
//# sourceMappingURL=scheduled.module.js.map