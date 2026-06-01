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
exports.ItinerariesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const itinerary_entity_1 = require("./itinerary.entity");
let ItinerariesService = class ItinerariesService {
    constructor(itinerariesRepo) {
        this.itinerariesRepo = itinerariesRepo;
    }
    async findAll() {
        return this.itinerariesRepo.find({
            where: { isActive: true, isPublic: true },
            order: { createdAt: 'DESC' },
            relations: ['author'],
        });
    }
    async findById(id) {
        const itinerary = await this.itinerariesRepo.findOne({
            where: { id },
            relations: ['author'],
        });
        if (!itinerary)
            throw new common_1.NotFoundException('Itinerary not found');
        itinerary.viewCount += 1;
        await this.itinerariesRepo.save(itinerary);
        return itinerary;
    }
    async create(authorId, data) {
        const itinerary = this.itinerariesRepo.create({ ...data, authorId });
        return this.itinerariesRepo.save(itinerary);
    }
    async like(id) {
        const itinerary = await this.findById(id);
        itinerary.likeCount += 1;
        return this.itinerariesRepo.save(itinerary);
    }
};
exports.ItinerariesService = ItinerariesService;
exports.ItinerariesService = ItinerariesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(itinerary_entity_1.Itinerary)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ItinerariesService);
//# sourceMappingURL=itineraries.service.js.map