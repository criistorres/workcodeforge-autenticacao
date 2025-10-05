import { UserEntity } from './user.entity';
import { RoleEntity } from './role.entity';
export declare class AdminActionEntity {
    id: string;
    adminId: string;
    admin: UserEntity;
    actionType: string;
    targetUserId: string;
    targetUser: UserEntity;
    targetRoleId: string;
    targetRole: RoleEntity;
    reason: string;
    metadata: any;
    ipAddress: string;
    createdAt: Date;
}
