import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { BadgesService } from '../badges/badges.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private badgesService: BadgesService,
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

        const user = await this.usersService.create({ ...dto, handle: handleLower });
        await this.badgesService.awardIfEligible(user.id, 'user.created', {});
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
        });
    }
}