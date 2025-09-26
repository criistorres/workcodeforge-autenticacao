import { z } from 'zod';
export declare const AuthorizationRequestSchema: z.ZodObject<{
    client_id: z.ZodString;
    redirect_uri: z.ZodString;
    response_type: z.ZodEnum<["code"]>;
    scope: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    state: z.ZodString;
    code_challenge: z.ZodOptional<z.ZodString>;
    code_challenge_method: z.ZodOptional<z.ZodEnum<["S256", "plain"]>>;
    nonce: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    client_id: string;
    redirect_uri: string;
    response_type: "code";
    scope: string;
    state: string;
    code_challenge?: string | undefined;
    code_challenge_method?: "S256" | "plain" | undefined;
    nonce?: string | undefined;
}, {
    client_id: string;
    redirect_uri: string;
    response_type: "code";
    state: string;
    scope?: string | undefined;
    code_challenge?: string | undefined;
    code_challenge_method?: "S256" | "plain" | undefined;
    nonce?: string | undefined;
}>;
export declare const TokenRequestSchema: z.ZodObject<{
    grant_type: z.ZodEnum<["authorization_code", "refresh_token"]>;
    code: z.ZodOptional<z.ZodString>;
    redirect_uri: z.ZodOptional<z.ZodString>;
    client_id: z.ZodString;
    client_secret: z.ZodString;
    refresh_token: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    client_id: string;
    grant_type: "authorization_code" | "refresh_token";
    client_secret: string;
    code?: string | undefined;
    redirect_uri?: string | undefined;
    refresh_token?: string | undefined;
}, {
    client_id: string;
    grant_type: "authorization_code" | "refresh_token";
    client_secret: string;
    code?: string | undefined;
    redirect_uri?: string | undefined;
    refresh_token?: string | undefined;
}>;
export declare const UserInfoRequestSchema: z.ZodObject<{
    access_token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    access_token: string;
}, {
    access_token: string;
}>;
export type AuthorizationRequest = z.infer<typeof AuthorizationRequestSchema>;
export type TokenRequest = z.infer<typeof TokenRequestSchema>;
export type UserInfoRequest = z.infer<typeof UserInfoRequestSchema>;
//# sourceMappingURL=OIDCSchema.d.ts.map