import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../users/entities/role.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UserRoleEntity } from '../users/entities/user-role.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedsService implements OnModuleInit {
  constructor(
    @InjectRepository(RoleEntity)
    private rolesRepository: Repository<RoleEntity>,
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(UserRoleEntity)
    private userRolesRepository: Repository<UserRoleEntity>,
  ) {}

  async onModuleInit() {
    await this.seedRoles();
    await this.seedUsers();
  }

  private async seedRoles() {
    const count = await this.rolesRepository.count();
    if (count > 0) {
      console.log('[SEEDS] Roles já existem, pulando seed');
      return;
    }

    console.log('[SEEDS] Criando roles padrão...');

    const roles = [
      {
        name: 'super_admin',
        displayName: 'Super Administrador',
        description: 'Acesso total ao sistema',
        color: '#DC2626',
        permissions: ['*'], // todas permissões
        isSystem: true,
      },
      {
        name: 'admin',
        displayName: 'Administrador',
        description: 'Gerenciar usuários e sistema',
        color: '#EA580C',
        permissions: [
          'users.view',
          'users.view.details',
          'users.create',
          'users.edit',
          'users.delete',
          'users.block',
          'roles.view',
          'roles.assign',
          'audit.view',
          'sessions.view',
          'sessions.revoke',
        ],
        isSystem: true,
      },
      {
        name: 'moderator',
        displayName: 'Moderador',
        description: 'Moderar usuários e conteúdo',
        color: '#2563EB',
        permissions: [
          'users.view',
          'users.view.details',
          'users.edit',
          'users.block',
          'audit.view',
        ],
        isSystem: true,
      },
      {
        name: 'member',
        displayName: 'Membro',
        description: 'Usuário comum',
        color: '#059669',
        permissions: [],
        isSystem: true,
      },
    ];

    for (const roleData of roles) {
      await this.rolesRepository.save(roleData);
    }

    console.log('[SEEDS] ✓ Roles criadas com sucesso!');
  }

  private async seedUsers() {
    const count = await this.usersRepository.count();
    if (count > 0) {
      console.log('[SEEDS] Usuários já existem, pulando seed');
      return;
    }

    console.log('[SEEDS] Criando usuários de teste...');

    const hashedPwd = await bcrypt.hash('pwd', 10);
    const adminRole = await this.rolesRepository.findOne({ where: { name: 'admin' } });
    const memberRole = await this.rolesRepository.findOne({ where: { name: 'member' } });

    if (!adminRole || !memberRole) {
      console.error('[SEEDS] ❌ Roles não encontradas! Execute seedRoles primeiro.');
      return;
    }

    const users = [
      {
        email: 'admin@example.com',
        password: hashedPwd,
        name: 'Admin User',
        username: 'admin',
        tags: ['admin', 'moderator'],
        isActive: true,
        isEmailVerified: true,
        roleId: adminRole.id,
      },
      {
        email: 'user1@example.com',
        password: hashedPwd,
        name: 'User 1',
        username: 'user1',
        tags: ['admin', 'moderator'],
        isActive: true,
        isEmailVerified: true,
        roleId: adminRole.id,
      },
      {
        email: 'user2@example.com',
        password: hashedPwd,
        name: 'User 2',
        username: 'user2',
        tags: ['member'],
        isActive: true,
        isEmailVerified: true,
        roleId: memberRole.id,
      },
    ];

    for (const userData of users) {
      const { roleId, ...userFields } = userData;

      // Criar usuário sem ID fixo (deixar o banco gerar UUID)
      const user = await this.usersRepository.save(userFields);

      // Atribuir role ao usuário
      if (user && user.id) {
        await this.userRolesRepository.save({
          userId: user.id,
          roleId: roleId,
          assignedBy: user.id, // auto-atribuído
        });
      }
    }

    console.log('[SEEDS] ✓ Usuários de teste criados com sucesso!');
  }
}
