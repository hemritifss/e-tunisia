export declare enum ReportTargetType {
    POST = "post",
    COMMENT = "comment",
    USER = "user",
    MESSAGE = "message",
    REVIEW = "review",
    PLACE = "place"
}
export declare enum ReportReason {
    SPAM = "spam",
    HARASSMENT = "harassment",
    HATE = "hate_speech",
    NUDITY = "nudity",
    VIOLENCE = "violence",
    MISINFO = "misinformation",
    SCAM = "scam",
    OTHER = "other"
}
export declare enum ReportStatus {
    OPEN = "open",
    REVIEWED = "reviewed",
    ACTIONED = "actioned",
    DISMISSED = "dismissed"
}
export declare class Report {
    id: string;
    reporterId: string;
    targetType: ReportTargetType;
    targetId: string;
    targetOwnerId: string;
    reason: ReportReason;
    details: string;
    status: ReportStatus;
    resolvedBy: string;
    resolvedAt: Date;
    createdAt: Date;
}
