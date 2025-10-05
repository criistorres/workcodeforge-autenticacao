import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRoleEntity } from '../../users/entities/user-role.entity';
import { RoleEntity } from '../../users/entities/role.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectRepository(UserRoleEntity)
    private userRolesRepository: Repository<UserRoleEntity>,
    @InjectRepository(RoleEntity)
    private rolesRepository: Repository<RoleEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id']; // ou extrair de JWT

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Buscar roles do usuário
    const userRoles = await this.userRolesRepository.find({
      where: { userId },
      relations: ['role'],
    });

    if (!userRoles || userRoles.length === 0) {
      throw new UnauthorizedException('User has no roles');
    }

    // Verificar se tem role admin ou super_admin
    const hasAdminRole = userRoles.some(
      (ur) => ur.role.name === 'admin' || ur.role.name === 'super_admin',
    );

    if (!hasAdminRole) {
      throw new UnauthorizedException('Admin access required');
    }

    // Adicionar roles ao request para uso posterior
    request.user = {
      id: userId,
      roles: userRoles.map((ur) => ur.role),
    };

    return true;
  }
}
