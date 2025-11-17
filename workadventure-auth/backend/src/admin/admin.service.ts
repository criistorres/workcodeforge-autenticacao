import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, MoreThan, In } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { RoleEntity } from '../users/entities/role.entity';
import { UserRoleEntity } from '../users/entities/user-role.entity';
import { AuditLogEntity } from '../users/entities/audit-log.entity';
import { SessionEntity } from '../users/entities/session.entity';
import { AdminActionEntity } from '../users/entities/admin-action.entity';
import { MapEntity } from '../users/entities/map.entity';
import * as bcrypt from 'bcrypt';

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
    @InjectRepository(MapEntity)
    private mapsRepository: Repository<MapEntity>,
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

  async createUser(
    data: {
      name: string;
      email: string;
      username: string;
      password: string;
      avatarUrl?: string;
      telefone?: string;
      cpf?: string;
      departamento?: string;
      isActive?: boolean;
      defaultMap?: string;
      roleIds: string[];
    },
    adminId: string,
  ) {
    // Verificar se email já existe
    const existingEmail = await this.usersRepository.findOne({
      where: { email: data.email },
    });
    if (existingEmail) {
      throw new Error('Email já está em uso');
    }

    // Verificar se username já existe
    const existingUsername = await this.usersRepository.findOne({
      where: { username: data.username },
    });
    if (existingUsername) {
      throw new Error('Username já está em uso');
    }

    // Verificar se CPF já existe (se fornecido)
    if (data.cpf && data.cpf.trim() !== '') {
      const existingCpf = await this.usersRepository.findOne({
        where: { cpf: data.cpf },
      });
      if (existingCpf) {
        throw new Error('CPF já está em uso');
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Buscar nomes das roles
    const roles = await this.rolesRepository.find({
      where: { id: In(data.roleIds) },
    });
    const tags = roles.map((role) => role.name);

    // Converter strings vazias em null
    const cleanedData: any = {
      name: data.name,
      email: data.email,
      username: data.username,
      password: hashedPassword,
      tags,
      isActive: data.isActive ?? true,
      isEmailVerified: false,
    };

    if (data.avatarUrl && data.avatarUrl.trim() !== '') {
      cleanedData.avatarUrl = data.avatarUrl;
    }
    if (data.telefone && data.telefone.trim() !== '') {
      cleanedData.telefone = data.telefone;
    }
    if (data.cpf && data.cpf.trim() !== '') {
      cleanedData.cpf = data.cpf;
    }
    if (data.departamento && data.departamento.trim() !== '') {
      cleanedData.departamento = data.departamento;
    }
    if (data.defaultMap && data.defaultMap.trim() !== '') {
      cleanedData.defaultMap = data.defaultMap;
    }

    // Criar usuário
    const user = await this.usersRepository.save(cleanedData);

    // Atribuir roles
    if (data.roleIds && data.roleIds.length > 0) {
      const userRoles = data.roleIds.map((roleId) => ({
        userId: user.id,
        roleId,
        assignedBy: adminId,
      }));
      await this.userRolesRepository.save(userRoles);
    }

    // Log admin action
    await this.logAdminAction({
      adminId,
      actionType: 'user.create',
      targetUserId: user.id,
      metadata: { roleIds: data.roleIds, tags },
    });

    return this.getUserDetails(user.id);
  }

  async updateUser(
    userId: string,
    data: {
      name?: string;
      email?: string;
      username?: string;
      avatarUrl?: string;
      telefone?: string;
      cpf?: string;
      departamento?: string;
      isActive?: boolean;
      defaultMap?: string;
    },
  ) {
    // Verificar se email já existe em outro usuário
    if (data.email) {
      const existingEmail = await this.usersRepository.findOne({
        where: { email: data.email },
      });
      if (existingEmail && existingEmail.id !== userId) {
        throw new Error('Email já está em uso');
      }
    }

    // Verificar se username já existe em outro usuário
    if (data.username) {
      const existingUsername = await this.usersRepository.findOne({
        where: { username: data.username },
      });
      if (existingUsername && existingUsername.id !== userId) {
        throw new Error('Username já está em uso');
      }
    }

    // Verificar se CPF já existe em outro usuário (se não for vazio)
    if (data.cpf && data.cpf.trim() !== '') {
      const existingCpf = await this.usersRepository.findOne({
        where: { cpf: data.cpf },
      });
      if (existingCpf && existingCpf.id !== userId) {
        throw new Error('CPF já está em uso');
      }
    }

    // Converter strings vazias em null para campos nullable com constraint única
    const cleanedData = { ...data };
    if (cleanedData.cpf === '' || cleanedData.cpf?.trim() === '') {
      cleanedData.cpf = null;
    }
    if (cleanedData.telefone === '' || cleanedData.telefone?.trim() === '') {
      cleanedData.telefone = null;
    }
    if (cleanedData.departamento === '' || cleanedData.departamento?.trim() === '') {
      cleanedData.departamento = null;
    }
    if (cleanedData.avatarUrl === '' || cleanedData.avatarUrl?.trim() === '') {
      cleanedData.avatarUrl = null;
    }

    await this.usersRepository.update(userId, cleanedData);
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

    // Buscar os nomes das roles para atualizar as tags do usuário
    const roles = await this.rolesRepository.find({
      where: { id: In(roleIds) }
    });
    const tags = roles.map(role => role.name);

    // Atualizar o campo tags do usuário com os nomes das roles
    await this.usersRepository.update(userId, { tags });

    console.log(`[ADMIN] Tags atualizadas para usuário ${userId}:`, tags);

    // Log admin action
    await this.logAdminAction({
      adminId,
      actionType: 'role.assign',
      targetUserId: userId,
      metadata: { roleIds, tags },
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

  // ============ MAPS ============

  async getMaps() {
    return this.mapsRepository.find({
      order: { displayName: 'ASC' },
    });
  }

  async createMap(data: {
    name: string;
    displayName: string;
    description?: string;
    mapUrl?: string;
    isActive?: boolean;
  }) {
    return this.mapsRepository.save(data);
  }

  async updateMap(mapId: string, data: Partial<MapEntity>) {
    await this.mapsRepository.update(mapId, data);
    return this.mapsRepository.findOne({ where: { id: mapId } });
  }

  async deleteMap(mapId: string) {
    await this.mapsRepository.delete(mapId);
    return { success: true };
  }

  // ============ HELPERS ============

  async createAuditLog(
    userId: string,
    action: string,
    targetId?: string,
    metadata?: any,
  ) {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      targetId,
      metadata,
    });

    return this.auditLogRepository.save(auditLog);
  }

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
