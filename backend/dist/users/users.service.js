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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const bcrypt = require("bcrypt");
let UsersService = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async findByEmail(email) {
        return this.usersRepository.findOne({ where: { email } });
    }
    async findById(id) {
        const user = await this.usersRepository.findOne({
            where: { id },
            relations: ['reviews'],
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async create(data) {
        const hashedPassword = await bcrypt.hash(data.password, 12);
        const user = this.usersRepository.create({
            ...data,
            password: hashedPassword,
            favoriteIds: [],
        });
        return this.usersRepository.save(user);
    }
    async update(id, data) {
        await this.usersRepository.update(id, data);
        return this.findById(id);
    }
    async toggleFavorite(userId, placeId) {
        const user = await this.findById(userId);
        const favorites = user.favoriteIds || [];
        const index = favorites.indexOf(placeId);
        if (index > -1) {
            favorites.splice(index, 1);
        }
        else {
            favorites.push(placeId);
        }
        user.favoriteIds = favorites;
        await this.usersRepository.save(user);
        return favorites;
    }
    async getFavoriteIds(userId) {
        const user = await this.findById(userId);
        return user.favoriteIds || [];
    }
    async toggleVisited(userId, placeId) {
        const user = await this.findById(userId);
        const visited = user.visitedPlaceIds || [];
        const index = visited.indexOf(placeId);
        if (index > -1) {
            visited.splice(index, 1);
        }
        else {
            visited.push(placeId);
        }
        user.visitedPlaceIds = visited;
        await this.usersRepository.save(user);
        return visited;
    }
    async getVisitedIds(userId) {
        const user = await this.findById(userId);
        return user.visitedPlaceIds || [];
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map