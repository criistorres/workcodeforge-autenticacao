import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OidcController } from './oidc.controller';
import { OidcService } from './oidc.service';
import { UsersModule } from '../users/users.module';
import { SessionEntity } from '../users/entities/session.entity';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([SessionEntity]),
    UsersModule
  ],
  controllers: [OidcController],
  providers: [OidcService],
  exports: [OidcService]
})
export class OidcModule {}
