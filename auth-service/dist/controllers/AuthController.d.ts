import { Request, Response } from 'express';
import { UserServiceSQLite } from '../services/UserServiceSQLite';
import { JWTService } from '../services/JWTService';
import { PasswordService } from '../services/PasswordService';
export declare class AuthController {
    private userService;
    private jwtService;
    private passwordService;
    constructor(userService: UserServiceSQLite, jwtService: JWTService, passwordService: PasswordService);
    register: (req: Request, res: Response) => Promise<void>;
    login: (req: Request, res: Response) => Promise<void>;
    getProfile: (req: Request, res: Response) => Promise<void>;
    updateProfile: (req: Request, res: Response) => Promise<void>;
    changePassword: (req: Request, res: Response) => Promise<void>;
    refreshToken: (req: Request, res: Response) => Promise<void>;
    logout: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=AuthController.d.ts.map