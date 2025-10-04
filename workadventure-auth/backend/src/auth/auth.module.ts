import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { OidcModule } from '../oidc/oidc.module';

@Module({
  imports: [UsersModule, OidcModule],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
