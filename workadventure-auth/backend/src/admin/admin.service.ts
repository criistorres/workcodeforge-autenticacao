import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, MoreThan } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { RoleEntity } from '../users/entities/role.entity';
import { UserRoleEntity } from '../users/entities/user-role.entity';
import { AuditLogEntity } from '../users/entities/audit-log.entity';
import { SessionEntity } from '../users/entities/session.entity';
import { AdminActionEntity } from '../users/entities/admin-action.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private rolesRepository: Repository<RoleEntity>,
    @InjectRepository(UserRoleEntity)
    private userRolesRepository: Repository<UserRoleEntity>,
    @InjectRepository(AuditLogEntity)
    private auditLogRepository: Repository<AuditLogEntity>,
    @InjectRepository(SessionEntity)
    private sessionsRepository: Repository<SessionEntity>,
    @InjectRepository(AdminActionEntity)
    private adminActionsRepository: Repository<AdminActionEntity>,
  ) {}

  // ============ USERS ============

  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sort?: string;
    order?: 'ASC' | 'DESC';
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      where.name = Like(`%${params.search}%`);
    }

    if (params.status === 'active') {
      where.isActive = true;
      where.blockedAt = null;
    } else if (params.status === 'inactive') {
      where.isActive = false;
    } else if (params.status === 'blocked') {
      where.blockedAt = MoreThan(new Date(0));
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

  async getUserDetails(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    // Buscar roles do usuário
    const userRoles = await this.userRolesRepository.find({
      where: { userId },
      relations: ['role'],
    });

    // Buscar sessões ativas
    const sessions = await this.sessionsRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // Buscar ações recentes
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

  async updateUser(userId: string, data: { name?: string; email?: string; isActive?: boolean }) {
    await this.usersRepository.update(userId, data);
    return this.usersRepository.findOne({ where: { id: userId } });
  }

  async assignRolesToUser(userId: string, roleIds: string[], adminId: string) {
    // Remover roles anteriores
    await this.userRolesRepository.delete({ userId });

    // Adicionar novas roles
    const userRoles = roleIds.map((roleId) => ({
      userId,
      roleId,
      assignedBy: adminId,
    }));

    await this.userRolesRepository.save(userRoles);

    // Log admin action
    await this.logAdminAction({
      adminId,
      actionType: 'role.assign',
      targetUserId: userId,
      metadata: { roleIds },
    });

    return this.getUserDetails(userId);
  }

  async blockUser(userId: string, reason: string, adminId: string) {
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

  async unblockUser(userId: string, adminId: string) {
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

  async deleteUser(userId: string, adminId: string) {
    await this.usersRepository.softDelete(userId);

    await this.logAdminAction({
      adminId,
      actionType: 'user.delete',
      targetUserId: userId,
    });

    return { success: true };
  }

  // ============ ROLES ============

  async getRoles() {
    return this.rolesRepository.find({
      order: { name: 'ASC' },
    });
  }

  async createRole(data: { name: string; displayName: string; description?: string; color?: string; permissions: string[] }) {
    return this.rolesRepository.save(data);
  }

  async updateRole(roleId: string, data: Partial<RoleEntity>) {
    await this.rolesRepository.update(roleId, data);
    return this.rolesRepository.findOne({ where: { id: roleId } });
  }

  async deleteRole(roleId: string) {
    const role = await this.rolesRepository.findOne({ where: { id: roleId } });

    if (role?.isSystem) {
      throw new Error('Cannot delete system role');
    }

    await this.rolesRepository.delete(roleId);
    return { success: true };
  }

  // ============ AUDIT LOGS ============

  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

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

  // ============ STATS ============

  async getStats() {
    const totalUsers = await this.usersRepository.count();
    const activeUsers = await this.usersRepository.count({ where: { isActive: true } });
    const blockedUsers = await this.usersRepository.count({ where: { blockedAt: MoreThan(new Date(0)) } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newToday = await this.usersRepository.count({
      where: { createdAt: MoreThan(today) },
    });

    const activeSessions = await this.sessionsRepository.count({
      where: { isActive: true, expiresAt: MoreThan(new Date()) },
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

  // ============ HELPERS ============

  private async logAdminAction(data: {
    adminId: string;
    actionType: string;
    targetUserId?: string;
    targetRoleId?: string;
    reason?: string;
    metadata?: any;
    ipAddress?: string;
  }) {
    return this.adminActionsRepository.save(data);
  }
}
