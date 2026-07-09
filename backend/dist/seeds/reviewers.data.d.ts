export interface ReviewerSeed {
    fullName: string;
    handle: string;
    country: string;
    bio: string;
    plan: 'free' | 'premium' | 'business';
    avatarIdx: number;
}
export declare const reviewers: ReviewerSeed[];
export declare function reviewerEmail(handle: string): string;
export declare const REVIEWER_DOMAIN = "@travelers.etunisia.tn";
type Sentiment = {
    pos: string[];
    mid: string[];
    neg: string[];
};
export declare const reviewSnippets: Record<'historical' | 'nature' | 'food' | 'artisan' | 'generic', Sentiment>;
export declare const reviewClosers: string[];
export {};
