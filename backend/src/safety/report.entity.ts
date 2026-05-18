import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, Index,
} from 'typeorm';

export enum ReportTargetType {
    POST = 'post',
    COMMENT = 'comment',
    USER = 'user',
    MESSAGE = 'message',
    REVIEW = 'review',
    PLACE = 'place',
}

export enum ReportReason {
    SPAM = 'spam',
    HARASSMENT = 'harassment',
    HATE = 'hate_speech',
    NUDITY = 'nudity',
    VIOLENCE = 'violence',
    MISINFO = 'misinformation',
    SCAM = 'scam',
    OTHER = 'other',
}

export enum ReportStatus {
    OPEN = 'open',
    REVIEWED = 'reviewed',
    ACTIONED = 'actioned',
    DISMISSED = 'dismissed',
}

@Entity('reports')
export class Report {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    reporterId: string;

    @Column({ type: 'simple-enum', enum: ReportTargetType })
    @Index()
    targetType: ReportTargetType;

    @Column()
    @Index()
    targetId: string;

    /** Who owns/authored the target (denormalized for moderation triage). */
    @Column({ nullable: true })
    @Index()
    targetOwnerId: string;

    @Column({ type: 'simple-enum', enum: ReportReason, default: ReportReason.OTHER })
    reason: ReportReason;

    @Column({ length: 600, nullable: true })
    details: string;

    @Column({ type: 'simple-enum', enum: ReportStatus, default: ReportStatus.OPEN })
    status: ReportStatus;

    @Column({ nullable: true })
    resolvedBy: string;

    @Column({ nullable: true })
    resolvedAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}
