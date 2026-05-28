import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { BadgesService } from '../badges/badges.service';
import { CreditsService } from '../credits/credits.service';
import { QueuesService } from '../queues/queues.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private badgesService: BadgesService,
        private creditsService: CreditsService,
        private queuesService: QueuesService,
    ) { }

    async register(dto: RegisterDto) {
        const existingEmail = await this.usersService.findByEmail(dto.email);
        if (existingEmail) {
            throw new ConflictException('Email already registered');
        }

        // Two paths:
        //  - Caller (SignupGate modal) provided a handle: validate + take it.
        //  - Legacy /register form omits handle: auto-generate from fullName,
        //    same algorithm as backfill-handles.ts.
        let handleLower: string;
        if (dto.handle && dto.handle.trim()) {
            handleLower = dto.handle.toLowerCase();
            const available = await this.usersService.isHandleAvailable(handleLower);
            if (!available) {
                throw new ConflictException('Handle is unavailable');
            }
        } else {
            handleLower = await this.usersService.generateAvailableHandle(dto.fullName);
        }

        const { ref, ...rest } = dto;
        const user = await this.usersService.create({ ...rest, handle: handleLower });
        await this.badgesService.awardIfEligible(user.id, 'user.created', {});

        // Referral: link + reward both sides if a valid, non-self referrer handle was provided.
        if (ref && ref.trim()) {
            try {
                const referrer = await this.usersService.findByHandle(ref.trim().toLowerCase());
                if (referrer && referrer.id !== user.id) {
                    await this.usersService.update(user.id, { referredBy: referrer.id } as any);
                    await this.creditsService.createPendingReferral(user.id, referrer.id);
                }
            } catch { /* referral failures never block signup */ }
        }

        const token = this.generateToken(user);

        // Queue welcome email
        try {
            await this.queuesService.addEmailJob('welcome', {
                email: user.email,
                name: user.fullName,
            });
        } catch { /* welcome email failure never blocks registration */ }

        return {
            user: {
                id: user.id,
                fullName: user.fullName,
                handle: user.handle,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
            },
            accessToken: token,
        };
    }

    async login(dto: LoginDto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = this.generateToken(user);

        return {
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
            },
            accessToken: token,
        };
    }

    private generateToken(user: any): string {
        return this.jwtService.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
            tv: user.tokenVersion || 0,
        });
    }

    async requestPasswordReset(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            // Don't reveal whether email exists
            return { message: 'If an account exists, a reset link has been sent.' };
        }

        const token = randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

        await this.usersService.update(user.id, {
            passwordResetToken: token,
            passwordResetExpires: expires,
        } as any);

        // Queue password reset email
        try {
            await this.queuesService.addEmailJob('password_reset', {
                email: user.email,
                token,
            });
        } catch { /* email failure never blocks the request */ }

        return {
            message: 'If an account exists, a reset link has been sent.',
            // Remove `token` in production once email service is live
            ...(process.env.NODE_ENV !== 'production' ? { token } : {}),
        };
    }

    async resetPassword(token: string, newPassword: string) {
        if (!token || !newPassword || newPassword.length < 6) {
            throw new BadRequestException('Invalid token or password too short');
        }

        const user = await this.usersService.findByResetToken(token);
        if (!user) {
            throw new BadRequestException('Invalid or expired token');
        }

        if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
            throw new BadRequestException('Token has expired');
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await this.usersService.update(user.id, {
            password: hashed,
            passwordResetToken: null,
            passwordResetExpires: null,
            tokenVersion: (user.tokenVersion || 0) + 1,
        } as any);

        return { message: 'Password updated successfully' };
    }

    async googleLogin(credential: string) {
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
        } catch {
            throw new UnauthorizedException('Invalid Google credential');
        }

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw new UnauthorizedException('Invalid Google credential');
        }

        let user = await this.usersService.findByEmail(payload.email);

        if (!user) {
            // Auto-register with Google data
            const handle = await this.usersService.generateAvailableHandle(payload.name || 'User');
            user = await this.usersService.create({
                fullName: payload.name || payload.email.split('@')[0],
                email: payload.email,
                password: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
                handle,
                avatar: payload.picture || null,
                onboardingComplete: false,
            } as any);
            await this.badgesService.awardIfEligible(user.id, 'user.created', {});
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account deactivated');
        }

        const token = this.generateToken(user);
        return {
            user: {
                id: user.id,
                fullName: user.fullName,
                handle: user.handle,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
            },
            accessToken: token,
        };
    }
}