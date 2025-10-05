import { UserEntity } from './user.entity';
export declare class PasswordResetEntity {
    id: string;
    userId: string;
    user: UserEntity;
    token: string;
    expiresAt: Date;
    usedAt: Date;
    ipAddress: string;
    createdAt: Date;
}
