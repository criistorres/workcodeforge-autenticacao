import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { OidcModule } from '../oidc/oidc.module';
import { UserRoleEntity } from '../users/entities/user-role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserRoleEntity]),
    UsersModule,
    OidcModule
  ],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
