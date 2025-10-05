"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const role_entity_1 = require("../users/entities/role.entity");
const user_entity_1 = require("../users/entities/user.entity");
const user_role_entity_1 = require("../users/entities/user-role.entity");
const bcrypt = __importStar(require("bcrypt"));
let SeedsService = class SeedsService {
    constructor(rolesRepository, usersRepository, userRolesRepository) {
        this.rolesRepository = rolesRepository;
        this.usersRepository = usersRepository;
        this.userRolesRepository = userRolesRepository;
    }
    async onModuleInit() {
        await this.seedRoles();
        await this.seedUsers();
    }
    async seedRoles() {
        const count = await this.rolesRepository.count();
        if (count > 0) {
            console.log('[SEEDS] Roles já existem, pulando seed');
            return;
        }
        console.log('[SEEDS] Criando roles padrão...');
        const roles = [
            {
                name: 'super_admin',
                displayName: 'Super Administrador',
                description: 'Acesso total ao sistema',
                color: '#DC2626',
                permissions: ['*'],
                isSystem: true,
            },
            {
                name: 'admin',
                displayName: 'Administrador',
                description: 'Gerenciar usuários e sistema',
                color: '#EA580C',
                permissions: [
                    'users.view',
                    'users.view.details',
                    'users.create',
                    'users.edit',
                    'users.delete',
                    'users.block',
                    'roles.view',
                    'roles.assign',
                    'audit.view',
                    'sessions.view',
                    'sessions.revoke',
                ],
                isSystem: true,
            },
            {
                name: 'moderator',
                displayName: 'Moderador',
                description: 'Moderar usuários e conteúdo',
                color: '#2563EB',
                permissions: [
                    'users.view',
                    'users.view.details',
                    'users.edit',
                    'users.block',
                    'audit.view',
                ],
                isSystem: true,
            },
            {
                name: 'member',
                displayName: 'Membro',
                description: 'Usuário comum',
                color: '#059669',
                permissions: [],
                isSystem: true,
            },
        ];
        for (const roleData of roles) {
            await this.rolesRepository.save(roleData);
        }
        console.log('[SEEDS] ✓ Roles criadas com sucesso!');
    }
    async seedUsers() {
        const count = await this.usersRepository.count();
        if (count > 0) {
            console.log('[SEEDS] Usuários já existem, pulando seed');
            return;
        }
        console.log('[SEEDS] Criando usuários de teste...');
        const hashedPwd = await bcrypt.hash('pwd', 10);
        const adminRole = await this.rolesRepository.findOne({ where: { name: 'admin' } });
        const memberRole = await this.rolesRepository.findOne({ where: { name: 'member' } });
        if (!adminRole || !memberRole) {
            console.error('[SEEDS] ❌ Roles não encontradas! Execute seedRoles primeiro.');
            return;
        }
        const users = [
            {
                email: 'admin@example.com',
                password: hashedPwd,
                name: 'Admin User',
                username: 'admin',
                tags: ['admin', 'moderator'],
                isActive: true,
                isEmailVerified: true,
                roleId: adminRole.id,
            },
            {
                email: 'user1@example.com',
                password: hashedPwd,
                name: 'User 1',
                username: 'user1',
                tags: ['admin', 'moderator'],
                isActive: true,
                isEmailVerified: true,
                roleId: adminRole.id,
            },
            {
                email: 'user2@example.com',
                password: hashedPwd,
                name: 'User 2',
                username: 'user2',
                tags: ['member'],
                isActive: true,
                isEmailVerified: true,
                roleId: memberRole.id,
            },
        ];
        for (const userData of users) {
            const { roleId, ...userFields } = userData;
            const user = await this.usersRepository.save(userFields);
            if (user && user.id) {
                await this.userRolesRepository.save({
                    userId: user.id,
                    roleId: roleId,
                    assignedBy: user.id,
                });
            }
        }
        console.log('[SEEDS] ✓ Usuários de teste criados com sucesso!');
    }
};
exports.SeedsService = SeedsService;
exports.SeedsService = SeedsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(role_entity_1.RoleEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRoleEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SeedsService);
//# sourceMappingURL=seeds.service.js.map