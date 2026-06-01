"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const push_service_1 = require("./push.service");
class SubscribeDto {
}
class UnsubscribeDto {
}
let PushController = class PushController {
    constructor(pushService) {
        this.pushService = pushService;
    }
    subscribe(req, dto) {
        return this.pushService.subscribe(req.user.id, dto.subscription);
    }
    unsubscribe(req, dto) {
        return this.pushService.unsubscribe(req.user.id, dto.endpoint);
    }
};
exports.PushController = PushController;
__decorate([
    (0, common_1.Post)('subscribe'),
    (0, swagger_1.ApiOperation)({ summary: 'Subscribe to push notifications' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, SubscribeDto]),
    __metadata("design:returntype", void 0)
], PushController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Post)('unsubscribe'),
    (0, swagger_1.ApiOperation)({ summary: 'Unsubscribe from push notifications' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UnsubscribeDto]),
    __metadata("design:returntype", void 0)
], PushController.prototype, "unsubscribe", null);
exports.PushController = PushController = __decorate([
    (0, swagger_1.ApiTags)('push'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('push'),
    __metadata("design:paramtypes", [push_service_1.PushService])
], PushController);
//# sourceMappingURL=push.controller.js.map