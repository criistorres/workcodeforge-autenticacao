import { Controller, Get, Post, Query, Body, Req, Res, HttpStatus, HttpException, HttpCode } from '@nestjs/common';
import { Response, Request } from 'express';
import { OidcService } from './oidc.service';
import { UsersService } from '../users/users.service';

@Controller()
export class OidcController {
  constructor(
    private readonly oidcService: OidcService,
    private readonly usersService: UsersService
  ) {}

  @Get('.well-known/openid-configuration')
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
      claims_supported: ['sub', 'name', 'email', 'preferred_username', 'tags', 'email_verified', 'defaultMap']
    };
  }

  @Get('.well-known/jwks')
  async getJwks() {
    return this.oidcService.getPublicKeys();
  }

  @Get('authorize')
  async authorize(
    @Query('client_id') clientId: string,
    @Query('redirect_uri') redirectUri: string,
    @Query('response_type') responseType: string,
    @Query('scope') scope: string,
    @Query('state') state: string,
    @Query('nonce') nonce: string,
    @Res() res: Response
  ) {
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

    // Apenas adiciona nonce se ele existir e não for undefined
    if (nonce && nonce !== 'undefined') {
      loginUrl += `&nonce=${encodeURIComponent(nonce)}`;
    }

    return res.redirect(loginUrl);
  }

  @HttpCode(200)
  @Post('token')
  async token(
    @Body('grant_type') grantType: string,
    @Body('code') code: string,
    @Body('client_id') clientIdBody: string,
    @Body('client_secret') clientSecretBody: string,
    @Body('redirect_uri') redirectUri: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    // Suporta tanto client_secret_basic (via Authorization header) quanto client_secret_post (via body)
    let clientId = clientIdBody;
    let clientSecret = clientSecretBody;

    // Se não vier no body, tenta pegar do Authorization header (Basic Auth)
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

    if (
      clientId !== process.env.WORKADVENTURE_CLIENT_ID ||
      clientSecret !== process.env.WORKADVENTURE_CLIENT_SECRET
    ) {
      throw new HttpException('invalid_client', HttpStatus.UNAUTHORIZED);
    }

    const authData = await this.oidcService.validateAuthorizationCode(code);
    if (!authData) {
      throw new HttpException('invalid_grant', HttpStatus.BAD_REQUEST);
    }

    const tokens = await this.oidcService.generateTokens(authData);

    // Definir cookie cross-domain com o access_token
    // Cookie válido para .workadventure.localhost (subdomínios)
    res.cookie('auth_token', tokens.accessToken, {
      httpOnly: true, // Previne acesso via JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
      sameSite: 'lax', // Permite cookies cross-domain em navegação
      domain: '.workadventure.localhost', // Válido para todos subdomínios
      maxAge: 3600000, // 1 hora (em milissegundos)
      path: '/' // Válido para toda aplicação
    });

    console.log('[TOKEN] Cookie cross-domain criado para: .workadventure.localhost');

    return res.json({
      access_token: tokens.accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      id_token: tokens.idToken,
      scope: authData.scope
    });
  }

  @Get('userinfo')
  async getUserInfo(@Req() req: Request) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const accessToken = authHeader.substring(7);
    const decoded = await this.oidcService.validateAccessToken(accessToken);

    if (!decoded) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }

    const user = await this.usersService.findById(decoded.sub);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return {
      sub: user.id,
      email: user.email,
      email_verified: true,
      name: user.name,
      preferred_username: user.username,
      tags: user.tags,
      defaultMap: user.defaultMap || 'main'
    };
  }

  @Get('logout')
  async logout(
    @Query('post_logout_redirect_uri') redirectUri: string,
    @Query('id_token_hint') idTokenHint: string,
    @Res() res: Response
  ) {
    console.log('[LOGOUT] Requisição de logout recebida');
    console.log('[LOGOUT] post_logout_redirect_uri:', redirectUri);
    console.log('[LOGOUT] id_token_hint:', idTokenHint ? 'presente' : 'ausente');

    // Revogar sessão se id_token_hint for fornecido
    if (idTokenHint) {
      try {
        await this.oidcService.revokeSessionByToken(idTokenHint);
        console.log('[LOGOUT] Sessão revogada com sucesso');
      } catch (err) {
        console.error('[LOGOUT] Erro ao revogar sessão:', err.message);
      }
    }

    // Limpar cookie de autenticação cross-domain
    res.clearCookie('auth_token', {
      domain: '.workadventure.localhost',
      path: '/'
    });
    console.log('[LOGOUT] Cookie cross-domain removido');

    // Se não veio redirect_uri, usar o default (play.workadventure.localhost)
    const finalRedirectUri = redirectUri || process.env.DEFAULT_LOGOUT_REDIRECT || 'http://play.workadventure.localhost';

    // Redirecionar para o frontend com parâmetro de logout para limpar localStorage
    // e depois redirecionar para o Play
    const logoutPageUrl = `${process.env.FRONTEND_URL}/login?logout=true&post_logout_redirect_uri=${encodeURIComponent(finalRedirectUri)}`;

    console.log('[LOGOUT] Redirecionando para página de logout:', logoutPageUrl);
    console.log('[LOGOUT] Após limpeza, usuário será redirecionado para:', finalRedirectUri);
    return res.redirect(logoutPageUrl);
  }
}
