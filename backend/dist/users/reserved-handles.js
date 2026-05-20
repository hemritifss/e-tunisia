"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HANDLE_PATTERN = exports.RESERVED_HANDLES = void 0;
exports.isHandleFormatValid = isHandleFormatValid;
exports.isHandleReserved = isHandleReserved;
exports.RESERVED_HANDLES = new Set([
    'admin', 'api', 'auth', 'login', 'logout', 'signup', 'register',
    'me', 'settings', 'profile', 'profile-edit', 'edit',
    'feed', 'discover', 'discover-trips', 'explore',
    'trip', 'trips', 'place', 'places', 'package', 'packages',
    'post', 'posts', 'review', 'reviews', 'comment', 'comments',
    'messages', 'inquiries', 'inquiry', 'owner', 'tag', 'saved',
    'onboarding', 'verify', 'reset', 'reset-password', 'forgot',
    'u', 'user', 'users', 'about', 'contact', 'privacy', 'terms', 'help', 'support',
    'tunisia', 'official', 'etunisia', 'e-tunisia', 'staff', 'team', 'mod', 'moderator',
    'root', 'system', 'null', 'undefined', 'anonymous', 'anon',
]);
exports.HANDLE_PATTERN = /^[a-z][a-z0-9_]{2,29}$/;
function isHandleFormatValid(h) {
    return typeof h === 'string' && exports.HANDLE_PATTERN.test(h);
}
function isHandleReserved(h) {
    return typeof h === 'string' && exports.RESERVED_HANDLES.has(h.toLowerCase());
}
//# sourceMappingURL=reserved-handles.js.map