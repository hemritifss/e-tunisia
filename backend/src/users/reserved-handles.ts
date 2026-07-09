/** Slugs that must NEVER be claimable as a user handle.
 *  Includes routing collisions, brand/legal protected words, and abusive bait. */
export const RESERVED_HANDLES = new Set<string>([
    // routing collisions (must mirror current + planned routes)
    'admin', 'api', 'auth', 'login', 'logout', 'signup', 'register',
    'me', 'settings', 'profile', 'profile-edit', 'edit',
    'feed', 'discover', 'discover-trips', 'explore',
    'trip', 'trips', 'place', 'places', 'package', 'packages',
    'post', 'posts', 'review', 'reviews', 'comment', 'comments',
    'messages', 'inquiries', 'inquiry', 'owner', 'tag', 'saved',
    'onboarding', 'verify', 'reset', 'reset-password', 'forgot',
    'u', 'user', 'users', 'about', 'contact', 'privacy', 'terms', 'help', 'support',
    // brand / abuse
    'tunisia', 'official', 'etunisia', 'e-tunisia', 'staff', 'team', 'mod', 'moderator',
    'root', 'system', 'null', 'undefined', 'anonymous', 'anon',
]);

export const HANDLE_PATTERN = /^[a-z][a-z0-9_]{2,29}$/;

export function isHandleFormatValid(h: string): boolean {
    return typeof h === 'string' && HANDLE_PATTERN.test(h);
}

export function isHandleReserved(h: string): boolean {
    return typeof h === 'string' && RESERVED_HANDLES.has(h.toLowerCase());
}
