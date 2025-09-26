import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, UserClaims } from '../models/User';
import { TokenResponse, UserInfoResponse } from '../models/OIDCConfig';

export class JWTService {
  private readonly secret: string;
  private readonly issuer: string;
  private readonly audience: string;
  private readonly keyId: string;

  constructor() {
    this.secret = process.env['JWT_SECRET']!;
    this.issuer = process.env['OIDC_ISSUER']!;
    this.audience = process.env['OIDC_CLIENT_ID']!;
    this.keyId = 'workadventure-key-1';
  }

  generateAccessToken(user: User, scopes: string[] = ['openid', 'profile', 'email']): string {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 3600; // 1 hora

    const claims: UserClaims = {
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

    return jwt.sign(claims, this.secret, {
      algorithm: 'HS256',
      keyid: this.keyId
    });
  }

  generateIdToken(user: User, nonce?: string): string {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 3600; // 1 hora

    const claims: UserClaims = {
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

    // Adicionar nonce se fornecido
    if (nonce) {
      (claims as any).nonce = nonce;
    }

    return jwt.sign(claims, this.secret, {
      algorithm: 'HS256',
      keyid: this.keyId
    });
  }

  generateRefreshToken(user: User): string {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 30 * 24 * 3600; // 30 dias

    return jwt.sign(
      { 
        sub: user.id, 
        type: 'refresh',
        iat: now,
        exp: now + expiresIn
      }, 
      this.secret, 
      { 
        algorithm: 'HS256',
        keyid: this.keyId
      }
    );
  }

  verifyToken(token: string): UserClaims {
    try {
      const decoded = jwt.verify(token, this.secret) as UserClaims;
      return decoded;
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  generateAuthCode(userId: string, clientId: string, redirectUri: string, codeChallenge?: string, codeChallengeMethod?: string): string {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 600; // 10 minutos

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

    return jwt.sign(payload, this.secret, {
      algorithm: 'HS256',
      keyid: this.keyId
    });
  }

  verifyAuthCode(code: string): { userId: string; clientId: string; redirectUri: string; codeChallenge?: string; codeChallengeMethod?: string } {
    try {
      const decoded = jwt.verify(code, this.secret) as any;
      
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
    } catch (error) {
      throw new Error('Authorization code inválido');
    }
  }

  generateTokenResponse(user: User, scopes: string[], nonce?: string): TokenResponse {
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

  generateUserInfoResponse(user: User): UserInfoResponse {
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

  /**
   * Gera um token JWT específico para o WorkAdventure
   * Este token deve conter accessToken como campo interno para que o frontend reconheça o login
   */
  generateWorkAdventureToken(user: User): string {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 3600; // 1 hora

    // Gerar um accessToken simples para o WorkAdventure (sem recursão)
    const internalAccessToken = jwt.sign({
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
      accessToken: internalAccessToken, // Campo obrigatório para o WorkAdventure reconhecer o login
      username: user.username,
      email: user.email,
      name: user.name,
      tags: user.tags,
      iat: now,
      exp: now + expiresIn,
      iss: this.issuer,
      aud: 'workadventure-client'
    };

    return jwt.sign(payload, this.secret, {
      algorithm: 'HS256',
      keyid: this.keyId
    });
  }

  // Gerar chave pública para JWKS
  generateJWKSKey(): { kty: string; use: string; kid: string; alg: string; n: string; e: string } {
    // Para simplicidade, vamos usar a chave secreta como base
    // Em produção, use chaves RSA reais
    const key = crypto.createHash('sha256').update(this.secret).digest('base64');
    
    return {
      kty: 'oct', // HMAC key
      use: 'sig',
      kid: this.keyId,
      alg: 'HS256',
      n: key,
      e: 'AQAB'
    };
  }
}