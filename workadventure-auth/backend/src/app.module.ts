import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { OidcModule } from './oidc/oidc.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [DatabaseModule, AuthModule, OidcModule, UsersModule, AdminModule]
})
export class AppModule {}
