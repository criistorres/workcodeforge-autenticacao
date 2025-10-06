import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserEntity } from './entities/user.entity';
import { SessionEntity } from './entities/session.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { RoleEntity } from './entities/role.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { PasswordResetEntity } from './entities/password-reset.entity';
import { LoginAttemptEntity } from './entities/login-attempt.entity';
import { AdminActionEntity } from './entities/admin-action.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      SessionEntity,
      AuditLogEntity,
      RoleEntity,
      UserRoleEntity,
      PasswordResetEntity,
      LoginAttemptEntity,
      AdminActionEntity
    ])
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule]
})
export class UsersModule {}
