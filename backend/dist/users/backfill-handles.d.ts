import { Repository } from 'typeorm';
import { User } from './user.entity';
export declare function backfillHandles(repo: Repository<User>): Promise<number>;
