"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const role_entity_1 = require("../users/entities/role.entity");
const user_role_entity_1 = require("../users/entities/user-role.entity");
const audit_log_entity_1 = require("../users/entities/audit-log.entity");
const session_entity_1 = require("../users/entities/session.entity");
const admin_action_entity_1 = require("../users/entities/admin-action.entity");
let AdminService = class AdminService {
    constructor(usersRepository, rolesRepository, userRolesRepository, auditLogRepository, sessionsRepository, adminActionsRepository) {
        this.usersRepository = usersRepository;
        this.rolesRepository = rolesRepository;
        this.userRolesRepository = userRolesRepository;
        this.auditLogRepository = auditLogRepository;
        this.sessionsRepository = sessionsRepository;
        this.adminActionsRepository = adminActionsRepository;
    }
    async getUsers(params) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (params.search) {
            where.name = (0, typeorm_2.Like)(`%${params.search}%`);
        }
        if (params.status === 'active') {
            where.isActive = true;
            where.blockedAt = null;
        }
        else if (params.status === 'inactive') {
            where.isActive = false;
        }
        else if (params.status === 'blocked') {
            where.blockedAt = (0, typeorm_2.MoreThan)(new Date(0));
        }
        const [users, total] = await this.usersRepository.findAndCount({
            where,
            take: limit,
            skip,
            order: { [params.sort || 'createdAt']: params.order || 'DESC' },
        });
        return {
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getUserDetails(userId) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            return null;
        }
        const userRoles = await this.userRolesRepository.find({
            where: { userId },
            relations: ['role'],
        });
        const sessions = await this.sessionsRepository.find({
            where: { userId, isActive: true },
            order: { createdAt: 'DESC' },
            take: 5,
        });
        const recentActions = await this.auditLogRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 10,
        });
        return {
            ...user,
            roles: userRoles.map((ur) => ur.role),
            sessions,
            recentActions,
        };
    }
    async updateUser(userId, data) {
        await this.usersRepository.update(userId, data);
        return this.usersRepository.findOne({ where: { id: userId } });
    }
    async assignRolesToUser(userId, roleIds, adminId) {
        await this.userRolesRepository.delete({ userId });
        const userRoles = roleIds.map((roleId) => ({
            userId,
            roleId,
            assignedBy: adminId,
        }));
        await this.userRolesRepository.save(userRoles);
        await this.logAdminAction({
            adminId,
            actionType: 'role.assign',
            targetUserId: userId,
            metadata: { roleIds },
        });
        return this.getUserDetails(userId);
    }
    async blockUser(userId, reason, adminId) {
        await this.usersRepository.update(userId, {
            blockedAt: new Date(),
            blockedReason: reason,
            isActive: false,
        });
        await this.logAdminAction({
            adminId,
            actionType: 'user.block',
            targetUserId: userId,
            reason,
        });
        return this.usersRepository.findOne({ where: { id: userId } });
    }
    async unblockUser(userId, adminId) {
        await this.usersRepository.update(userId, {
            blockedAt: null,
            blockedReason: null,
            isActive: true,
        });
        await this.logAdminAction({
            adminId,
            actionType: 'user.unblock',
            targetUserId: userId,
        });
        return this.usersRepository.findOne({ where: { id: userId } });
    }
    async deleteUser(userId, adminId) {
        await this.usersRepository.softDelete(userId);
        await this.logAdminAction({
            adminId,
            actionType: 'user.delete',
            targetUserId: userId,
        });
        return { success: true };
    }
    async getRoles() {
        return this.rolesRepository.find({
            order: { name: 'ASC' },
        });
    }
    async createRole(data) {
        return this.rolesRepository.save(data);
    }
    async updateRole(roleId, data) {
        await this.rolesRepository.update(roleId, data);
        return this.rolesRepository.findOne({ where: { id: roleId } });
    }
    async deleteRole(roleId) {
        const role = await this.rolesRepository.findOne({ where: { id: roleId } });
        if (role?.isSystem) {
            throw new Error('Cannot delete system role');
        }
        await this.rolesRepository.delete(roleId);
        return { success: true };
    }
    async getAuditLogs(params) {
        const page = params.page || 1;
        const limit = params.limit || 50;
        const skip = (page - 1) * limit;
        const where = {};
        if (params.userId) {
            where.userId = params.userId;
        }
        if (params.action) {
            where.action = params.action;
        }
        const [logs, total] = await this.auditLogRepository.findAndCount({
            where,
            relations: ['user'],
            take: limit,
            skip,
            order: { createdAt: 'DESC' },
        });
        return {
            data: logs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getStats() {
        const totalUsers = await this.usersRepository.count();
        const activeUsers = await this.usersRepository.count({ where: { isActive: true } });
        const blockedUsers = await this.usersRepository.count({ where: { blockedAt: (0, typeorm_2.MoreThan)(new Date(0)) } });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newToday = await this.usersRepository.count({
            where: { createdAt: (0, typeorm_2.MoreThan)(today) },
        });
        const activeSessions = await this.sessionsRepository.count({
            where: { isActive: true, expiresAt: (0, typeorm_2.MoreThan)(new Date()) },
        });
        return {
            users: {
                total: totalUsers,
                active: activeUsers,
                blocked: blockedUsers,
                newToday,
            },
            sessions: {
                active: activeSessions,
            },
        };
    }
    async logAdminAction(data) {
        return this.adminActionsRepository.save(data);
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.RoleEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRoleEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLogEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(session_entity_1.SessionEntity)),
    __param(5, (0, typeorm_1.InjectRepository)(admin_action_entity_1.AdminActionEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map