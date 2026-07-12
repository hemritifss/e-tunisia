import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Place } from '../places/place.entity';
import { Post } from '../posts/post.entity';
import { TripPlan } from '../itineraries/trip-plan.entity';
import { OgService } from './og.service';
export declare class OgController {
    private readonly config;
    private readonly users;
    private readonly places;
    private readonly posts;
    private readonly trips;
    private readonly og;
    constructor(config: ConfigService, users: Repository<User>, places: Repository<Place>, posts: Repository<Post>, trips: Repository<TripPlan>, og: OgService);
    private webOrigin;
    private apiOrigin;
    private absolutize;
    user(rawHandle: string, req: Request, res: Response): Promise<void>;
    place(id: string, req: Request, res: Response): Promise<void>;
    post(id: string, req: Request, res: Response): Promise<void>;
    trip(slug: string, req: Request, res: Response): Promise<void>;
    cityQuiz(rawSlug: string, req: Request, res: Response): Promise<void>;
    cityQuizImage(rawSlug: string, res: Response): Promise<void>;
}
