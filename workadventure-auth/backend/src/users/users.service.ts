import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(AuditLogEntity)
    private auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  // Seeds agora são gerenciados pelo SeedsService em database/seeds.service.ts

  async findByEmail(email: string): Promise<UserEntity | null> {
    console.log(`[FIND BY EMAIL] Procurando email: "${email}"`);
    const user = await this.usersRepository.findOne({ where: { email } });
    console.log(`[FIND BY EMAIL] Usuário encontrado?`, user ? `SIM (ID: ${user.id})` : 'NÃO');
    return user;
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(userData: Partial<UserEntity>): Promise<UserEntity> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = this.usersRepository.create({
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      username: userData.username || userData.email.split('@')[0],
      tags: userData.tags || ['member'],
    });

    const savedUser = await this.usersRepository.save(user);

    // Log de auditoria
    await this.createAuditLog(savedUser.id, 'register', null, {
      email: savedUser.email,
      name: savedUser.name,
    });

    return savedUser;
  }

  async validatePassword(user: UserEntity, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async getAllUsers(): Promise<UserEntity[]> {
    return this.usersRepository.find({
      select: ['id', 'email', 'name', 'username', 'tags', 'createdAt', 'lastLogin'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateTags(userId: string, tags: string[]): Promise<UserEntity | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    const oldTags = [...user.tags];
    user.tags = tags;
    const updated = await this.usersRepository.save(user);

    // Log de auditoria
    await this.createAuditLog(userId, 'update_tags', userId, {
      oldTags,
      newTags: tags,
    });

    return updated;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      lastLogin: new Date(),
    });
  }

  async deleteUser(userId: string): Promise<boolean> {
    const result = await this.usersRepository.delete(userId);
    if (result.affected > 0) {
      await this.createAuditLog(userId, 'delete', userId, {});
      return true;
    }
    return false;
  }

  async updateProfile(userId: string, data: Partial<UserEntity>): Promise<UserEntity | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    const oldData = { ...user };

    // Verificar se CPF já existe (se foi fornecido e é diferente do atual)
    if (data.cpf && data.cpf !== user.cpf) {
      const existingCpf = await this.usersRepository.findOne({
        where: { cpf: data.cpf }
      });
      if (existingCpf && existingCpf.id !== userId) {
        throw new Error('CPF já cadastrado');
      }
    }

    // Verificar se email já existe (se foi fornecido e é diferente do atual)
    if (data.email && data.email !== user.email) {
      const existingEmail = await this.usersRepository.findOne({
        where: { email: data.email }
      });
      if (existingEmail && existingEmail.id !== userId) {
        throw new Error('Email já cadastrado');
      }
    }

    // Verificar se username já existe (se foi fornecido e é diferente do atual)
    if (data.username && data.username !== user.username) {
      const existingUsername = await this.usersRepository.findOne({
        where: { username: data.username }
      });
      if (existingUsername && existingUsername.id !== userId) {
        throw new Error('Username já cadastrado');
      }
    }

    // Atualizar apenas os campos fornecidos
    if (data.name !== undefined) user.name = data.name;
    if (data.email !== undefined) user.email = data.email;
    if (data.username !== undefined) user.username = data.username;
    if (data.telefone !== undefined) user.telefone = data.telefone;
    if (data.cpf !== undefined) user.cpf = data.cpf;
    if (data.departamento !== undefined) user.departamento = data.departamento;

    const updated = await this.usersRepository.save(user);

    // Log de auditoria
    await this.createAuditLog(userId, 'update_profile', userId, {
      oldData: {
        name: oldData.name,
        email: oldData.email,
        username: oldData.username,
        telefone: oldData.telefone,
        cpf: oldData.cpf,
        departamento: oldData.departamento,
      },
      newData: {
        name: updated.name,
        email: updated.email,
        username: updated.username,
        telefone: updated.telefone,
        cpf: updated.cpf,
        departamento: updated.departamento,
      },
    });

    return updated;
  }

  async createAuditLog(
    userId: string,
    action: string,
    targetId: string | null,
    metadata: any,
  ): Promise<AuditLogEntity> {
    const log = this.auditLogRepository.create({
      userId,
      action,
      targetId,
      metadata,
    });
    return this.auditLogRepository.save(log);
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLogEntity[]> {
    return this.auditLogRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUserStats(): Promise<any> {
    const total = await this.usersRepository.count();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newToday = await this.usersRepository.count({
      where: {
        createdAt: { $gte: today } as any,
      },
    });

    return {
      total,
      newToday,
      // Podemos adicionar mais stats depois (online, etc)
    };
  }
}
