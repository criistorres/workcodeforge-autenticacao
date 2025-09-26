import { Request, Response } from 'express';
import { OIDCDiscoveryConfig } from '../models/OIDCConfig';
import { UserServiceSQLite } from './UserServiceSQLite';
import { JWTService } from './JWTService';
export declare class OIDCService {
    private userService;
    private jwtService;
    constructor(userService: UserServiceSQLite, jwtService: JWTService);
    getDiscoveryConfig(): OIDCDiscoveryConfig;
    handleDiscovery(_req: Request, res: Response): Promise<void>;
    handleAuthorization(req: Request, res: Response): Promise<void>;
    handleTokenExchange(req: Request, res: Response): Promise<void>;
    handleUserInfo(req: Request, res: Response): Promise<void>;
    handleJWKS(_req: Request, res: Response): Promise<void>;
    private getCurrentUser;
}
//# sourceMappingURL=OIDCService.d.ts.map