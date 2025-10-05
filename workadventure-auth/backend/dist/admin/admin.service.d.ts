import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { RoleEntity } from '../users/entities/role.entity';
import { UserRoleEntity } from '../users/entities/user-role.entity';
import { AuditLogEntity } from '../users/entities/audit-log.entity';
import { SessionEntity } from '../users/entities/session.entity';
import { AdminActionEntity } from '../users/entities/admin-action.entity';
export declare class AdminService {
    private usersRepository;
    private rolesRepository;
    private userRolesRepository;
    private auditLogRepository;
    private sessionsRepository;
    private adminActionsRepository;
    constructor(usersRepository: Repository<UserEntity>, rolesRepository: Repository<RoleEntity>, userRolesRepository: Repository<UserRoleEntity>, auditLogRepository: Repository<AuditLogEntity>, sessionsRepository: Repository<SessionEntity>, adminActionsRepository: Repository<AdminActionEntity>);
    getUsers(params: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        status?: string;
        sort?: string;
        order?: 'ASC' | 'DESC';
    }): Promise<{
        data: UserEntity[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getUserDetails(userId: string): Promise<{
        roles: RoleEntity[];
        sessions: SessionEntity[];
        recentActions: AuditLogEntity[];
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
        auditLogs: AuditLogEntity[];
    }>;
    updateUser(userId: string, data: {
        name?: string;
        email?: string;
        isActive?: boolean;
    }): Promise<UserEntity>;
    assignRolesToUser(userId: string, roleIds: string[], adminId: string): Promise<{
        roles: RoleEntity[];
        sessions: SessionEntity[];
        recentActions: AuditLogEntity[];
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
        auditLogs: AuditLogEntity[];
    }>;
    blockUser(userId: string, reason: string, adminId: string): Promise<UserEntity>;
    unblockUser(userId: string, adminId: string): Promise<UserEntity>;
    deleteUser(userId: string, adminId: string): Promise<{
        success: boolean;
    }>;
    getRoles(): Promise<RoleEntity[]>;
    createRole(data: {
        name: string;
        displayName: string;
        description?: string;
        color?: string;
        permissions: string[];
    }): Promise<{
        name: string;
        displayName: string;
        description?: string;
        color?: string;
        permissions: string[];
    } & RoleEntity>;
    updateRole(roleId: string, data: Partial<RoleEntity>): Promise<RoleEntity>;
    deleteRole(roleId: string): Promise<{
        success: boolean;
    }>;
    getAuditLogs(params: {
        page?: number;
        limit?: number;
        userId?: string;
        action?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        data: AuditLogEntity[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getStats(): Promise<{
        users: {
            total: number;
            active: number;
            blocked: number;
            newToday: number;
        };
        sessions: {
            active: number;
        };
    }>;
    private logAdminAction;
}
