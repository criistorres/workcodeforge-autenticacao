"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const seeds_service_1 = require("./seeds.service");
const role_entity_1 = require("../users/entities/role.entity");
const user_entity_1 = require("../users/entities/user.entity");
const user_role_entity_1 = require("../users/entities/user-role.entity");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DATABASE_HOST || 'localhost',
                port: parseInt(process.env.DATABASE_PORT) || 5432,
                username: process.env.DATABASE_USER || 'auth_user',
                password: process.env.DATABASE_PASSWORD || 'auth_password_dev_123',
                database: process.env.DATABASE_NAME || 'workadventure_auth',
                entities: [__dirname + '/../**/*.entity{.ts,.js}'],
                synchronize: true,
                logging: process.env.NODE_ENV !== 'production',
            }),
            typeorm_1.TypeOrmModule.forFeature([role_entity_1.RoleEntity, user_entity_1.UserEntity, user_role_entity_1.UserRoleEntity]),
        ],
        providers: [seeds_service_1.SeedsService],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map