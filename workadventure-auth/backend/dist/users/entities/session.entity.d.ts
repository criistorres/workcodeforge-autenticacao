import { UserEntity } from './user.entity';
export declare class SessionEntity {
    id: string;
    userId: string;
    user: UserEntity;
    token: string;
    createdAt: Date;
    expiresAt: Date;
    ipAddress: string;
    userAgent: string;
    isActive: boolean;
    revokedAt: Date;
}
