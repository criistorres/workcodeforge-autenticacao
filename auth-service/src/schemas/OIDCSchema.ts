import { z } from 'zod';

// Schema para validação de parâmetros de autorização
export const AuthorizationRequestSchema = z.object({
  client_id: z.string().min(1, 'Client ID é obrigatório'),
  redirect_uri: z.string().url('Redirect URI deve ser uma URL válida'),
  response_type: z.enum(['code'], { message: 'Response type deve ser "code"' }),
  scope: z.string().optional().default('openid profile email'),
  state: z.string().min(1, 'State é obrigatório'),
  code_challenge: z.string().optional(),
  code_challenge_method: z.enum(['S256', 'plain']).optional(),
  nonce: z.string().optional()
});

// Schema para validação de token request
export const TokenRequestSchema = z.object({
  grant_type: z.enum(['authorization_code', 'refresh_token'], { message: 'Grant type inválido' }),
  code: z.string().optional(),
  redirect_uri: z.string().url('Redirect URI deve ser uma URL válida').optional(),
  client_id: z.string().min(1, 'Client ID é obrigatório'),
  client_secret: z.string().min(1, 'Client secret é obrigatório'),
  refresh_token: z.string().optional()
});

// Schema para validação de userinfo request
export const UserInfoRequestSchema = z.object({
  access_token: z.string().min(1, 'Access token é obrigatório')
});

// Tipos TypeScript derivados
export type AuthorizationRequest = z.infer<typeof AuthorizationRequestSchema>;
export type TokenRequest = z.infer<typeof TokenRequestSchema>;
export type UserInfoRequest = z.infer<typeof UserInfoRequestSchema>;
