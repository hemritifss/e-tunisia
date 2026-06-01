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
exports.ContactService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const contact_entity_1 = require("./contact.entity");
let ContactService = class ContactService {
    constructor(contactRepo) {
        this.contactRepo = contactRepo;
    }
    async create(data) {
        return this.contactRepo.save(this.contactRepo.create(data));
    }
    async findAll() {
        return this.contactRepo.find({ order: { createdAt: 'DESC' } });
    }
    async findPending() {
        return this.contactRepo.find({
            where: { status: contact_entity_1.ContactStatus.PENDING },
            order: { createdAt: 'DESC' },
        });
    }
    async updateStatus(id, status, adminNotes) {
        const contact = await this.contactRepo.findOne({ where: { id } });
        if (!contact)
            throw new common_1.NotFoundException('Contact request not found');
        contact.status = status;
        if (adminNotes)
            contact.adminNotes = adminNotes;
        return this.contactRepo.save(contact);
    }
    async getStats() {
        const total = await this.contactRepo.count();
        const pending = await this.contactRepo.count({ where: { status: contact_entity_1.ContactStatus.PENDING } });
        return { total, pending };
    }
};
exports.ContactService = ContactService;
exports.ContactService = ContactService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(contact_entity_1.Contact)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ContactService);
//# sourceMappingURL=contact.service.js.map