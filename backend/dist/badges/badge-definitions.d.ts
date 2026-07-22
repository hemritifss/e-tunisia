export type BadgeEvent = 'user.created' | 'place.visited' | 'trip.created' | 'review.created' | 'post.saved' | 'gem.submitted' | 'gem.approved';
export interface BadgeDefinition {
    id: string;
    label: string;
    description: string;
    points: number;
    eligible: (event: BadgeEvent, payload: any, currentBadges: string[]) => boolean;
}
export declare const BADGE_DEFINITIONS: BadgeDefinition[];
