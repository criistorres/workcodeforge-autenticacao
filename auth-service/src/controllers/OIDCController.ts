import { Request, Response } from 'express';
import { OIDCService } from '../services/OIDCService';

export class OIDCController {
  constructor(private oidcService: OIDCService) {}

  // GET /.well-known/openid_configuration
  discovery = async (req: Request, res: Response) => {
    await this.oidcService.handleDiscovery(req, res);
  };

  // GET /oauth/authorize
  authorize = async (req: Request, res: Response) => {
    await this.oidcService.handleAuthorization(req, res);
  };

  // POST /oauth/token
  token = async (req: Request, res: Response) => {
    await this.oidcService.handleTokenExchange(req, res);
  };

  // GET /oauth/userinfo
  userinfo = async (req: Request, res: Response) => {
    await this.oidcService.handleUserInfo(req, res);
  };

  // GET /oauth/jwks
  jwks = async (req: Request, res: Response) => {
    await this.oidcService.handleJWKS(req, res);
  };
}
