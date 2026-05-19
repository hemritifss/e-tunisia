import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { Review } from '../reviews/review.entity';
import { Place } from '../places/place.entity';
import { TripPlan } from '../itineraries/trip-plan.entity';
import { SavedPost } from '../posts/saved-post.entity';
import { PassportDto, deriveLevel } from './dto/passport.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private usersRepository: Repository<User>,
        @InjectRepository(Review) private reviewsRepo: Repository<Review>,
        @InjectRepository(Place) private placesRepo: Repository<Place>,
        @InjectRepository(TripPlan) private tripsRepo: Repository<TripPlan>,
        @InjectRepository(SavedPost) private savesRepo: Repository<SavedPost>,
    ) { }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findByHandle(handle: string): Promise<User | null> {
        if (!handle) return null;
        return this.usersRepository.findOne({ where: { handle: handle.toLowerCase() } });
    }

    async isHandleAvailable(handle: string): Promise<boolean> {
        const h = (handle || '').toLowerCase();
        const { isHandleFormatValid, isHandleReserved } = await import('./reserved-handles');
        if (!isHandleFormatValid(h)) return false;
        if (isHandleReserved(h)) return false;
        const existing = await this.usersRepository.findOne({ where: { handle: h } });
        return !existing;
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

    /** Cold-start suggestions: real users excluding the platform / inactive accounts. */
    async suggestedUsers(limit = 6) {
        const rows = await this.usersRepository
            .createQueryBuilder('u')
            .where('u.isActive = :a', { a: true })
            .andWhere('u.email NOT LIKE :p', { p: 'platform@%' })
            .andWhere('u.email NOT LIKE :a', { a: 'admin@%' })
            .orderBy('u.points', 'DESC')
            .addOrderBy('u.createdAt', 'DESC')
            .take(limit)
            .getMany();
        return rows.map((u: any) => ({
            id: u.id,
            fullName: u.fullName,
            avatar: u.avatar || null,
            country: u.country || null,
            bio: u.bio || null,
            level: u.level || 1,
            points: u.points || 0,
        }));
    }

    /** Public passport view. Excludes sensitive fields. Throws NotFound if handle missing. */
    async assemblePassport(handle: string): Promise<PassportDto> {
        const user = await this.findByHandle(handle);
        if (!user) throw new NotFoundException('Passport not found');

        const visitedIds = Array.isArray(user.visitedPlaceIds) ? user.visitedPlaceIds : [];

        const [reviewsCount, tripsPlanned, savesCount, visitedCities] = await Promise.all([
            this.reviewsRepo.count({ where: { user: { id: user.id } } as any }).catch(() => 0),
            this.tripsRepo.count({ where: { userId: user.id } }).catch(() => 0),
            this.savesRepo.count({ where: { userId: user.id } as any }).catch(() => 0),
            visitedIds.length
                ? this.placesRepo
                    .createQueryBuilder('p')
                    .select('DISTINCT p.city', 'city')
                    .where('p.id IN (:...ids)', { ids: visitedIds })
                    .getRawMany()
                    .then((rows) => rows.map((r) => r.city).filter(Boolean))
                    .catch(() => [])
                : Promise.resolve([] as string[]),
        ]);

        return {
            handle: user.handle as string,
            fullName: user.fullName,
            avatar: user.avatar || null,
            country: user.country || null,
            bio: user.bio || null,
            website: user.website || null,
            interests: Array.isArray(user.interests) ? user.interests : [],
            badges: Array.isArray(user.badges) ? user.badges : [],
            points: user.points || 0,
            passportLevel: deriveLevel(user.points || 0),
            role: user.role as any,
            joinedAt: user.createdAt.toISOString(),
            stats: {
                citiesVisited: visitedCities.length,
                tripsPlanned,
                reviewsCount,
                savesCount,
            },
            visitedCities,
        };
    }
}