import { SessionEntity } from './session.entity';
import { AuditLogEntity } from './audit-log.entity';
export declare class UserEntity {
    id: string;
    email: string;
    password: string;
    name: string;
    username: string;
    tags: string[];
    avatarUrl: string;
    isActive: boolean;
    isEmailVerified: boolean;
    blockedAt: Date;
    blockedReason: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    lastLogin: Date;
    sessions: SessionEntity[];
    auditLogs: AuditLogEntity[];
}
