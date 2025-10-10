# Fase 0: Lobby e Login In-Game

**Status**: ✅ Implementado
**Data**: 07/10/2025
**Prioridade**: 🔴 CRÍTICA

## 📋 Objetivo

Implementar um sistema de roteamento de mapas baseado em autenticação, onde:
- Usuários **não autenticados** veem o mapa de **lobby** (`chatzone.json`)
- Usuários **autenticados** veem o mapa **principal** (`map.json`)
- Após login, o usuário é automaticamente redirecionado para o mapa principal
- Sistema não quebra o fluxo atual de autenticação

---

## 🎯 Entregas Realizadas

### ✅ 1. Endpoint `/auth/check-session` (Backend Auth)

**Arquivos modificados:**
- `workadventure-auth/backend/src/auth/auth.controller.ts`
- `workadventure-auth/backend/src/auth/auth.service.ts`

**Funcionalidade:**
- Endpoint GET que verifica se o usuário possui sessão ativa
- Lê o cookie `auth_token` ou header `Authorization`
- Retorna `{ authenticated: boolean, user?: UserData }`
- Valida JWT e busca dados do usuário

**Exemplo de resposta:**
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "username": "username",
    "tags": ["admin", "moderator"]
  }
}
```

---

### ✅ 2. Cookies Cross-Domain

**Arquivos modificados:**
- `workadventure-auth/backend/src/main.ts` - Configuração CORS e cookie-parser
- `workadventure-auth/backend/src/oidc/oidc.controller.ts` - Criação e remoção de cookies
- `workadventure-auth/backend/package.json` - Dependências

**Implementação:**

#### Cookie criado no `/token` endpoint:
```typescript
res.cookie('auth_token', tokens.accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  domain: '.workadventure.localhost',
  maxAge: 3600000, // 1 hora
  path: '/'
});
```

#### Cookie removido no `/logout` endpoint:
```typescript
res.clearCookie('auth_token', {
  domain: '.workadventure.localhost',
  path: '/'
});
```

#### CORS configurado para aceitar múltiplas origens:
```typescript
app.enableCors({
  origin: [
    'http://play.workadventure.localhost',
    'http://auth.workadventure.localhost',
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-User-Id', 'Cookie']
});
```

---

### ✅ 3. Variáveis de Ambiente

**Arquivos modificados:**
- `.env` e `.env.template`
- `play/src/pusher/enums/EnvironmentVariableValidator.ts`
- `play/src/pusher/enums/EnvironmentVariable.ts`
- `play/src/common/FrontConfigurationInterface.ts`
- `play/src/front/Enum/EnvironmentVariable.ts`

**Variáveis adicionadas:**
```bash
LOBBY_MAP_URL=/_/global/maps.workadventure.localhost/starter/chatzone.json
MAIN_MAP_URL=/_/global/maps.workadventure.localhost/starter/map.json
```

**Mapas utilizados:**
- **Lobby**: `maps/starter/chatzone.json`
- **Principal**: `maps/starter/map.json`

---

### ✅ 4. SessionService (Frontend)

**Arquivo criado:**
- `play/src/front/Services/SessionService.ts`

**Funcionalidade:**
- Classe utilitária para verificar autenticação
- Faz request para `http://auth.workadventure.localhost/auth/check-session`
- Usa `credentials: 'include'` para enviar cookies cross-domain

**Métodos públicos:**
```typescript
// Retorna objeto completo com dados do usuário
static async checkSession(): Promise<SessionCheckResponse>

// Retorna apenas boolean
static async isAuthenticated(): Promise<boolean>
```

---

### ✅ 5. Roteamento no ConnectionManager

**Arquivo modificado:**
- `play/src/front/Connection/ConnectionManager.ts`

**Lógica implementada:**

1. **Verificação de autenticação** ao carregar aplicação vazia (primeira visita)
2. **Decisão de mapa** baseada no estado de autenticação:
   - Se autenticado → carrega `MAIN_MAP_URL`
   - Se não autenticado → carrega `LOBBY_MAP_URL`
3. **Proteção contra loops** com parâmetro `skipAuthRouting=true`

**Fluxo:**
```
Usuário acessa play.workadventure.localhost
  ↓
ConnectionManager.initGameConnexion()
  ↓
SessionService.isAuthenticated()
  ↓
if (autenticado) → carrega map.json
if (não autenticado) → carrega chatzone.json
```

---

### ✅ 6. Proteção Contra Loops

**Implementação:**
- Parâmetro URL `skipAuthRouting=true` para desabilitar roteamento automático
- Previne loops infinitos se houver erro na verificação de autenticação
- Permite fallback para comportamento padrão

**Código:**
```typescript
const skipAuthRouting = urlParams.get("skipAuthRouting");
if (skipAuthRouting === "true") {
  // Usa comportamento padrão (último mapa visitado)
  roomPath = localUserStore.getLastRoomUrl();
}
```

---

## 🔄 Fluxo Completo

### Cenário 1: Usuário Não Autenticado

```
1. User acessa http://play.workadventure.localhost
2. ConnectionManager chama SessionService.isAuthenticated()
3. SessionService faz GET /auth/check-session com cookies
4. Backend retorna { authenticated: false }
5. ConnectionManager carrega LOBBY_MAP_URL (chatzone.json)
6. Usuário vê mapa de lobby
7. Usuário clica em área/botão de login
8. Redirecionado para http://auth.workadventure.localhost/login
```

### Cenário 2: Após Login

```
1. User faz login no auth service
2. Backend cria cookie cross-domain auth_token
3. Usuário redirecionado de volta para play
4. ConnectionManager chama SessionService.isAuthenticated()
5. SessionService faz GET /auth/check-session (cookie enviado automaticamente)
6. Backend valida JWT e retorna { authenticated: true, user: {...} }
7. ConnectionManager carrega MAIN_MAP_URL (map.json)
8. Usuário vê mapa principal autenticado
```

### Cenário 3: Usuário Já Autenticado

```
1. User acessa http://play.workadventure.localhost
2. Cookie auth_token presente no navegador
3. SessionService faz GET /auth/check-session (cookie enviado)
4. Backend valida e retorna authenticated: true
5. ConnectionManager carrega MAIN_MAP_URL
6. Usuário vai direto para mapa principal
```

---

## 🛠️ Dependências Instaladas

```bash
cd workadventure-auth/backend
npm install cookie-parser @types/cookie-parser
```

---

## ⚙️ Configuração Necessária

### 1. Backend Auth (.env)
```bash
CORS_ORIGIN=http://play.workadventure.localhost
NODE_ENV=development  # ou 'production' para HTTPS
```

### 2. Frontend Play (.env)
```bash
LOBBY_MAP_URL=/_/global/maps.workadventure.localhost/starter/chatzone.json
MAIN_MAP_URL=/_/global/maps.workadventure.localhost/starter/map.json
```

### 3. Docker Compose
Garantir que os serviços estejam na mesma rede e com domínios corretos:
```yaml
services:
  play:
    labels:
      - "traefik.http.routers.play.rule=Host(`play.workadventure.localhost`)"

  auth-backend:
    labels:
      - "traefik.http.routers.auth.rule=Host(`auth.workadventure.localhost`)"
```

---

## 🧪 Como Testar

### 1. Iniciar Serviços
```bash
docker-compose up
```

### 2. Teste Não Autenticado
1. Limpar cookies do navegador
2. Acessar `http://play.workadventure.localhost`
3. **Esperado**: Carregar mapa `chatzone.json` (lobby)

### 3. Teste Login
1. Clicar em área de login no lobby
2. Fazer login com `user1@example.com` / `pwd`
3. **Esperado**: Redirecionar de volta e carregar `map.json`

### 4. Teste Já Autenticado
1. Com cookie válido, acessar `http://play.workadventure.localhost`
2. **Esperado**: Carregar diretamente `map.json` sem passar pelo lobby

### 5. Teste Logout
1. Fazer logout
2. **Esperado**: Cookie removido e voltar ao lobby

---

## 📊 Logs Úteis

### Backend Auth
```
[CHECK-SESSION] Verificando sessão...
[CHECK-SESSION] Token encontrado: eyJhbGc...
[CHECK-SESSION] Resultado: Autenticado
[TOKEN] Cookie cross-domain criado para: .workadventure.localhost
[LOGOUT] Cookie cross-domain removido
```

### Frontend Play
```
[ConnectionManager] Verificando autenticação para rotear mapa...
[SessionService] Verificando sessão de autenticação...
[SessionService] Sessão verificada: Autenticado
[SessionService] Usuário: User Name (user1@example.com)
[ConnectionManager] Usuário autenticado
[ConnectionManager] Carregando mapa principal: /_/global/maps.workadventure.localhost/starter/map.json
```

---

## ⚠️ Limitações Conhecidas

1. **Mapas Temporários**: Usando mapas padrão do WorkAdventure (não customizados para lobby)
2. **Sem Botão de Login Visual**: Usuário precisa clicar em área específica do mapa
3. **Cookie Apenas HTTP**: Não funciona em ambientes locais com HTTPS misto
4. **Sem Refresh Automático**: Após logout, pode precisar refresh manual

---

## 🚀 Próximos Passos (Fase 1)

1. Criar mapa de lobby customizado com botão de login visível
2. Implementar rate limiting no endpoint `/auth/check-session`
3. Adicionar sistema de recuperação de senha
4. Implementar verificação de email obrigatória
5. Melhorar UX do fluxo de login (modais in-game)

---

## 📝 Notas Técnicas

- **Cookie Domain**: `.workadventure.localhost` (com ponto inicial) permite acesso de todos subdomínios
- **SameSite**: `lax` permite navegação cross-site mas protege contra CSRF
- **HttpOnly**: Previne acesso via JavaScript (XSS protection)
- **Secure**: Apenas HTTPS em produção (false em localhost)
- **MaxAge**: 1 hora (3600000ms) - mesmo tempo de expiração do JWT

---

**Implementação concluída com sucesso! ✅**
