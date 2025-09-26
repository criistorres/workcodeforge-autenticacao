import { User, UserClaims } from '../models/User';
import { TokenResponse, UserInfoResponse } from '../models/OIDCConfig';
export declare class JWTService {
    private readonly secret;
    private readonly issuer;
    private readonly audience;
    private readonly keyId;
    constructor();
    generateAccessToken(user: User, scopes?: string[]): string;
    generateIdToken(user: User, nonce?: string): string;
    generateRefreshToken(user: User): string;
    verifyToken(token: string): UserClaims;
    generateAuthCode(userId: string, clientId: string, redirectUri: string, codeChallenge?: string, codeChallengeMethod?: string): string;
    verifyAuthCode(code: string): {
        userId: string;
        clientId: string;
        redirectUri: string;
        codeChallenge?: string;
        codeChallengeMethod?: string;
    };
    generateTokenResponse(user: User, scopes: string[], nonce?: string): TokenResponse;
    generateUserInfoResponse(user: User): UserInfoResponse;
    generateWorkAdventureToken(user: User): string;
    generateJWKSKey(): {
        kty: string;
        use: string;
        kid: string;
        alg: string;
        n: string;
        e: string;
    };
}
//# sourceMappingURL=JWTService.d.ts.map