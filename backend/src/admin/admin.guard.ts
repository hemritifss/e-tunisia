import {
    Injectable, CanActivate, ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { isAdmin } from './is-super-admin';

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!isAdmin(user)) {
            throw new ForbiddenException('Admin access only');
        }

        return true;
    }
}
