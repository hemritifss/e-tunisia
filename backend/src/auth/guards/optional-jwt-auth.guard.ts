import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard but never throws when there's no/invalid token.
 * Use for endpoints that accept both authed and guest traffic
 * (e.g. lead-gen forms where guests are allowed too).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    // Override handleRequest so the guard never throws on missing/invalid token —
    // it just returns null and req.user stays undefined for guests.
    handleRequest(_err: any, user: any) {
        return user || null;
    }
}
