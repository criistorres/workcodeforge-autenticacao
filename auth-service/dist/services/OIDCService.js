"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OIDCService = void 0;
const OIDCSchema_1 = require("../schemas/OIDCSchema");
class OIDCService {
    constructor(userService, jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }
    getDiscoveryConfig() {
        const issuer = process.env['OIDC_ISSUER'];
        return {
            issuer,
            authorization_endpoint: `${issuer}/oauth/authorize`,
            token_endpoint: `${issuer}/oauth/token`,
            userinfo_endpoint: `${issuer}/oauth/userinfo`,
            jwks_uri: `${issuer}/oauth/jwks`,
            response_types_supported: ['code'],
            grant_types_supported: ['authorization_code', 'refresh_token'],
            scopes_supported: ['openid', 'profile', 'email', 'tags-scope'],
            claims_supported: ['sub', 'email', 'name', 'username', 'tags', 'email_verified', 'preferred_username'],
            id_token_signing_alg_values_supported: ['HS256'],
            token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
            code_challenge_methods_supported: ['S256', 'plain'],
            subject_types_supported: ['public'],
            response_modes_supported: ['query', 'fragment']
        };
    }
    async handleDiscovery(_req, res) {
        try {
            const config = this.getDiscoveryConfig();
            res.json(config);
        }
        catch (error) {
            res.status(500).json({
                error: 'server_error',
                error_description: 'Erro interno do servidor'
            });
        }
    }
    async handleAuthorization(req, res) {
        try {
            const validatedParams = OIDCSchema_1.AuthorizationRequestSchema.parse(req.query);
            if (validatedParams.client_id !== process.env['OIDC_CLIENT_ID']) {
                res.status(400).json({
                    error: 'invalid_client',
                    error_description: 'Client ID inválido'
                });
                return;
            }
            const user = await this.getCurrentUser(req);
            if (!user) {
                const loginUrl = new URL('/login.html', process.env['OIDC_ISSUER']);
                loginUrl.searchParams.set('redirect_uri', validatedParams.redirect_uri);
                loginUrl.searchParams.set('state', validatedParams.state);
                loginUrl.searchParams.set('scope', validatedParams.scope || 'openid profile email');
                if (validatedParams.code_challenge) {
                    loginUrl.searchParams.set('code_challenge', validatedParams.code_challenge);
                    loginUrl.searchParams.set('code_challenge_method', validatedParams.code_challenge_method || 'plain');
                }
                if (validatedParams.nonce) {
                    loginUrl.searchParams.set('nonce', validatedParams.nonce);
                }
                res.redirect(loginUrl.toString());
                return;
            }
            const token = this.jwtService.generateWorkAdventureToken(user);
            const playUri = req.query['playUri'];
            const redirectUri = req.query['redirect_uri'];
            const isWorkAdventure = (playUri && playUri.includes('play.workadventure.localhost')) ||
                (redirectUri && redirectUri.includes('play.workadventure.localhost'));
            const isOpenIdCallback = redirectUri && redirectUri.includes('/openid-callback');
            if (isWorkAdventure) {
                let targetUrl;
                if (isOpenIdCallback && playUri) {
                    targetUrl = playUri;
                }
                else {
                    targetUrl = playUri || redirectUri;
                }
                const redirectUrl = new URL(targetUrl);
                redirectUrl.searchParams.delete('code');
                redirectUrl.searchParams.delete('state');
                redirectUrl.searchParams.set('token', token);
                const matrixLoginToken = `syl_${Math.random().toString(36).substring(2)}_${Date.now()}`;
                redirectUrl.searchParams.set('matrixLoginToken', matrixLoginToken);
                console.log('🔀 Redirecionando para WorkAdventure:', redirectUrl.toString());
                res.redirect(redirectUrl.toString());
                return;
            }
            const authCode = this.jwtService.generateAuthCode(user.id, validatedParams.client_id, validatedParams.redirect_uri, validatedParams.code_challenge, validatedParams.code_challenge_method);
            const redirectUrl = new URL(validatedParams.redirect_uri);
            redirectUrl.searchParams.set('code', authCode);
            redirectUrl.searchParams.set('state', validatedParams.state);
            res.redirect(redirectUrl.toString());
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    error: 'invalid_request',
                    error_description: error.message
                });
                return;
            }
            res.status(500).json({
                error: 'server_error',
                error_description: 'Erro interno do servidor'
            });
        }
    }
    async handleTokenExchange(req, res) {
        try {
            const validatedData = OIDCSchema_1.TokenRequestSchema.parse(req.body);
            if (validatedData.client_id !== process.env['OIDC_CLIENT_ID'] ||
                validatedData.client_secret !== process.env['OIDC_CLIENT_SECRET']) {
                res.status(401).json({
                    error: 'invalid_client',
                    error_description: 'Client credentials inválidos'
                });
                return;
            }
            if (validatedData.grant_type === 'authorization_code') {
                const authCodeData = this.jwtService.verifyAuthCode(validatedData.code);
                if (authCodeData.redirectUri !== validatedData.redirect_uri) {
                    res.status(400).json({
                        error: 'invalid_grant',
                        error_description: 'Redirect URI não corresponde'
                    });
                    return;
                }
                const user = await this.userService.findById(authCodeData.userId);
                if (!user) {
                    res.status(400).json({
                        error: 'invalid_grant',
                        error_description: 'Usuário não encontrado'
                    });
                    return;
                }
                const scopes = ['openid', 'profile', 'email'];
                const tokenResponse = this.jwtService.generateTokenResponse(user, scopes);
                res.json(tokenResponse);
            }
            else if (validatedData.grant_type === 'refresh_token') {
                res.status(400).json({
                    error: 'unsupported_grant_type',
                    error_description: 'Refresh token não implementado ainda'
                });
                return;
            }
            else {
                res.status(400).json({
                    error: 'unsupported_grant_type',
                    error_description: 'Grant type não suportado'
                });
                return;
            }
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    error: 'invalid_request',
                    error_description: error.message
                });
                return;
            }
            res.status(500).json({
                error: 'server_error',
                error_description: 'Erro interno do servidor'
            });
        }
    }
    async handleUserInfo(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                res.status(401).json({
                    error: 'invalid_token',
                    error_description: 'Token de acesso ausente'
                });
                return;
            }
            const claims = this.jwtService.verifyToken(token);
            const user = await this.userService.findById(claims.sub);
            if (!user) {
                res.status(401).json({
                    error: 'invalid_token',
                    error_description: 'Usuário não encontrado'
                });
                return;
            }
            const userInfo = this.jwtService.generateUserInfoResponse(user);
            res.json(userInfo);
        }
        catch (error) {
            res.status(401).json({
                error: 'invalid_token',
                error_description: 'Token inválido'
            });
        }
    }
    async handleJWKS(_req, res) {
        try {
            const jwksKey = this.jwtService.generateJWKSKey();
            const jwksResponse = {
                keys: [jwksKey]
            };
            res.json(jwksResponse);
        }
        catch (error) {
            res.status(500).json({
                error: 'server_error',
                error_description: 'Erro interno do servidor'
            });
        }
    }
    async getCurrentUser(req) {
        const token = req.query['token'];
        if (token) {
            try {
                const claims = this.jwtService.verifyToken(token);
                return await this.userService.findById(claims.sub);
            }
            catch (error) {
                return null;
            }
        }
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.replace('Bearer ', '');
                const claims = this.jwtService.verifyToken(token);
                return await this.userService.findById(claims.sub);
            }
            catch (error) {
                return null;
            }
        }
        const cookies = req.headers.cookie;
        if (cookies) {
            const tokenMatch = cookies.match(/auth_token=([^;]+)/);
            if (tokenMatch && tokenMatch[1]) {
                try {
                    const token = decodeURIComponent(tokenMatch[1]);
                    const claims = this.jwtService.verifyToken(token);
                    return await this.userService.findById(claims.sub);
                }
                catch (error) {
                    return null;
                }
            }
        }
        return null;
    }
}
exports.OIDCService = OIDCService;
//# sourceMappingURL=OIDCService.js.map