import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OidcController } from './oidc.controller';
import { OidcService } from './oidc.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    JwtModule.register({}),
    UsersModule
  ],
  controllers: [OidcController],
  providers: [OidcService],
  exports: [OidcService]
})
export class OidcModule {}
