import {
    Injectable, CanActivate, ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { isSuperAdmin } from './is-super-admin';

/** Gate for actions that supervise admins themselves (e.g. granting/revoking the admin role). */
@Injectable()
export class SuperAdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const user = context.switchToHttp().getRequest().user;
        if (!isSuperAdmin(user)) {
            throw new ForbiddenException('Super-admin access only');
        }
        return true;
    }
}
