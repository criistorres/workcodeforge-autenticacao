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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const oidc_service_1 = require("../oidc/oidc.service");
let AuthService = class AuthService {
    constructor(usersService, oidcService) {
        this.usersService = usersService;
        this.oidcService = oidcService;
    }
    async login(loginDto) {
        const user = await this.usersService.findByEmail(loginDto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await this.usersService.validatePassword(user, loginDto.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return {
            userId: user.id,
            email: user.email,
            name: user.name,
            tags: user.tags
        };
    }
    async register(registerDto) {
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new common_1.UnauthorizedException('User already exists');
        }
        const user = await this.usersService.create(registerDto);
        return {
            userId: user.id,
            email: user.email,
            name: user.name,
            tags: user.tags
        };
    }
    async authorize(userId, authParams) {
        const code = await this.oidcService.generateAuthorizationCode({
            userId,
            clientId: authParams.clientId,
            redirectUri: authParams.redirectUri,
            scope: authParams.scope,
            state: authParams.state,
            nonce: authParams.nonce
        });
        return { code };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        oidc_service_1.OidcService])
], AuthService);
//# sourceMappingURL=auth.service.js.map