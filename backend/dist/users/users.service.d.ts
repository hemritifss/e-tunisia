import { Repository } from 'typeorm';
import { User } from './user.entity';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User>;
    create(data: Partial<User>): Promise<User>;
    update(id: string, data: Partial<User>): Promise<User>;
    toggleFavorite(userId: string, placeId: string): Promise<string[]>;
    getFavoriteIds(userId: string): Promise<string[]>;
    toggleVisited(userId: string, placeId: string): Promise<string[]>;
    getVisitedIds(userId: string): Promise<string[]>;
}
