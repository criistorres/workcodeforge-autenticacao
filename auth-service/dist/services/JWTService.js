"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
class JWTService {
    constructor() {
        this.secret = process.env['JWT_SECRET'];
        this.issuer = process.env['OIDC_ISSUER'];
        this.audience = process.env['OIDC_CLIENT_ID'];
        this.keyId = 'workadventure-key-1';
    }
    generateAccessToken(user, scopes = ['openid', 'profile', 'email']) {
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = 3600;
        const claims = {
            sub: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            tags: user.tags,
            iat: now,
            exp: now + expiresIn,
            iss: this.issuer,
            aud: this.audience,
            scope: scopes.join(' ')
        };
        return jsonwebtoken_1.default.sign(claims, this.secret, {
            algorithm: 'HS256',
            keyid: this.keyId
        });
    }
    generateIdToken(user, nonce) {
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = 3600;
        const claims = {
            sub: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            tags: user.tags,
            iat: now,
            exp: now + expiresIn,
            iss: this.issuer,
            aud: this.audience,
            scope: 'openid profile email'
        };
        if (nonce) {
            claims.nonce = nonce;
        }
        return jsonwebtoken_1.default.sign(claims, this.secret, {
            algorithm: 'HS256',
            keyid: this.keyId
        });
    }
    generateRefreshToken(user) {
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = 30 * 24 * 3600;
        return jsonwebtoken_1.default.sign({
            sub: user.id,
            type: 'refresh',
            iat: now,
            exp: now + expiresIn
        }, this.secret, {
            algorithm: 'HS256',
            keyid: this.keyId
        });
    }
    verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.secret);
            return decoded;
        }
        catch (error) {
            throw new Error('Token inválido');
        }
    }
    generateAuthCode(userId, clientId, redirectUri, codeChallenge, codeChallengeMethod) {
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = 600;
        const payload = {
            userId,
            clientId,
            redirectUri,
            codeChallenge,
            codeChallengeMethod,
            iat: now,
            exp: now + expiresIn,
            type: 'auth_code'
        };
        return jsonwebtoken_1.default.sign(payload, this.secret, {
            algorithm: 'HS256',
            keyid: this.keyId
        });
    }
    verifyAuthCode(code) {
        try {
            const decoded = jsonwebtoken_1.default.verify(code, this.secret);
            if (decoded.type !== 'auth_code') {
                throw new Error('Token não é um authorization code');
            }
            return {
                userId: decoded.userId,
                clientId: decoded.clientId,
                redirectUri: decoded.redirectUri,
                codeChallenge: decoded.codeChallenge,
                codeChallengeMethod: decoded.codeChallengeMethod
            };
        }
        catch (error) {
            throw new Error('Authorization code inválido');
        }
    }
    generateTokenResponse(user, scopes, nonce) {
        const accessToken = this.generateAccessToken(user, scopes);
        const idToken = this.generateIdToken(user, nonce);
        const refreshToken = this.generateRefreshToken(user);
        return {
            access_token: accessToken,
            id_token: idToken,
            refresh_token: refreshToken,
            token_type: 'Bearer',
            expires_in: 3600,
            scope: scopes.join(' ')
        };
    }
    generateUserInfoResponse(user) {
        return {
            sub: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            tags: user.tags,
            email_verified: true,
            preferred_username: user.username
        };
    }
    generateWorkAdventureToken(user) {
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = 3600;
        const internalAccessToken = jsonwebtoken_1.default.sign({
            sub: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            tags: user.tags,
            iat: now,
            exp: now + expiresIn,
            iss: this.issuer,
            aud: 'workadventure-client'
        }, this.secret, {
            algorithm: 'HS256',
            keyid: this.keyId
        });
        const payload = {
            identifier: user.id,
            accessToken: internalAccessToken,
            username: user.username,
            email: user.email,
            name: user.name,
            tags: user.tags,
            iat: now,
            exp: now + expiresIn,
            iss: this.issuer,
            aud: 'workadventure-client'
        };
        return jsonwebtoken_1.default.sign(payload, this.secret, {
            algorithm: 'HS256',
            keyid: this.keyId
        });
    }
    generateJWKSKey() {
        const key = crypto_1.default.createHash('sha256').update(this.secret).digest('base64');
        return {
            kty: 'oct',
            use: 'sig',
            kid: this.keyId,
            alg: 'HS256',
            n: key,
            e: 'AQAB'
        };
    }
}
exports.JWTService = JWTService;
//# sourceMappingURL=JWTService.js.map