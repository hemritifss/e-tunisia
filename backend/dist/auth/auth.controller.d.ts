import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        user: {
            id: string;
            fullName: string;
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
}
