"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSuperAdmin = isSuperAdmin;
exports.isAdmin = isAdmin;
const user_entity_1 = require("../users/user.entity");
function isSuperAdmin(user) {
    if (!user)
        return false;
    if (user.role === user_entity_1.UserRole.SUPERADMIN)
        return true;
    const list = (process.env.SUPERADMIN_EMAILS || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    return !!user.email && list.includes(user.email.toLowerCase());
}
function isAdmin(user) {
    if (!user)
        return false;
    return user.role === user_entity_1.UserRole.ADMIN || isSuperAdmin(user);
}
//# sourceMappingURL=is-super-admin.js.map