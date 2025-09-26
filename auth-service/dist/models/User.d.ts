export interface User {
    id: string;
    email: string;
    username: string;
    passwordHash: string;
    name: string;
    tags: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
}
export interface UserClaims {
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
}
export interface AuthCode {
    code: string;
    userId: string;
    clientId: string;
    redirectUri: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
    expiresAt: Date;
    createdAt: Date;
}
export interface OIDCDiscoveryConfig {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    userinfo_endpoint: string;
    jwks_uri: string;
    response_types_supported: string[];
    grant_types_supported: string[];
    scopes_supported: string[];
    claims_supported: string[];
    id_token_signing_alg_values_supported: string[];
    token_endpoint_auth_methods_supported: string[];
}
export interface CreateUserData {
    email: string;
    username: string;
    passwordHash: string;
    name: string;
    tags?: string[];
}
export interface UpdateUserData {
    name?: string;
    username?: string;
    tags?: string[];
    isActive?: boolean;
}
//# sourceMappingURL=User.d.ts.map