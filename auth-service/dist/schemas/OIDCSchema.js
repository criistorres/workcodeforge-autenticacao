"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserInfoRequestSchema = exports.TokenRequestSchema = exports.AuthorizationRequestSchema = void 0;
const zod_1 = require("zod");
exports.AuthorizationRequestSchema = zod_1.z.object({
    client_id: zod_1.z.string().min(1, 'Client ID é obrigatório'),
    redirect_uri: zod_1.z.string().url('Redirect URI deve ser uma URL válida'),
    response_type: zod_1.z.enum(['code'], { message: 'Response type deve ser "code"' }),
    scope: zod_1.z.string().optional().default('openid profile email'),
    state: zod_1.z.string().min(1, 'State é obrigatório'),
    code_challenge: zod_1.z.string().optional(),
    code_challenge_method: zod_1.z.enum(['S256', 'plain']).optional(),
    nonce: zod_1.z.string().optional()
});
exports.TokenRequestSchema = zod_1.z.object({
    grant_type: zod_1.z.enum(['authorization_code', 'refresh_token'], { message: 'Grant type inválido' }),
    code: zod_1.z.string().optional(),
    redirect_uri: zod_1.z.string().url('Redirect URI deve ser uma URL válida').optional(),
    client_id: zod_1.z.string().min(1, 'Client ID é obrigatório'),
    client_secret: zod_1.z.string().min(1, 'Client secret é obrigatório'),
    refresh_token: zod_1.z.string().optional()
});
exports.UserInfoRequestSchema = zod_1.z.object({
    access_token: zod_1.z.string().min(1, 'Access token é obrigatório')
});
//# sourceMappingURL=OIDCSchema.js.map