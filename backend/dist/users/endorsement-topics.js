"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENDORSEMENT_TOPICS = void 0;
exports.isValidTopic = isValidTopic;
exports.ENDORSEMENT_TOPICS = [
    { id: 'medina-tours', label: 'Medina tours', emoji: '🕌' },
    { id: 'desert-trips', label: 'Desert trips', emoji: '🐪' },
    { id: 'beach-spots', label: 'Beach spots', emoji: '🏖' },
    { id: 'food-culture', label: 'Food & culture', emoji: '🍲' },
    { id: 'street-photography', label: 'Street photography', emoji: '📸' },
    { id: 'nightlife', label: 'Nightlife', emoji: '🌙' },
    { id: 'family-friendly', label: 'Family-friendly', emoji: '👨‍👩‍👧' },
    { id: 'budget-travel', label: 'Budget travel', emoji: '💰' },
    { id: 'luxury-stays', label: 'Luxury stays', emoji: '✨' },
    { id: 'local-history', label: 'Local history', emoji: '📜' },
    { id: 'craft-shopping', label: 'Craft & shopping', emoji: '🛍' },
    { id: 'hidden-gems', label: 'Hidden gems', emoji: '💎' },
];
const ID_SET = new Set(exports.ENDORSEMENT_TOPICS.map((t) => t.id));
function isValidTopic(id) {
    return typeof id === 'string' && ID_SET.has(id);
}
//# sourceMappingURL=endorsement-topics.js.map