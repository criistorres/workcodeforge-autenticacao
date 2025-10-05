"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminGuard = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_role_entity_1 = require("../../users/entities/user-role.entity");
const role_entity_1 = require("../../users/entities/role.entity");
let AdminGuard = class AdminGuard {
    constructor(userRolesRepository, rolesRepository) {
        this.userRolesRepository = userRolesRepository;
        this.rolesRepository = rolesRepository;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const userId = request.headers['x-user-id'];
        if (!userId) {
            throw new common_1.UnauthorizedException('User not authenticated');
        }
        const userRoles = await this.userRolesRepository.find({
            where: { userId },
            relations: ['role'],
        });
        if (!userRoles || userRoles.length === 0) {
            throw new common_1.UnauthorizedException('User has no roles');
        }
        const hasAdminRole = userRoles.some((ur) => ur.role.name === 'admin' || ur.role.name === 'super_admin');
        if (!hasAdminRole) {
            throw new common_1.UnauthorizedException('Admin access required');
        }
        request.user = {
            id: userId,
            roles: userRoles.map((ur) => ur.role),
        };
        return true;
    }
};
exports.AdminGuard = AdminGuard;
exports.AdminGuard = AdminGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRoleEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.RoleEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AdminGuard);
//# sourceMappingURL=admin.guard.js.map