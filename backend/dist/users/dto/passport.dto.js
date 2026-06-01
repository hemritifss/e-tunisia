"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveLevel = deriveLevel;
function deriveLevel(points) {
    if (points >= 2000)
        return 'Platinum';
    if (points >= 500)
        return 'Gold';
    if (points >= 100)
        return 'Silver';
    return 'Bronze';
}
//# sourceMappingURL=passport.dto.js.map