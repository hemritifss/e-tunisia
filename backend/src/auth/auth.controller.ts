import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
    @ApiOperation({ summary: 'Register a new user' })
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login user' })
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('forgot-password')
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Request password reset token' })
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.requestPasswordReset(dto.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset password with token' })
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto.token, dto.password);
    }

    @Post('google')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login or register with Google' })
    googleLogin(@Body() dto: GoogleLoginDto) {
        return this.authService.googleLogin(dto.credential);
    }
}