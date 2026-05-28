import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { BadgesService } from '../badges/badges.service';
import { CreditsService } from '../credits/credits.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private usersService;
    private jwtService;
    private badgesService;
    private creditsService;
    constructor(usersService: UsersService, jwtService: JwtService, badgesService: BadgesService, creditsService: CreditsService);
    register(dto: RegisterDto): Promise<{
        user: {
            id: string;
            fullName: string;
            handle: string;
            email: string;
            avatar: string;
            role: import("../users/user.entity").UserRole;
        };
        accessToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: string;
            fullName: string;
            email: string;
            avatar: string;
            role: import("../users/user.entity").UserRole;
        };
        accessToken: string;
    }>;
    private generateToken;
}
