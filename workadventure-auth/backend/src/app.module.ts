import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { OidcModule } from './oidc/oidc.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [AuthModule, OidcModule, UsersModule]
})
export class AppModule {}
