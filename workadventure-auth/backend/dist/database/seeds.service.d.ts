import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { RoleEntity } from '../users/entities/role.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UserRoleEntity } from '../users/entities/user-role.entity';
export declare class SeedsService implements OnModuleInit {
    private rolesRepository;
    private usersRepository;
    private userRolesRepository;
    constructor(rolesRepository: Repository<RoleEntity>, usersRepository: Repository<UserEntity>, userRolesRepository: Repository<UserRoleEntity>);
    onModuleInit(): Promise<void>;
    private seedRoles;
    private seedUsers;
}
