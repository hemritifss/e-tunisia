import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { BadgesModule } from '../badges/badges.module';
import { CreditsModule } from '../credits/credits.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
    imports: [
        UsersModule,
        BadgesModule,
        CreditsModule,
        QueuesModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'etunisia_secret',
            // jwt v11's types want `StringValue | number`; an env string is fine at runtime.
            signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any },
        }),
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule { }