import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        token?: string;
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    googleLogin(dto: GoogleLoginDto): Promise<{
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
}
