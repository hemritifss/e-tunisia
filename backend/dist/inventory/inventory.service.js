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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_entity_1 = require("./inventory.entity");
const booking_entity_1 = require("../bookings/booking.entity");
let InventoryService = class InventoryService {
    constructor(inventoryRepo, bookingRepo) {
        this.inventoryRepo = inventoryRepo;
        this.bookingRepo = bookingRepo;
    }
    async create(dto) {
        const item = this.inventoryRepo.create(dto);
        return this.inventoryRepo.save(item);
    }
    async findByPlace(placeId) {
        return this.inventoryRepo.find({
            where: { placeId, isActive: true },
            order: { price: 'ASC' },
        });
    }
    async findOne(id) {
        const item = await this.inventoryRepo.findOne({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Inventory item not found');
        return item;
    }
    async update(id, dto) {
        const item = await this.findOne(id);
        Object.assign(item, dto);
        return this.inventoryRepo.save(item);
    }
    async remove(id) {
        const item = await this.findOne(id);
        item.isActive = false;
        await this.inventoryRepo.save(item);
    }
    async checkAvailability(itemId, checkIn, checkOut, guests) {
        const item = await this.findOne(itemId);
        if (guests > item.capacity) {
            return { available: false, price: 0 };
        }
        const checkInDate = new Date(checkIn);
        const checkOutDate = checkOut ? new Date(checkOut) : checkInDate;
        const blockedDates = [];
        if (item.blockedDates) {
            for (let d = new Date(checkInDate); d <= checkOutDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                if (item.blockedDates.some((bd) => bd.date === dateStr)) {
                    blockedDates.push(dateStr);
                }
            }
        }
        if (blockedDates.length > 0) {
            return { available: false, price: 0, blockedDates };
        }
        const qb = this.bookingRepo
            .createQueryBuilder('booking')
            .where('booking.itemId = :itemId', { itemId })
            .andWhere('booking.status IN (:...statuses)', {
            statuses: ['pending', 'confirmed', 'paid'],
        });
        if (checkOut) {
            qb.andWhere('(booking.checkIn <= :checkOut AND (booking.checkOut >= :checkIn OR booking.checkOut IS NULL))', { checkIn, checkOut });
        }
        else {
            qb.andWhere('(booking.checkIn = :checkIn OR (booking.checkIn <= :checkIn AND booking.checkOut >= :checkIn))', { checkIn });
        }
        const conflicts = await qb.getCount();
        if (conflicts > 0) {
            return { available: false, price: 0 };
        }
        return { available: true, price: Number(item.price) };
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_entity_1.InventoryItem)),
    __param(1, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map