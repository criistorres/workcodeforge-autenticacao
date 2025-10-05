import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { UserEntity } from '../users/entities/user.entity';
import { RoleEntity } from '../users/entities/role.entity';
import { UserRoleEntity } from '../users/entities/user-role.entity';
import { AuditLogEntity } from '../users/entities/audit-log.entity';
import { SessionEntity } from '../users/entities/session.entity';
import { AdminActionEntity } from '../users/entities/admin-action.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      RoleEntity,
      UserRoleEntity,
      AuditLogEntity,
      SessionEntity,
      AdminActionEntity,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard, PermissionsGuard],
  exports: [AdminService],
})
export class AdminModule {}
