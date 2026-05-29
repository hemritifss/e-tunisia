"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
const badges_service_1 = require("../badges/badges.service");
const credits_service_1 = require("../credits/credits.service");
const queues_service_1 = require("../queues/queues.service");
const bcrypt = require("bcrypt");
const crypto_1 = require("crypto");
const google_auth_library_1 = require("google-auth-library");
let AuthService = class AuthService {
    constructor(usersService, jwtService, badgesService, creditsService, queuesService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.badgesService = badgesService;
        this.creditsService = creditsService;
        this.queuesService = queuesService;
    }
    async register(dto) {
        const existingEmail = await this.usersService.findByEmail(dto.email);
        if (existingEmail) {
            throw new common_1.ConflictException('Email already registered');
        }
        let handleLower;
        if (dto.handle && dto.handle.trim()) {
            handleLower = dto.handle.toLowerCase();
            const available = await this.usersService.isHandleAvailable(handleLower);
            if (!available) {
                throw new common_1.ConflictException('Handle is unavailable');
            }
        }
        else {
            handleLower = await this.usersService.generateAvailableHandle(dto.fullName);
        }
        const { ref, ...rest } = dto;
        const user = await this.usersService.create({ ...rest, handle: handleLower });
        await this.badgesService.awardIfEligible(user.id, 'user.created', {});
        if (ref && ref.trim()) {
            try {
                const referrer = await this.usersService.findByHandle(ref.trim().toLowerCase());
                if (referrer && referrer.id !== user.id) {
                    await this.usersService.update(user.id, { referredBy: referrer.id });
                    await this.creditsService.createPendingReferral(user.id, referrer.id);
                }
            }
            catch { }
        }
        const token = this.generateToken(user);
        try {
            await this.queuesService.addEmailJob('welcome', {
                email: user.email,
                name: user.fullName,
            });
        }
        catch { }
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
    async login(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
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
    generateToken(user) {
        return this.jwtService.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
            tv: user.tokenVersion || 0,
        });
    }
    async requestPasswordReset(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return { message: 'If an account exists, a reset link has been sent.' };
        }
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const expires = new Date(Date.now() + 1000 * 60 * 60);
        await this.usersService.update(user.id, {
            passwordResetToken: token,
            passwordResetExpires: expires,
        });
        try {
            await this.queuesService.addEmailJob('password_reset', {
                email: user.email,
                token,
            });
        }
        catch { }
        return {
            message: 'If an account exists, a reset link has been sent.',
            ...(process.env.NODE_ENV !== 'production' ? { token } : {}),
        };
    }
    async resetPassword(token, newPassword) {
        if (!token || !newPassword || newPassword.length < 6) {
            throw new common_1.BadRequestException('Invalid token or password too short');
        }
        const user = await this.usersService.findByResetToken(token);
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired token');
        }
        if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
            throw new common_1.BadRequestException('Token has expired');
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.usersService.update(user.id, {
            password: hashed,
            passwordResetToken: null,
            passwordResetExpires: null,
            tokenVersion: (user.tokenVersion || 0) + 1,
        });
        return { message: 'Password updated successfully' };
    }
    async googleLogin(credential) {
        const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid Google credential');
        }
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw new common_1.UnauthorizedException('Invalid Google credential');
        }
        let user = await this.usersService.findByEmail(payload.email);
        if (!user) {
            const handle = await this.usersService.generateAvailableHandle(payload.name || 'User');
            user = await this.usersService.create({
                fullName: payload.name || payload.email.split('@')[0],
                email: payload.email,
                password: await bcrypt.hash((0, crypto_1.randomBytes)(32).toString('hex'), 10),
                handle,
                avatar: payload.picture || null,
                onboardingComplete: false,
            });
            await this.badgesService.awardIfEligible(user.id, 'user.created', {});
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account deactivated');
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        badges_service_1.BadgesService,
        credits_service_1.CreditsService,
        queues_service_1.QueuesService])
], AuthService);
//# sourceMappingURL=auth.service.js.map