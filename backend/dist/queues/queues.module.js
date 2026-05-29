"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuesModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const queues_service_1 = require("./queues.service");
const notification_processor_1 = require("./processors/notification.processor");
const email_processor_1 = require("./processors/email.processor");
const analytics_processor_1 = require("./processors/analytics.processor");
const image_processor_1 = require("./processors/image.processor");
const booking_processor_1 = require("./processors/booking.processor");
const payout_processor_1 = require("./processors/payout.processor");
const notification_entity_1 = require("../notifications/notification.entity");
const booking_entity_1 = require("../bookings/booking.entity");
const push_module_1 = require("../push/push.module");
const email_module_1 = require("../email/email.module");
const redis_module_1 = require("../redis/redis.module");
const storage_module_1 = require("../storage/storage.module");
const users_module_1 = require("../users/users.module");
let QueuesModule = class QueuesModule {
};
exports.QueuesModule = QueuesModule;
exports.QueuesModule = QueuesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    connection: {
                        host: configService.get('REDIS_HOST') || 'localhost',
                        port: configService.get('REDIS_PORT') || 6379,
                        password: configService.get('REDIS_PASSWORD') || undefined,
                    },
                }),
            }),
            bullmq_1.BullModule.registerQueue({ name: 'emails' }, { name: 'images' }, { name: 'analytics' }, { name: 'notifications' }, { name: 'bookings' }, { name: 'payouts' }),
            typeorm_1.TypeOrmModule.forFeature([notification_entity_1.Notification, booking_entity_1.Booking]),
            push_module_1.PushModule,
            email_module_1.EmailModule,
            redis_module_1.RedisModule,
            storage_module_1.StorageModule,
            (0, common_1.forwardRef)(() => users_module_1.UsersModule),
        ],
        providers: [
            queues_service_1.QueuesService,
            notification_processor_1.NotificationProcessor,
            email_processor_1.EmailProcessor,
            analytics_processor_1.AnalyticsProcessor,
            image_processor_1.ImageProcessor,
            booking_processor_1.BookingProcessor,
            payout_processor_1.PayoutProcessor,
        ],
        exports: [queues_service_1.QueuesService, bullmq_1.BullModule],
    })
], QueuesModule);
//# sourceMappingURL=queues.module.js.map