import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        sub: string;
        email: string;
        name: string;
        username: string;
        tags: string[];
        iat: number;
        exp: number;
        iss: string;
        aud: string;
        scope: string;
    };
}
export declare function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void;
export declare function requireScope(scope: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare function requireTag(tag: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map