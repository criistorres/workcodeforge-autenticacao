import { UsersService } from '../users/users.service';
import { OidcService } from '../oidc/oidc.service';
import { LoginDto, RegisterDto } from './dto/login.dto';
export declare class AuthService {
    private usersService;
    private oidcService;
    constructor(usersService: UsersService, oidcService: OidcService);
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
    authorize(userId: string, authParams: any): Promise<{
        code: string;
    }>;
}
