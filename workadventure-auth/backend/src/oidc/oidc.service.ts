import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { SessionEntity } from '../users/entities/session.entity';

interface AuthorizationData {
  userId: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  nonce: string;
  expiresAt: number;
}

@Injectable()
export class OidcService {
  private authorizationCodes = new Map<string, AuthorizationData>();
  private privateKey: string;
  private publicKey: string;

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    @InjectRepository(SessionEntity)
    private sessionsRepository: Repository<SessionEntity>,
  ) {
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

  async generateAuthorizationCode(data: Omit<AuthorizationData, 'expiresAt'>): Promise<string> {
    const code = crypto.randomBytes(32).toString('hex');
    this.authorizationCodes.set(code, {
      ...data,
      expiresAt: Date.now() + 600000
    });
    return code;
  }

  async validateAuthorizationCode(code: string): Promise<AuthorizationData | null> {
    const data = this.authorizationCodes.get(code);
    if (!data || data.expiresAt < Date.now()) {
      return null;
    }
    this.authorizationCodes.delete(code);
    return data;
  }

  async generateTokens(authData: AuthorizationData) {
    const user = await this.usersService.findById(authData.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const now = Math.floor(Date.now() / 1000);

    const idTokenPayload: any = {
      iss: process.env.ISSUER_URL,
      sub: user.id,
      aud: authData.clientId,
      exp: now + 3600,
      iat: now,
      email: user.email,
      email_verified: true,
      name: user.name,
      preferred_username: user.username,
      tags: user.tags,
      defaultMap: user.defaultMap || 'main'
    };

    // Apenas adiciona nonce se ele existir e não for undefined ou 'undefined'
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

    // Criar sessão no banco de dados
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hora de validade

    const session = this.sessionsRepository.create({
      userId: user.id,
      token: accessToken,
      expiresAt,
      isActive: true,
      ipAddress: null, // TODO: capturar IP da requisição
      userAgent: null, // TODO: capturar user-agent da requisição
    });

    await this.sessionsRepository.save(session);

    console.log(`[SESSION] Sessão criada para usuário ${user.email} (ID: ${user.id})`);

    return { idToken, accessToken };
  }

  async validateAccessToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.verify(token, {
        publicKey: this.publicKey,
        algorithms: ['RS256']
      });
      return decoded;
    } catch (error) {
      return null;
    }
  }

  async revokeSessionByToken(token: string): Promise<void> {
    try {
      // Decodificar token para obter userId
      const decoded = this.jwtService.verify(token, {
        publicKey: this.publicKey,
        algorithms: ['RS256']
      });

      const userId = decoded.sub;

      // Marcar todas as sessões ativas deste usuário como inativas
      const result = await this.sessionsRepository.update(
        { userId, isActive: true },
        {
          isActive: false,
          revokedAt: new Date()
        }
      );

      console.log(`[LOGOUT] ${result.affected || 0} sessão(ões) revogada(s) para usuário ${userId}`);
    } catch (error) {
      console.error('[LOGOUT] Erro ao decodificar token:', error.message);
      throw new Error('Invalid token');
    }
  }
}
