import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
interface AuthorizationData {
    userId: string;
    clientId: string;
    redirectUri: string;
    scope: string;
    state: string;
    nonce: string;
    expiresAt: number;
}
export declare class OidcService {
    private jwtService;
    private usersService;
    private authorizationCodes;
    private privateKey;
    private publicKey;
    constructor(jwtService: JwtService, usersService: UsersService);
    getPublicKeys(): Promise<{
        keys: {
            kid: string;
            use: string;
            alg: string;
            crv?: string;
            d?: string;
            dp?: string;
            dq?: string;
            e?: string;
            k?: string;
            kty?: string;
            n?: string;
            p?: string;
            q?: string;
            qi?: string;
            x?: string;
            y?: string;
        }[];
    }>;
    generateAuthorizationCode(data: Omit<AuthorizationData, 'expiresAt'>): Promise<string>;
    validateAuthorizationCode(code: string): Promise<AuthorizationData | null>;
    generateTokens(authData: AuthorizationData): Promise<{
        idToken: string;
        accessToken: string;
    }>;
    validateAccessToken(token: string): Promise<any>;
}
export {};
