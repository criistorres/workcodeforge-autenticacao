import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
}
