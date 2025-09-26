import { JWTService } from '../../src/services/JWTService';
import { User } from '../../src/models/User';

// Mock das variáveis de ambiente
process.env['JWT_SECRET'] = 'test-secret-key';
process.env['OIDC_ISSUER'] = 'http://test.workadventure.localhost';
process.env['OIDC_CLIENT_ID'] = 'test-client';

describe('JWTService', () => {
  let jwtService: JWTService;
  let mockUser: User;

  beforeEach(() => {
    jwtService = new JWTService();
    mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: 'hashed-password',
      name: 'Test User',
      tags: ['developer'],
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = jwtService.generateAccessToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate token with custom scopes', () => {
      const customScopes = ['openid', 'profile', 'email', 'custom-scope'];
      const token = jwtService.generateAccessToken(mockUser, customScopes);
      
      const decoded = jwtService.verifyToken(token);
      expect(decoded.scope).toBe(customScopes.join(' '));
    });
  });

  describe('generateIdToken', () => {
    it('should generate a valid ID token', () => {
      const token = jwtService.generateIdToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should contain correct claims', () => {
      const token = jwtService.generateIdToken(mockUser);
      const decoded = jwtService.verifyToken(token);
      
      expect(decoded.sub).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.name).toBe(mockUser.name);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.tags).toEqual(mockUser.tags);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = jwtService.generateRefreshToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate refresh token with correct structure', () => {
      const token = jwtService.generateRefreshToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verificar se o token pode ser decodificado
      const decoded = jwtService.verifyToken(token);
      expect(decoded.sub).toBe(mockUser.id);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = jwtService.generateAccessToken(mockUser);
      const decoded = jwtService.verifyToken(token);
      
      expect(decoded.sub).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        jwtService.verifyToken(invalidToken);
      }).toThrow('Token inválido');
    });

    it('should throw error for expired token', () => {
      // Simular token expirado alterando a data
      const now = Math.floor(Date.now() / 1000) - 7200; // 2 horas atrás
      const expiredClaims = {
        sub: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        username: mockUser.username,
        tags: mockUser.tags,
        iat: now,
        exp: now + 3600, // Expirou há 1 hora
        iss: process.env['OIDC_ISSUER'],
        aud: process.env['OIDC_CLIENT_ID'],
        scope: 'openid profile email'
      };
      
      const expiredToken = require('jsonwebtoken').sign(expiredClaims, process.env['JWT_SECRET']);
      
      expect(() => {
        jwtService.verifyToken(expiredToken);
      }).toThrow('Token inválido');
    });
  });

  describe('generateAuthCode', () => {
    it('should generate a valid auth code', () => {
      const code = jwtService.generateAuthCode('user123', 'client123', 'http://redirect.com');
      
      expect(code).toBeDefined();
      expect(typeof code).toBe('string');
    });

    it('should verify auth code correctly', () => {
      const code = jwtService.generateAuthCode('user123', 'client123', 'http://redirect.com');
      const decoded = jwtService.verifyAuthCode(code);
      
      expect(decoded.userId).toBe('user123');
      expect(decoded.clientId).toBe('client123');
      expect(decoded.redirectUri).toBe('http://redirect.com');
    });
  });

  describe('generateTokenResponse', () => {
    it('should generate complete token response', () => {
      const scopes = ['openid', 'profile', 'email'];
      const tokenResponse = jwtService.generateTokenResponse(mockUser, scopes);
      
      expect(tokenResponse).toHaveProperty('access_token');
      expect(tokenResponse).toHaveProperty('id_token');
      expect(tokenResponse).toHaveProperty('refresh_token');
      expect(tokenResponse).toHaveProperty('token_type', 'Bearer');
      expect(tokenResponse).toHaveProperty('expires_in', 3600);
      expect(tokenResponse).toHaveProperty('scope', 'openid profile email');
    });
  });
});
