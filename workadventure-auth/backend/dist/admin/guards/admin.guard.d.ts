import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserRoleEntity } from '../../users/entities/user-role.entity';
import { RoleEntity } from '../../users/entities/role.entity';
export declare class AdminGuard implements CanActivate {
    private userRolesRepository;
    private rolesRepository;
    constructor(userRolesRepository: Repository<UserRoleEntity>, rolesRepository: Repository<RoleEntity>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
