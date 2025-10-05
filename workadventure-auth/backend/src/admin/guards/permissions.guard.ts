import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEntity } from '../../users/entities/role.entity';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // Sem permissões requeridas
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      throw new ForbiddenException('No roles found');
    }

    const userPermissions = this.extractPermissions(user.roles);

    // Verificar se tem wildcard (*)
    if (userPermissions.includes('*')) {
      return true;
    }

    // Verificar cada permissão requerida
    const hasPermission = requiredPermissions.every((permission) => {
      // Verificar permissão exata
      if (userPermissions.includes(permission)) {
        return true;
      }

      // Verificar wildcard de módulo (ex: users.* para users.view)
      const [module] = permission.split('.');
      if (userPermissions.includes(`${module}.*`)) {
        return true;
      }

      return false;
    });

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  private extractPermissions(roles: RoleEntity[]): string[] {
    const permissions = new Set<string>();

    roles.forEach((role) => {
      if (role.permissions) {
        role.permissions.forEach((perm) => permissions.add(perm));
      }
    });

    return Array.from(permissions);
  }
}
