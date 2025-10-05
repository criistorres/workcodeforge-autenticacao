"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const users_service_1 = require("./users.service");
const user_entity_1 = require("./entities/user.entity");
const session_entity_1 = require("./entities/session.entity");
const audit_log_entity_1 = require("./entities/audit-log.entity");
const role_entity_1 = require("./entities/role.entity");
const user_role_entity_1 = require("./entities/user-role.entity");
const password_reset_entity_1 = require("./entities/password-reset.entity");
const login_attempt_entity_1 = require("./entities/login-attempt.entity");
const admin_action_entity_1 = require("./entities/admin-action.entity");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.UserEntity,
                session_entity_1.SessionEntity,
                audit_log_entity_1.AuditLogEntity,
                role_entity_1.RoleEntity,
                user_role_entity_1.UserRoleEntity,
                password_reset_entity_1.PasswordResetEntity,
                login_attempt_entity_1.LoginAttemptEntity,
                admin_action_entity_1.AdminActionEntity
            ])
        ],
        providers: [users_service_1.UsersService],
        exports: [users_service_1.UsersService, typeorm_1.TypeOrmModule]
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map