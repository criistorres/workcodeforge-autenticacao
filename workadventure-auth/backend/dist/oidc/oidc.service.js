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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OidcService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
const users_service_1 = require("../users/users.service");
let OidcService = class OidcService {
    constructor(jwtService, usersService) {
        this.jwtService = jwtService;
        this.usersService = usersService;
        this.authorizationCodes = new Map();
        this.privateKey = fs.readFileSync('keys/private.key', 'utf8');
        this.publicKey = fs.readFileSync('keys/public.key', 'utf8');
    }
    async getPublicKeys() {
        const keyObject = crypto.createPublicKey(this.publicKey);
        const jwk = keyObject.export({ format: 'jwk' });
        return {
            keys: [
                {
                    ...jwk,
                    kid: 'key-1',
                    use: 'sig',
                    alg: 'RS256'
                }
            ]
        };
    }
    async generateAuthorizationCode(data) {
        const code = crypto.randomBytes(32).toString('hex');
        this.authorizationCodes.set(code, {
            ...data,
            expiresAt: Date.now() + 600000
        });
        return code;
    }
    async validateAuthorizationCode(code) {
        const data = this.authorizationCodes.get(code);
        if (!data || data.expiresAt < Date.now()) {
            return null;
        }
        this.authorizationCodes.delete(code);
        return data;
    }
    async generateTokens(authData) {
        const user = await this.usersService.findById(authData.userId);
        if (!user) {
            throw new Error('User not found');
        }
        const now = Math.floor(Date.now() / 1000);
        const idTokenPayload = {
            iss: process.env.ISSUER_URL,
            sub: user.id,
            aud: authData.clientId,
            exp: now + 3600,
            iat: now,
            email: user.email,
            email_verified: true,
            name: user.name,
            preferred_username: user.username,
            tags: user.tags
        };
        if (authData.nonce && authData.nonce !== 'undefined') {
            idTokenPayload.nonce = authData.nonce;
        }
        const idToken = this.jwtService.sign(idTokenPayload, {
            algorithm: 'RS256',
            privateKey: this.privateKey,
            header: { kid: 'key-1', alg: 'RS256', typ: 'JWT' }
        });
        const accessTokenPayload = {
            sub: user.id,
            scope: authData.scope,
            exp: now + 3600,
            iat: now
        };
        const accessToken = this.jwtService.sign(accessTokenPayload, {
            algorithm: 'RS256',
            privateKey: this.privateKey,
            header: { kid: 'key-1', alg: 'RS256', typ: 'JWT' }
        });
        return { idToken, accessToken };
    }
    async validateAccessToken(token) {
        try {
            const decoded = this.jwtService.verify(token, {
                publicKey: this.publicKey,
                algorithms: ['RS256']
            });
            return decoded;
        }
        catch (error) {
            return null;
        }
    }
};
exports.OidcService = OidcService;
exports.OidcService = OidcService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        users_service_1.UsersService])
], OidcService);
//# sourceMappingURL=oidc.service.js.map