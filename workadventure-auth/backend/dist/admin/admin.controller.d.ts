import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getUsers(page?: string, limit?: string, search?: string, role?: string, status?: string, sort?: string, order?: 'ASC' | 'DESC'): Promise<{
        data: import("../users/entities/user.entity").UserEntity[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getUserDetails(id: string): Promise<{
        roles: import("../users/entities/role.entity").RoleEntity[];
        sessions: import("../users/entities/session.entity").SessionEntity[];
        recentActions: import("../users/entities/audit-log.entity").AuditLogEntity[];
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
        auditLogs: import("../users/entities/audit-log.entity").AuditLogEntity[];
    }>;
    updateUser(id: string, data: {
        name?: string;
        email?: string;
        isActive?: boolean;
    }): Promise<import("../users/entities/user.entity").UserEntity>;
    assignRoles(id: string, data: {
        roleIds: string[];
    }, req: any): Promise<{
        roles: import("../users/entities/role.entity").RoleEntity[];
        sessions: import("../users/entities/session.entity").SessionEntity[];
        recentActions: import("../users/entities/audit-log.entity").AuditLogEntity[];
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
        auditLogs: import("../users/entities/audit-log.entity").AuditLogEntity[];
    }>;
    blockUser(id: string, data: {
        blocked: boolean;
        reason?: string;
    }, req: any): Promise<import("../users/entities/user.entity").UserEntity>;
    deleteUser(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getRoles(): Promise<import("../users/entities/role.entity").RoleEntity[]>;
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
    } & import("../users/entities/role.entity").RoleEntity>;
    updateRole(id: string, data: any): Promise<import("../users/entities/role.entity").RoleEntity>;
    deleteRole(id: string): Promise<{
        success: boolean;
    }>;
    getAuditLogs(page?: string, limit?: string, userId?: string, action?: string): Promise<{
        data: import("../users/entities/audit-log.entity").AuditLogEntity[];
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
}
