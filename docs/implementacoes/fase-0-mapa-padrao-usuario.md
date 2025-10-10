# FASE 0: Sistema de Mapa Padrão por Usuário

**Data de Implementação**: 10/10/2025
**Status**: ✅ Backend Completo | ⚠️ Frontend Pendente
**Prioridade**: 🔴 CRÍTICA

---

## 📋 Resumo

Implementação do sistema que permite cada usuário ter um **mapa padrão** configurável, redirecionando automaticamente após o login para o mapa específico (ex: `filial1`, `filial2`, `sede`).

---

## ✅ Implementação Completa (Backend)

### 1. **Database - UserEntity**

**Arquivo**: `workadventure-auth/backend/src/users/entities/user.entity.ts`

```typescript
@Column({ nullable: true, length: 100 })
defaultMap: string;
```

- Campo `defaultMap` adicionado à entidade User
- Tipo: `string` (nullable, max 100 caracteres)
- Migration automática via TypeORM `synchronize: true`

**Validação Database**:
```sql
SELECT id, email, username, "defaultMap" FROM users WHERE email = 'email@email.com';
-- Result: defaultMap = 'filial1' ✅
```

---

### 2. **DTOs Atualizados**

#### RegisterDto
**Arquivo**: `workadventure-auth/backend/src/auth/dto/login.dto.ts`
```typescript
export class RegisterDto {
  email: string;
  password: string;
  name: string;
  username?: string;
  tags?: string[];
  defaultMap?: string;  // ✅ Novo campo
}
```

#### UpdateProfileDto
**Arquivo**: `workadventure-auth/backend/src/users/dto/update-profile.dto.ts`
```typescript
@IsOptional()
@IsString()
@Length(0, 100)
defaultMap?: string;  // ✅ Novo campo
```

#### ProfileResponseDto
**Arquivo**: `workadventure-auth/backend/src/users/dto/profile-response.dto.ts`
```typescript
export class ProfileResponseDto {
  // ... outros campos
  defaultMap?: string;  // ✅ Novo campo
}
```

---

### 3. **OIDC Claims**

#### Discovery Document
**Endpoint**: `/.well-known/openid-configuration`

**Arquivo**: `workadventure-auth/backend/src/oidc/oidc.controller.ts` (linha 28)
```typescript
claims_supported: ['sub', 'name', 'email', 'preferred_username', 'tags', 'email_verified', 'defaultMap']
```

**Validação**:
```bash
curl http://localhost:3000/.well-known/openid-configuration
# claims_supported inclui 'defaultMap' ✅
```

#### ID Token Claims
**Arquivo**: `workadventure-auth/backend/src/oidc/oidc.service.ts` (linha 89)
```typescript
const idTokenPayload: any = {
  iss: process.env.ISSUER_URL,
  sub: user.id,
  aud: authData.clientId,
  exp: now + 3600,
  iat: now,
  email: user.email,
  email_verified: true,
  name: user.name,
  preferred_username: user.username,
  tags: user.tags,
  defaultMap: user.defaultMap || 'main'  // ✅ Fallback para 'main'
};
```

#### UserInfo Endpoint
**Arquivo**: `workadventure-auth/backend/src/oidc/oidc.controller.ts` (linha 160)
```typescript
return {
  sub: user.id,
  email: user.email,
  email_verified: true,
  name: user.name,
  preferred_username: user.username,
  tags: user.tags,
  defaultMap: user.defaultMap || 'main'  // ✅
};
```

---

### 4. **Play Service (Pusher)**

#### Variável de Ambiente
**Arquivo**: `play/src/pusher/enums/EnvironmentVariable.ts` (linha 85)
```typescript
export const OPID_DEFAULTMAP_CLAIM = env.OPENID_DEFAULTMAP_CLAIM || env.OPID_DEFAULTMAP_CLAIM || "defaultMap";
```

#### OpenIDClient - getUserInfo
**Arquivo**: `play/src/pusher/services/OpenIDClient.ts` (linha 173)
```typescript
return {
  ...res,
  email: res.email ?? "",
  sub: res.sub,
  access_token: tokenSet.access_token ?? "",
  username: res[OPID_USERNAME_CLAIM] as string,
  locale: res[OPID_LOCALE_CLAIM] as string,
  tags: res[OPID_TAGS_CLAIM] as string[],
  defaultMap: res[OPID_DEFAULTMAP_CLAIM] as string | undefined,  // ✅
  matrix_url: res.matrix_url as string | undefined,
  matrix_identity_provider: res.matrix_identity_provider as string | undefined,
};
```

#### JWTTokenManager
**Arquivo**: `play/src/pusher/services/JWTTokenManager.ts`

**AuthTokenData Schema** (linha 11):
```typescript
export const AuthTokenData = z.object({
  identifier: z.string(),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  locale: z.string().optional(),
  tags: z.string().array().optional(),
  defaultMap: z.string().optional(),  // ✅
  matrixUserId: z.string().optional(),
});
```

**createAuthToken** (linha 44):
```typescript
public createAuthToken(
  identifier: string,
  accessToken?: string,
  username?: string,
  locale?: string,
  tags?: string[],
  defaultMap?: string,  // ✅ Novo parâmetro
  matrixUserId?: string
): string {
  return Jwt.sign({ identifier, accessToken, username, locale, tags, defaultMap, matrixUserId }, SECRET_KEY, {
    expiresIn: "30d",
  });
}
```

#### AuthenticateController - openIDCallback
**Arquivo**: `play/src/pusher/controllers/AuthenticateController.ts` (linha 325)
```typescript
const authToken = jwtTokenManager.createAuthToken(
  email,
  userInfo?.access_token,
  userInfo?.username,
  userInfo?.locale,
  userInfo?.tags,
  userInfo?.defaultMap,  // ✅ Passando defaultMap
  email ? matrixProvider.getBareMatrixIdFromEmail(email) : undefined
);
```

**Logs de Debug** (linhas 316-331):
```typescript
console.log("[OPENID-CALLBACK] userInfo.defaultMap:", userInfo?.defaultMap);
console.log("[OPENID-CALLBACK] Creating authToken with defaultMap");
// ...
const decoded = jwtTokenManager.verifyJWTToken(authToken, true);
console.log("[OPENID-CALLBACK] Token created with defaultMap:", decoded.defaultMap);
```

**Validação Logs**:
```
[OPENID-CALLBACK] userInfo.defaultMap: filial1
[OPENID-CALLBACK] Creating authToken with defaultMap
[OPENID-CALLBACK] Token created with defaultMap: filial1
✅ SUCESSO!
```

---

### 5. **Frontend Auth (Registro)**

**Arquivo**: `workadventure-auth/frontend/src/routes/Login.svelte`

#### Estado (linha 10):
```svelte
let defaultMap = 'main';
```

#### Campo no Formulário (linhas 341-361):
```svelte
<div class="space-y-2">
  <label for="defaultMap" class="block text-sm font-semibold text-gray-300 uppercase tracking-wider">
    Mapa Padrão
  </label>
  <div class="relative">
    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <span class="text-gray-500 text-xl">🗺️</span>
    </div>
    <select
      id="defaultMap"
      bind:value={defaultMap}
      disabled={loading}
      class="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
    >
      <option value="main">Principal (main)</option>
      <option value="filial1">Filial 1</option>
      <option value="filial2">Filial 2</option>
      <option value="sede">Sede</option>
    </select>
  </div>
</div>
```

#### Envio no Body (linha 224):
```svelte
const body = isRegister
  ? { email, password, name, defaultMap }  // ✅ Inclui defaultMap
  : { email, password };
```

---

### 6. **Admin Panel**

**Arquivo**: `workadventure-auth/frontend/src/routes/admin/UserDetail.svelte`

#### FormData (linha 22):
```svelte
let formData = {
  name: '',
  email: '',
  username: '',
  isActive: true,
  defaultMap: 'main',  // ✅
};
```

#### Carregar Dados do Usuário (linha 34):
```svelte
formData = {
  name: user.name,
  email: user.email,
  username: user.username,
  isActive: user.isActive,
  defaultMap: user.defaultMap || 'main',  // ✅
};
```

#### Campo de Edição (linhas 187-195):
```svelte
<div>
  <label class="block text-sm font-medium text-dark-700 mb-2">Mapa Padrão</label>
  <select bind:value={formData.defaultMap} class="input">
    <option value="main">Principal (main)</option>
    <option value="filial1">Filial 1</option>
    <option value="filial2">Filial 2</option>
    <option value="sede">Sede</option>
  </select>
</div>
```

#### Exibição (linhas 249-252):
```svelte
<div>
  <p class="text-xs text-dark-500 uppercase tracking-wide mb-1">Mapa Padrão</p>
  <p class="text-dark-900 font-medium">🗺️ {user.defaultMap || 'main'}</p>
</div>
```

---

## ⚠️ Pendente: Frontend Play

### Comportamento Atual

Após login, o usuário é redirecionado para:
```
http://play.workadventure.localhost/_/global/maps.workadventure.localhost/starter/bots.json
```

Isso acontece porque o frontend do Play **ainda não lê** o `defaultMap` do JWT e não faz o redirecionamento inteligente.

### O que precisa ser implementado

1. **Decodificar JWT no frontend** e extrair `defaultMap`
2. **Redirecionar automaticamente** para o mapa configurado
3. **Permitir navegação livre** entre mapas após o primeiro acesso

### Arquivos para modificar

- `play/src/front/Connection/ConnectionManager.ts`
- `play/src/front/Url/UrlManager.ts`
- Ou criar lógica personalizada no entry point

---

## 🧪 Testes Realizados

### ✅ Database
```sql
SELECT id, email, username, "defaultMap" FROM users WHERE email = 'email@email.com';
```
**Resultado**: `defaultMap = 'filial1'` ✅

### ✅ OIDC Discovery
```bash
curl http://localhost:3000/.well-known/openid-configuration
```
**Resultado**: `claims_supported` inclui `'defaultMap'` ✅

### ✅ JWT Creation
**Logs do Play**:
```
[OPENID-CALLBACK] userInfo.defaultMap: filial1
[OPENID-CALLBACK] Creating authToken with defaultMap
[OPENID-CALLBACK] Token created with defaultMap: filial1
```
✅ **SUCESSO!**

---

## 📊 Status Final

| Componente | Status | Observações |
|------------|--------|-------------|
| **Database Schema** | ✅ | Campo `defaultMap` criado |
| **Auth Backend DTOs** | ✅ | RegisterDto, UpdateProfileDto, ProfileResponseDto |
| **OIDC Claims** | ✅ | Discovery, ID Token, UserInfo |
| **JWT** | ✅ | `defaultMap` incluído no authToken |
| **Play Pusher** | ✅ | `defaultMap` extraído do userinfo |
| **Frontend Auth** | ✅ | Campo no registro com select |
| **Admin Panel** | ✅ | Edição e visualização |
| **Frontend Play** | ❌ | **Redirecionamento não implementado** |

---

## 🚀 Próximos Passos

1. **Implementar lógica no frontend do Play** para ler `defaultMap` do JWT
2. **Redirecionar automaticamente** para o mapa configurado
3. **Remover logs de debug** do AuthenticateController
4. **Testar com múltiplos usuários** e diferentes mapas
5. **Documentar para usuários finais**

---

## 🔗 Referências

- **ROADMAP**: `ROADMAP.md` - FASE 0
- **Auth Backend**: `workadventure-auth/backend/`
- **Play Service**: `play/src/pusher/`
- **Frontend Auth**: `workadventure-auth/frontend/`
- **Admin Panel**: `admin/frontend/` (se existir estrutura separada)

---

**Desenvolvedor**: Cristian Torres
**Assistente**: Claude Code
**Data**: 10/10/2025
