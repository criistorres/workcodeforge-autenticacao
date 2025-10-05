import { UserEntity } from './user.entity';
import { RoleEntity } from './role.entity';
export declare class UserRoleEntity {
    id: string;
    userId: string;
    user: UserEntity;
    roleId: string;
    role: RoleEntity;
    assignedBy: string;
    assignedAt: Date;
    expiresAt: Date;
}
