import { UserEntity } from './user.entity';
export declare class AuditLogEntity {
    id: string;
    userId: string;
    user: UserEntity;
    action: string;
    targetId: string;
    targetType: string;
    ipAddress: string;
    userAgent: string;
    metadata: any;
    createdAt: Date;
}
