export declare class AuditLog {
    id: string;
    actorId: string;
    actorName: string;
    actorEmail: string;
    action: string;
    targetType: string;
    targetId: string;
    summary: string;
    createdAt: Date;
}
