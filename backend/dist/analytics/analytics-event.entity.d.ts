export declare class AnalyticsEvent {
    id: string;
    name: string;
    userId: string | null;
    anonId: string | null;
    props: Record<string, unknown> | null;
    createdAt: Date;
}
