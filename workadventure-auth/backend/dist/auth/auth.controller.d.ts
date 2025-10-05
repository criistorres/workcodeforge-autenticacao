import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
export declare class AuthController {
    private authService;
    private usersService;
    constructor(authService: AuthService, usersService: UsersService);
    login(loginDto: LoginDto): Promise<{
        userId: string;
        email: string;
        name: string;
        tags: string[];
    }>;
    register(registerDto: RegisterDto): Promise<{
        userId: string;
        email: string;
        name: string;
        tags: string[];
    }>;
    authorize(body: any): Promise<{
        code: string;
    }>;
    listUsers(): Promise<{
        id: string;
        email: string;
        name: string;
        username: string;
        tags: string[];
        createdAt: Date;
    }[]>;
}
