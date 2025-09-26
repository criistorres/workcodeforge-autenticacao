import { Request, Response } from 'express';
import { OIDCDiscoveryConfig, JWKSResponse } from '../models/OIDCConfig';
import { UserServiceSQLite } from './UserServiceSQLite';
import { JWTService } from './JWTService';
import { AuthorizationRequestSchema, TokenRequestSchema } from '../schemas/OIDCSchema';

export class OIDCService {
  constructor(
    private userService: UserServiceSQLite,
    private jwtService: JWTService
  ) {}

  getDiscoveryConfig(): OIDCDiscoveryConfig {
    const issuer = process.env['OIDC_ISSUER']!;
    
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

  async handleDiscovery(_req: Request, res: Response): Promise<void> {
    try {
      const config = this.getDiscoveryConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({
        error: 'server_error',
        error_description: 'Erro interno do servidor'
      });
    }
  }

  async handleAuthorization(req: Request, res: Response): Promise<void> {
    try {
      // Validar parâmetros de entrada
      const validatedParams = AuthorizationRequestSchema.parse(req.query);

      // Validar client_id
      if (validatedParams.client_id !== process.env['OIDC_CLIENT_ID']) {
        res.status(400).json({
          error: 'invalid_client',
          error_description: 'Client ID inválido'
        });
        return;
      }

      // Verificar se usuário está logado
      const user = await this.getCurrentUser(req);
      
      if (!user) {
        // Redirecionar para tela de login HTML
        const loginUrl = new URL('/login.html', process.env['OIDC_ISSUER']!);
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

      // Para funcionar como o oidc-server-mock, fazer redirecionamento direto com token
      // em vez de usar authorization code flow
      
      // Gerar token JWT específico para o WorkAdventure
      const token = this.jwtService.generateWorkAdventureToken(user);
      
      // Extrair playUri dos parâmetros (se presente)
      const playUri = req.query['playUri'] as string;
      const redirectUri = req.query['redirect_uri'] as string;
      
      // Verificar se é uma requisição do WorkAdventure
      // O WorkAdventure pode passar playUri ou usar redirect_uri
      // Se redirect_uri é /openid-callback, então playUri deve conter o mapa real
      const isWorkAdventure = (playUri && playUri.includes('play.workadventure.localhost')) ||
                             (redirectUri && redirectUri.includes('play.workadventure.localhost'));
      
      // Se redirect_uri é /openid-callback, usar playUri como target (se disponível)
      const isOpenIdCallback = redirectUri && redirectUri.includes('/openid-callback');
      
      if (isWorkAdventure) {
        // Redirecionar diretamente para o WorkAdventure com o token
        // Simular o comportamento do oidc-server-mock
        
        let targetUrl;
        
        // Se redirect_uri é /openid-callback, usar playUri como target
        if (isOpenIdCallback && playUri) {
          targetUrl = playUri;
        } else {
          // Usar playUri se disponível, senão usar redirect_uri
          targetUrl = playUri || redirectUri;
        }
        
        const redirectUrl = new URL(targetUrl);
        
        // Remover parâmetros de query existentes relacionados ao OIDC
        redirectUrl.searchParams.delete('code');
        redirectUrl.searchParams.delete('state');
        
        // Adicionar o token JWT
        redirectUrl.searchParams.set('token', token);
        
        // Adicionar matrixLoginToken se necessário (para compatibilidade com Matrix)
        // O matrixLoginToken é gerado pelo Synapse, mas podemos simular um token básico
        const matrixLoginToken = `syl_${Math.random().toString(36).substring(2)}_${Date.now()}`;
        redirectUrl.searchParams.set('matrixLoginToken', matrixLoginToken);
        
        console.log('🔀 Redirecionando para WorkAdventure:', redirectUrl.toString());
        res.redirect(redirectUrl.toString());
        return;
      }

      // Fallback: usar authorization code flow se não for redirecionamento direto para WorkAdventure
      const authCode = this.jwtService.generateAuthCode(
        user.id,
        validatedParams.client_id,
        validatedParams.redirect_uri,
        validatedParams.code_challenge,
        validatedParams.code_challenge_method
      );

      const redirectUrl = new URL(validatedParams.redirect_uri);
      redirectUrl.searchParams.set('code', authCode);
      redirectUrl.searchParams.set('state', validatedParams.state);

      res.redirect(redirectUrl.toString());
    } catch (error) {
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

  async handleTokenExchange(req: Request, res: Response): Promise<void> {
    try {
      // Validar parâmetros de entrada
      const validatedData = TokenRequestSchema.parse(req.body);

      // Validar client credentials
      if (validatedData.client_id !== process.env['OIDC_CLIENT_ID'] || 
          validatedData.client_secret !== process.env['OIDC_CLIENT_SECRET']) {
        res.status(401).json({
          error: 'invalid_client',
          error_description: 'Client credentials inválidos'
        });
        return;
      }

      if (validatedData.grant_type === 'authorization_code') {
        // Validar authorization code
        const authCodeData = this.jwtService.verifyAuthCode(validatedData.code!);
        
        // Verificar se redirect_uri corresponde
        if (authCodeData.redirectUri !== validatedData.redirect_uri) {
          res.status(400).json({
            error: 'invalid_grant',
            error_description: 'Redirect URI não corresponde'
          });
          return;
        }

        // Buscar usuário
        const user = await this.userService.findById(authCodeData.userId);
        if (!user) {
          res.status(400).json({
            error: 'invalid_grant',
            error_description: 'Usuário não encontrado'
          });
          return;
        }

        // Gerar tokens
        const scopes = ['openid', 'profile', 'email'];
        const tokenResponse = this.jwtService.generateTokenResponse(user, scopes);

        res.json(tokenResponse);
      } else if (validatedData.grant_type === 'refresh_token') {
        // Implementar refresh token logic
        // Por simplicidade, retornar erro por enquanto
        res.status(400).json({
          error: 'unsupported_grant_type',
          error_description: 'Refresh token não implementado ainda'
        });
        return;
      } else {
        res.status(400).json({
          error: 'unsupported_grant_type',
          error_description: 'Grant type não suportado'
        });
        return;
      }
    } catch (error) {
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

  async handleUserInfo(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        res.status(401).json({
          error: 'invalid_token',
          error_description: 'Token de acesso ausente'
        });
        return;
      }

      // Verificar token
      const claims = this.jwtService.verifyToken(token);
      const user = await this.userService.findById(claims.sub);
      
      if (!user) {
        res.status(401).json({
          error: 'invalid_token',
          error_description: 'Usuário não encontrado'
        });
        return;
      }

      // Retornar informações do usuário
      const userInfo = this.jwtService.generateUserInfoResponse(user);
      res.json(userInfo);
    } catch (error) {
      res.status(401).json({
        error: 'invalid_token',
        error_description: 'Token inválido'
      });
    }
  }

  async handleJWKS(_req: Request, res: Response): Promise<void> {
    try {
      const jwksKey = this.jwtService.generateJWKSKey();
      const jwksResponse: JWKSResponse = {
        keys: [jwksKey]
      };
      
      res.json(jwksResponse);
    } catch (error) {
      res.status(500).json({
        error: 'server_error',
        error_description: 'Erro interno do servidor'
      });
    }
  }

  private async getCurrentUser(req: Request): Promise<any> {
    // Verificar se há token na query string (para login via OIDC)
    const token = req.query['token'] as string;
    if (token) {
      try {
        const claims = this.jwtService.verifyToken(token);
        return await this.userService.findById(claims.sub);
      } catch (error) {
        return null;
      }
    }

    // Verificar se há token no header Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const claims = this.jwtService.verifyToken(token);
        return await this.userService.findById(claims.sub);
      } catch (error) {
        return null;
      }
    }

    // Verificar se há token nos cookies (para sessão web)
    const cookies = req.headers.cookie;
    if (cookies) {
      const tokenMatch = cookies.match(/auth_token=([^;]+)/);
      if (tokenMatch && tokenMatch[1]) {
        try {
          const token = decodeURIComponent(tokenMatch[1]);
          const claims = this.jwtService.verifyToken(token);
          return await this.userService.findById(claims.sub);
        } catch (error) {
          return null;
        }
      }
    }

    return null;
  }
}
