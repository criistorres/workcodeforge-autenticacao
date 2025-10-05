import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedsService } from './seeds.service';
import { RoleEntity } from '../users/entities/role.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UserRoleEntity } from '../users/entities/user-role.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      username: process.env.DATABASE_USER || 'auth_user',
      password: process.env.DATABASE_PASSWORD || 'auth_password_dev_123',
      database: process.env.DATABASE_NAME || 'workadventure_auth',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true, // AUTO-CREATE tables (apenas dev, desabilitar em prod)
      logging: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([RoleEntity, UserEntity, UserRoleEntity]),
  ],
  providers: [SeedsService],
})
export class DatabaseModule {}
