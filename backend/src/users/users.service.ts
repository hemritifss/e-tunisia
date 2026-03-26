import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findById(id: string): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: { id },
            relations: ['reviews'],
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async create(data: Partial<User>): Promise<User> {
        const hashedPassword = await bcrypt.hash(data.password, 12);
        const user = this.usersRepository.create({
            ...data,
            password: hashedPassword,
            favoriteIds: [],
        });
        return this.usersRepository.save(user);
    }

    async update(id: string, data: Partial<User>): Promise<User> {
        await this.usersRepository.update(id, data);
        return this.findById(id);
    }

    async toggleFavorite(userId: string, placeId: string): Promise<string[]> {
        const user = await this.findById(userId);
        const favorites = user.favoriteIds || [];
        const index = favorites.indexOf(placeId);

        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(placeId);
        }

        user.favoriteIds = favorites;
        await this.usersRepository.save(user);
        return favorites;
    }

    async getFavoriteIds(userId: string): Promise<string[]> {
        const user = await this.findById(userId);
        return user.favoriteIds || [];
    }

    async toggleVisited(userId: string, placeId: string): Promise<string[]> {
        const user = await this.findById(userId);
        const visited = user.visitedPlaceIds || [];
        const index = visited.indexOf(placeId);

        if (index > -1) {
            visited.splice(index, 1);
        } else {
            visited.push(placeId);
        }

        user.visitedPlaceIds = visited;
        await this.usersRepository.save(user);
        return visited;
    }

    async getVisitedIds(userId: string): Promise<string[]> {
        const user = await this.findById(userId);
        return user.visitedPlaceIds || [];
    }
}