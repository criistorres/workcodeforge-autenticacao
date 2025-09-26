import { Request, Response } from 'express';
import { OIDCService } from '../services/OIDCService';
export declare class OIDCController {
    private oidcService;
    constructor(oidcService: OIDCService);
    discovery: (req: Request, res: Response) => Promise<void>;
    authorize: (req: Request, res: Response) => Promise<void>;
    token: (req: Request, res: Response) => Promise<void>;
    userinfo: (req: Request, res: Response) => Promise<void>;
    jwks: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=OIDCController.d.ts.map