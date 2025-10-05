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
exports.OidcController = void 0;
const common_1 = require("@nestjs/common");
const oidc_service_1 = require("./oidc.service");
const users_service_1 = require("../users/users.service");
let OidcController = class OidcController {
    constructor(oidcService, usersService) {
        this.oidcService = oidcService;
        this.usersService = usersService;
    }
    async getDiscoveryDocument() {
        const issuer = process.env.ISSUER_URL;
        return {
            issuer,
            authorization_endpoint: `${issuer}/authorize`,
            token_endpoint: `${issuer}/token`,
            userinfo_endpoint: `${issuer}/userinfo`,
            jwks_uri: `${issuer}/.well-known/jwks`,
            end_session_endpoint: `${issuer}/logout`,
            response_types_supported: ['code', 'id_token', 'token'],
            subject_types_supported: ['public'],
            id_token_signing_alg_values_supported: ['RS256'],
            scopes_supported: ['openid', 'profile', 'email', 'tags-scope'],
            token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
            claims_supported: ['sub', 'name', 'email', 'preferred_username', 'tags', 'email_verified']
        };
    }
    async getJwks() {
        return this.oidcService.getPublicKeys();
    }
    async authorize(clientId, redirectUri, responseType, scope, state, nonce, res) {
        if (clientId !== process.env.WORKADVENTURE_CLIENT_ID) {
            return res.status(400).json({ error: 'invalid_client' });
        }
        const allowedRedirectUris = process.env.ALLOWED_REDIRECT_URIS.split(',');
        if (!allowedRedirectUris.includes(redirectUri)) {
            return res.status(400).json({ error: 'invalid_redirect_uri' });
        }
        let loginUrl = `${process.env.FRONTEND_URL}/login?` +
            `client_id=${encodeURIComponent(clientId)}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=${encodeURIComponent(responseType)}&` +
            `scope=${encodeURIComponent(scope)}&` +
            `state=${encodeURIComponent(state)}`;
        if (nonce && nonce !== 'undefined') {
            loginUrl += `&nonce=${encodeURIComponent(nonce)}`;
        }
        return res.redirect(loginUrl);
    }
    async token(grantType, code, clientIdBody, clientSecretBody, redirectUri, req) {
        let clientId = clientIdBody;
        let clientSecret = clientSecretBody;
        if (!clientId || !clientSecret) {
            const authHeader = req.headers['authorization'];
            if (authHeader && authHeader.startsWith('Basic ')) {
                const base64Credentials = authHeader.substring(6);
                const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
                const [id, secret] = credentials.split(':');
                clientId = id;
                clientSecret = secret;
            }
        }
        if (clientId !== process.env.WORKADVENTURE_CLIENT_ID ||
            clientSecret !== process.env.WORKADVENTURE_CLIENT_SECRET) {
            throw new common_1.HttpException('invalid_client', common_1.HttpStatus.UNAUTHORIZED);
        }
        const authData = await this.oidcService.validateAuthorizationCode(code);
        if (!authData) {
            throw new common_1.HttpException('invalid_grant', common_1.HttpStatus.BAD_REQUEST);
        }
        const tokens = await this.oidcService.generateTokens(authData);
        return {
            access_token: tokens.accessToken,
            token_type: 'Bearer',
            expires_in: 3600,
            id_token: tokens.idToken,
            scope: authData.scope
        };
    }
    async getUserInfo(req) {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.HttpException('Unauthorized', common_1.HttpStatus.UNAUTHORIZED);
        }
        const accessToken = authHeader.substring(7);
        const decoded = await this.oidcService.validateAccessToken(accessToken);
        if (!decoded) {
            throw new common_1.HttpException('Invalid token', common_1.HttpStatus.UNAUTHORIZED);
        }
        const user = await this.usersService.findById(decoded.sub);
        if (!user) {
            throw new common_1.HttpException('User not found', common_1.HttpStatus.NOT_FOUND);
        }
        return {
            sub: user.id,
            email: user.email,
            email_verified: true,
            name: user.name,
            preferred_username: user.username,
            tags: user.tags
        };
    }
    async logout(redirectUri, idTokenHint, res) {
        if (idTokenHint) {
            try {
                await this.oidcService.revokeSessionByToken(idTokenHint);
            }
            catch (err) {
                console.error('[LOGOUT] Erro ao revogar sessão:', err.message);
            }
        }
        const finalRedirectUri = redirectUri || process.env.DEFAULT_LOGOUT_REDIRECT;
        return res.redirect(finalRedirectUri);
    }
};
exports.OidcController = OidcController;
__decorate([
    (0, common_1.Get)('.well-known/openid-configuration'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OidcController.prototype, "getDiscoveryDocument", null);
__decorate([
    (0, common_1.Get)('.well-known/jwks'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OidcController.prototype, "getJwks", null);
__decorate([
    (0, common_1.Get)('authorize'),
    __param(0, (0, common_1.Query)('client_id')),
    __param(1, (0, common_1.Query)('redirect_uri')),
    __param(2, (0, common_1.Query)('response_type')),
    __param(3, (0, common_1.Query)('scope')),
    __param(4, (0, common_1.Query)('state')),
    __param(5, (0, common_1.Query)('nonce')),
    __param(6, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], OidcController.prototype, "authorize", null);
__decorate([
    (0, common_1.HttpCode)(200),
    (0, common_1.Post)('token'),
    __param(0, (0, common_1.Body)('grant_type')),
    __param(1, (0, common_1.Body)('code')),
    __param(2, (0, common_1.Body)('client_id')),
    __param(3, (0, common_1.Body)('client_secret')),
    __param(4, (0, common_1.Body)('redirect_uri')),
    __param(5, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], OidcController.prototype, "token", null);
__decorate([
    (0, common_1.Get)('userinfo'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OidcController.prototype, "getUserInfo", null);
__decorate([
    (0, common_1.Get)('logout'),
    __param(0, (0, common_1.Query)('post_logout_redirect_uri')),
    __param(1, (0, common_1.Query)('id_token_hint')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], OidcController.prototype, "logout", null);
exports.OidcController = OidcController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [oidc_service_1.OidcService,
        users_service_1.UsersService])
], OidcController);
//# sourceMappingURL=oidc.controller.js.map