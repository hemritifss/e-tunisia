import { UserRole } from '../users/user.entity';

/**
 * A user is a super-admin if their DB role is SUPERADMIN, or their email is listed in
 * the SUPERADMIN_EMAILS env (comma-separated). The env path lets oversight work without
 * a DB migration/seed — the configured owner email is super-admin out of the box.
 */
export function isSuperAdmin(user: { role?: string; email?: string } | undefined | null): boolean {
    if (!user) return false;
    if (user.role === UserRole.SUPERADMIN) return true;
    const list = (process.env.SUPERADMIN_EMAILS || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    return !!user.email && list.includes(user.email.toLowerCase());
}

/** Admin OR super-admin — the bar for the admin dashboard. */
export function isAdmin(user: { role?: string; email?: string } | undefined | null): boolean {
    if (!user) return false;
    return user.role === UserRole.ADMIN || isSuperAdmin(user);
}
