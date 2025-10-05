import { Response, Request } from 'express';
import { OidcService } from './oidc.service';
import { UsersService } from '../users/users.service';
export declare class OidcController {
    private readonly oidcService;
    private readonly usersService;
    constructor(oidcService: OidcService, usersService: UsersService);
    getDiscoveryDocument(): Promise<{
        issuer: string;
        authorization_endpoint: string;
        token_endpoint: string;
        userinfo_endpoint: string;
        jwks_uri: string;
        end_session_endpoint: string;
        response_types_supported: string[];
        subject_types_supported: string[];
        id_token_signing_alg_values_supported: string[];
        scopes_supported: string[];
        token_endpoint_auth_methods_supported: string[];
        claims_supported: string[];
    }>;
    getJwks(): Promise<{
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
    authorize(clientId: string, redirectUri: string, responseType: string, scope: string, state: string, nonce: string, res: Response): Promise<void | Response<any, Record<string, any>>>;
    token(grantType: string, code: string, clientIdBody: string, clientSecretBody: string, redirectUri: string, req: Request): Promise<{
        access_token: string;
        token_type: string;
        expires_in: number;
        id_token: string;
        scope: string;
    }>;
    getUserInfo(req: Request): Promise<{
        sub: string;
        email: string;
        email_verified: boolean;
        name: string;
        preferred_username: string;
        tags: string[];
    }>;
    logout(redirectUri: string, res: Response): Promise<void>;
}
