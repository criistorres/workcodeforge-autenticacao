# 🔐 WorkAdventure - Servidor de Autenticação OIDC Customizado

Sistema completo de autenticação OpenID Connect (OIDC) para WorkAdventure self-hosted, desenvolvido com **NestJS** (backend) e **Svelte** (frontend).

---

## 📋 Índice

- [Arquitetura](#-arquitetura)
- [Pré-requisitos](#-pré-requisitos)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Validação e Testes](#-validação-e-testes)
- [Uso](#-uso)
- [Troubleshooting](#-troubleshooting)
- [API Reference](#-api-reference)

---

## 🏗️ Arquitetura

### Backend (NestJS)
- **OIDC Provider** completo compatível com OpenID Connect
- Autenticação JWT com assinatura RSA256
- Armazenamento em memória (Map) para usuários e authorization codes
- Endpoints padrão OIDC: discovery, authorize, token, userinfo, logout, jwks

### Frontend (Svelte)
- Interface de login/registro responsiva
- Captura automática de parâmetros OIDC da URL
- Redirecionamento seguro após autenticação

### Fluxo de Autenticação
```
1. Usuário → WorkAdventure
2. WorkAdventure → /authorize (Backend OIDC)
3. Backend → /login (Frontend Svelte)
4. Usuário faz login → POST /auth/login
5. Backend gera authorization code
6. Redirect → WorkAdventure com code
7. WorkAdventure → POST /token
8. Backend retorna access_token + id_token
9. Usuário autenticado ✓
```

---

## 📦 Pré-requisitos

- ✅ Node.js 18+
- ✅ Docker e Docker Compose
- ✅ WorkAdventure self-hosted rodando localmente
- ✅ OpenSSL (para geração de chaves RSA)

---

## 📁 Estrutura do Projeto

```
workadventure-auth/
├── backend/                      # Servidor NestJS
│   ├── keys/
│   │   ├── private.key          # Chave privada RSA (gerada)
│   │   └── public.key           # Chave pública RSA (gerada)
│   ├── src/
│   │   ├── auth/                # Módulo de autenticação
│   │   │   ├── dto/
│   │   │   │   └── login.dto.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.module.ts
│   │   ├── oidc/                # OIDC Provider
│   │   │   ├── oidc.service.ts
│   │   │   ├── oidc.controller.ts
│   │   │   └── oidc.module.ts
│   │   ├── users/               # Gerenciamento de usuários
│   │   │   ├── user.entity.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                     # Interface Svelte
    ├── src/
    │   ├── routes/
    │   │   └── Login.svelte     # Página de login
    │   ├── App.svelte
    │   ├── main.js
    │   └── app.css
    ├── index.html
    ├── vite.config.js
    ├── svelte.config.js
    └── package.json
```

---

## 🚀 Instalação

### 1. Clonar/Navegar para o projeto

```bash
cd /Users/cristiantorres/Documents/GitHub/workcodeforge-autenticacao/workadventure-auth
```

### 2. Instalar dependências

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

---

## ⚙️ Configuração

### 1. Configurar /etc/hosts

Adicione a entrada para o servidor de autenticação:

```bash
echo "127.0.0.1 auth.workadventure.localhost" | sudo tee -a /etc/hosts
```

**Verificar:**
```bash
cat /etc/hosts | grep auth.workadventure.localhost
```

Deve retornar:
```
127.0.0.1 auth.workadventure.localhost
```

---

### 2. Verificar chaves RSA

As chaves já foram geradas. Verificar:

```bash
cd backend
ls -la keys/
```

Deve mostrar:
```
-rw-r--r--  private.key  (1675 bytes)
-rw-r--r--  public.key   (451 bytes)
```

**Se as chaves não existirem, gere:**
```bash
openssl genrsa -out keys/private.key 2048
openssl rsa -in keys/private.key -pubout -out keys/public.key
```

---

### 3. Configurar variáveis de ambiente

**Backend (.env):**

Arquivo já criado em `backend/.env`:

```bash
# Servidor
PORT=3000
NODE_ENV=development

# URLs
ISSUER_URL=http://auth.workadventure.localhost:3000
FRONTEND_URL=http://auth.workadventure.localhost:3000

# Cliente WorkAdventure
WORKADVENTURE_CLIENT_ID=workadventure-local
WORKADVENTURE_CLIENT_SECRET=my-super-secret-key-for-local-dev

# Redirect URIs permitidas
ALLOWED_REDIRECT_URIS=http://play.workadventure.localhost/login-callback,http://play.workadventure.localhost/oauth2/callback

# CORS
CORS_ORIGIN=http://play.workadventure.localhost

# Logout
DEFAULT_LOGOUT_REDIRECT=http://play.workadventure.localhost
```

---

### 4. Configurar WorkAdventure

Editar o arquivo `.env` do WorkAdventure (um nível acima):

```bash
cd /Users/cristiantorres/Documents/GitHub/workcodeforge-autenticacao
nano .env  # ou vim .env
```

**Verificar/confirmar estas configurações:**

```bash
# OpenID Connect
OPENID_CLIENT_ID=workadventure-local
OPENID_CLIENT_SECRET=my-super-secret-key-for-local-dev
OPENID_CLIENT_ISSUER=http://auth.workadventure.localhost:3000
OPENID_SCOPE=openid email profile tags-scope
OPENID_USERNAME_CLAIM=preferred_username
OPENID_TAGS_CLAIM=tags
DISABLE_ANONYMOUS=true
```

**Comentar/desabilitar OIDC mock (se existir):**
```bash
# OPID_PROFILE_SCREEN_PROVIDER=oidc-mock
# OIDC_ISSUER=http://oidc.workadventure.localhost
# OIDC_CLIENT_ID=workadventure
# OIDC_CLIENT_SECRET=secret
```

---

## ✅ Validação e Testes

### **Teste 1: Verificar Backend (compilação)**

```bash
cd backend
npm run build
```

✅ **Esperado:** Compilação sem erros, pasta `dist/` criada

---

### **Teste 2: Iniciar Backend**

```bash
npm run start:dev
```

✅ **Esperado:**
```
🚀 Auth server running on http://localhost:3000
📝 Discovery: http://localhost:3000/.well-known/openid-configuration
```

**Deixe este terminal rodando!**

---

### **Teste 3: Verificar Discovery Document**

Em **outro terminal**, execute:

```bash
curl http://localhost:3000/.well-known/openid-configuration | jq
```

✅ **Esperado:** JSON com endpoints OIDC:
```json
{
  "issuer": "http://auth.workadventure.localhost:3000",
  "authorization_endpoint": "http://auth.workadventure.localhost:3000/authorize",
  "token_endpoint": "http://auth.workadventure.localhost:3000/token",
  "userinfo_endpoint": "http://auth.workadventure.localhost:3000/userinfo",
  "jwks_uri": "http://auth.workadventure.localhost:3000/.well-known/jwks",
  ...
}
```

---

### **Teste 4: Verificar JWKS (Chaves Públicas)**

```bash
curl http://localhost:3000/.well-known/jwks | jq
```

✅ **Esperado:** JSON com chave pública RSA:
```json
{
  "keys": [
    {
      "kty": "RSA",
      "n": "...",
      "e": "AQAB",
      "kid": "key-1",
      "use": "sig",
      "alg": "RS256"
    }
  ]
}
```

---

### **Teste 5: Testar Login (user1)**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "[email protected]",
    "password": "pwd"
  }' | jq
```

✅ **Esperado:**
```json
{
  "userId": "1",
  "email": "[email protected]",
  "name": "User 1",
  "tags": ["admin", "moderator"]
}
```

---

### **Teste 6: Testar Login (user2)**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "[email protected]",
    "password": "pwd"
  }' | jq
```

✅ **Esperado:**
```json
{
  "userId": "2",
  "email": "[email protected]",
  "name": "User 2",
  "tags": ["member"]
}
```

---

### **Teste 7: Testar Login Inválido**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "[email protected]",
    "password": "wrong"
  }'
```

✅ **Esperado:** HTTP 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

---

### **Teste 8: Testar Registro de Novo Usuário**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "[email protected]",
    "password": "test123",
    "name": "Teste User"
  }' | jq
```

✅ **Esperado:**
```json
{
  "userId": "...",
  "email": "[email protected]",
  "name": "Teste User",
  "tags": ["member"]
}
```

---

### **Teste 9: Fazer login com novo usuário**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "[email protected]",
    "password": "test123"
  }' | jq
```

✅ **Esperado:** Sucesso com dados do novo usuário

---

### **Teste 10: Verificar Frontend (Opcional)**

Se quiser testar a interface:

```bash
cd ../frontend
npm run dev
```

✅ **Esperado:**
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
```

**Abrir navegador:** `http://localhost:3000/`

✅ Deve exibir página de login roxa/azul com:
- Formulário de login
- Toggle para registro
- Lista de usuários de teste

---

### **Teste 11: Reiniciar WorkAdventure**

**⚠️ Importante:** Certifique-se que Docker está rodando!

```bash
cd /Users/cristiantorres/Documents/GitHub/workcodeforge-autenticacao

# Parar containers
docker-compose down

# Iniciar novamente
docker-compose up -d
```

✅ **Esperado:** Containers iniciados sem erro

**Verificar logs:**
```bash
docker-compose logs -f pusher
```

Procure por mensagens relacionadas a OIDC/OpenID.

---

### **Teste 12: Teste Completo (End-to-End)**

**Setup:**
1. ✅ Backend rodando (`npm run start:dev` no terminal 1)
2. ✅ WorkAdventure rodando (`docker-compose up -d`)

**Fluxo:**

1. **Abrir WorkAdventure no navegador:**
   ```
   http://play.workadventure.localhost/
   ```

2. ✅ **Esperado:** Redirecionamento automático para:
   ```
   http://auth.workadventure.localhost:3000/login?client_id=...&redirect_uri=...
   ```

3. **Fazer login:**
   - Email: `[email protected]`
   - Senha: `pwd`
   - Clicar em "🔐 Entrar"

4. ✅ **Esperado:**
   - Redirecionamento para WorkAdventure
   - Usuário autenticado com nome "User 1"
   - Tags: `admin, moderator`

5. **Verificar no console do navegador (F12):**
   - Não deve haver erros de CORS
   - Token JWT deve estar presente

6. **Verificar logs do pusher:**
   ```bash
   docker-compose logs pusher | grep -i "user\|auth\|token"
   ```

   ✅ Deve mostrar autenticação bem-sucedida

---

### **Teste 13: Testar Logout**

1. No WorkAdventure, fazer logout
2. ✅ **Esperado:** Redirecionamento para página inicial
3. Acessar novamente: deve pedir login novamente

---

### **Teste 14: Testar com User 2**

Repetir Teste 12 com:
- Email: `[email protected]`
- Senha: `pwd`

✅ **Esperado:** Autenticação com tags `member`

---

### **Teste 15: Testar Registro via UI**

1. Acessar `http://play.workadventure.localhost/`
2. Será redirecionado para login
3. Clicar em "Não tem conta? Registrar"
4. Preencher:
   - Nome: "Novo Usuário"
   - Email: "[email protected]"
   - Senha: "senha123"
5. Clicar em "📝 Registrar"

✅ **Esperado:** Login automático e redirecionamento para WorkAdventure

---

## 🎮 Uso

### Iniciar o Sistema

**Terminal 1 - Backend:**
```bash
cd workadventure-auth/backend
npm run start:watch  # Hot reload
```

**Terminal 2 - WorkAdventure:**
```bash
cd /Users/cristiantorres/Documents/GitHub/workcodeforge-autenticacao
docker-compose up -d
```

**Terminal 3 - Logs (opcional):**
```bash
docker-compose logs -f pusher
```

### Parar o Sistema

```bash
# Parar backend: Ctrl+C no terminal

# Parar WorkAdventure:
cd /Users/cristiantorres/Documents/GitHub/workcodeforge-autenticacao
docker-compose down
```

---

## 🐛 Troubleshooting

### Problema: "Cannot connect to auth server"

**Solução 1:** Verificar se backend está rodando
```bash
curl http://localhost:3000/.well-known/openid-configuration
```

**Solução 2:** Verificar /etc/hosts
```bash
cat /etc/hosts | grep auth.workadventure
```
Deve conter: `127.0.0.1 auth.workadventure.localhost`

---

### Problema: "CORS error"

**Causa:** CORS_ORIGIN incorreto no backend `.env`

**Solução:**
```bash
cd backend
cat .env | grep CORS_ORIGIN
```
Deve ser: `CORS_ORIGIN=http://play.workadventure.localhost`

**Reiniciar backend após alterar.**

---

### Problema: "JWT validation failed"

**Causa:** Chaves RSA corrompidas ou ausentes

**Solução:** Regenerar chaves
```bash
cd backend
rm keys/private.key keys/public.key
openssl genrsa -out keys/private.key 2048
openssl rsa -in keys/private.key -pubout -out keys/public.key
```

**Reiniciar backend.**

---

### Problema: "Invalid client"

**Causa:** CLIENT_ID ou CLIENT_SECRET não correspondem

**Solução:** Verificar ambos `.env`:

**Backend:**
```bash
cd backend
grep -E "WORKADVENTURE_CLIENT_ID|WORKADVENTURE_CLIENT_SECRET" .env
```

**WorkAdventure:**
```bash
cd ..
grep -E "OPENID_CLIENT_ID|OPENID_CLIENT_SECRET" .env
```

Devem ser idênticos:
- `workadventure-local`
- `my-super-secret-key-for-local-dev`

---

### Problema: WorkAdventure não redireciona para login

**Causa:** `DISABLE_ANONYMOUS` não configurado

**Solução:**
```bash
cd /Users/cristiantorres/Documents/GitHub/workcodeforge-autenticacao
grep DISABLE_ANONYMOUS .env
```

Deve ser: `DISABLE_ANONYMOUS=true`

**Reiniciar WorkAdventure:**
```bash
docker-compose restart
```

---

### Problema: "404 Not Found" no frontend

**Causa:** Frontend não está rodando ou porta incorreta

**Solução:**
```bash
cd frontend
npm run dev
```

Verificar que está na porta 3000 (mesmo do backend via proxy reverso).

---

### Problema: Docker não inicia

**Erro:** `Cannot connect to Docker daemon`

**Solução:** Abrir Docker Desktop ou iniciar Docker:
```bash
open -a Docker  # macOS
```

Aguardar inicialização completa e tentar novamente.

---

## 📚 API Reference

### Authentication Endpoints

#### POST /auth/login
Autenticar usuário existente.

**Request:**
```json
{
  "email": "[email protected]",
  "password": "pwd"
}
```

**Response 200:**
```json
{
  "userId": "1",
  "email": "[email protected]",
  "name": "User 1",
  "tags": ["admin", "moderator"]
}
```

---

#### POST /auth/register
Registrar novo usuário.

**Request:**
```json
{
  "email": "[email protected]",
  "password": "senha123",
  "name": "Novo Usuário"
}
```

**Response 200:**
```json
{
  "userId": "uuid-gerado",
  "email": "[email protected]",
  "name": "Novo Usuário",
  "tags": ["member"]
}
```

---

#### POST /auth/authorize
Gerar authorization code (uso interno).

**Request:**
```json
{
  "userId": "1",
  "clientId": "workadventure-local",
  "redirectUri": "http://play.workadventure.localhost/login-callback",
  "scope": "openid email profile tags-scope",
  "state": "random-state",
  "nonce": "random-nonce"
}
```

**Response 200:**
```json
{
  "code": "authorization-code-hex"
}
```

---

### OIDC Endpoints

#### GET /.well-known/openid-configuration
Discovery document (metadata do OIDC Provider).

**Response 200:**
```json
{
  "issuer": "http://auth.workadventure.localhost:3000",
  "authorization_endpoint": "http://auth.workadventure.localhost:3000/authorize",
  "token_endpoint": "http://auth.workadventure.localhost:3000/token",
  "userinfo_endpoint": "http://auth.workadventure.localhost:3000/userinfo",
  "jwks_uri": "http://auth.workadventure.localhost:3000/.well-known/jwks",
  "end_session_endpoint": "http://auth.workadventure.localhost:3000/logout",
  ...
}
```

---

#### GET /.well-known/jwks
JSON Web Key Set (chaves públicas para validação JWT).

**Response 200:**
```json
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "key-1",
      "use": "sig",
      "alg": "RS256",
      ...
    }
  ]
}
```

---

#### GET /authorize
Iniciar fluxo de autorização.

**Query Params:**
- `client_id`: ID do cliente
- `redirect_uri`: URI de redirecionamento
- `response_type`: `code`
- `scope`: `openid email profile tags-scope`
- `state`: Estado aleatório
- `nonce`: Nonce aleatório

**Response:** Redirect para página de login

---

#### POST /token
Trocar authorization code por tokens.

**Request:**
```
grant_type=authorization_code
code=authorization-code
client_id=workadventure-local
client_secret=my-super-secret-key-for-local-dev
redirect_uri=http://play.workadventure.localhost/login-callback
```

**Response 200:**
```json
{
  "access_token": "jwt-token",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "jwt-id-token",
  "scope": "openid email profile tags-scope"
}
```

---

#### GET /userinfo
Obter informações do usuário autenticado.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "sub": "1",
  "email": "[email protected]",
  "email_verified": true,
  "name": "User 1",
  "preferred_username": "user1",
  "tags": ["admin", "moderator"]
}
```

---

#### GET /logout
Fazer logout.

**Query Params:**
- `post_logout_redirect_uri` (opcional): URI de redirecionamento

**Response:** Redirect para WorkAdventure

---

## 👥 Usuários de Teste

| Email | Senha | Nome | Tags |
|-------|-------|------|------|
| [email protected] | pwd | User 1 | admin, moderator |
| [email protected] | pwd | User 2 | member |

---

## 🔒 Segurança

- ✅ JWT assinado com RSA256 (2048-bit)
- ✅ Authorization codes com expiração (10 minutos)
- ✅ Tokens com expiração (1 hora)
- ✅ Passwords hash com bcrypt (salt rounds: 10)
- ✅ CORS configurado
- ✅ Validação de redirect_uri

**⚠️ Produção:**
- Usar banco de dados (PostgreSQL)
- Implementar refresh tokens
- Habilitar HTTPS
- Rate limiting
- Logging e monitoramento

---

## 📝 Notas

- Sistema funciona em **memória** (dados perdidos ao reiniciar)
- Ideal para **desenvolvimento local**
- Para produção, migrar para banco de dados
- Porta **3000** usada tanto para backend quanto frontend (via proxy reverso ou configuração)

---

## 🚀 Próximos Passos

1. ✅ **Adicionar PostgreSQL** para persistência
2. ✅ **Implementar refresh tokens**
3. ✅ **Criar interface de administração**
4. ✅ **Adicionar PKCE** (Proof Key for Code Exchange)
5. ✅ **Configurar HTTPS** (Let's Encrypt)
6. ✅ **Adicionar rate limiting**
7. ✅ **Implementar logging estruturado**

---

## 📞 Suporte

Em caso de dúvidas ou problemas, verificar:
1. Logs do backend
2. Logs do WorkAdventure (`docker-compose logs`)
3. Console do navegador (F12)
4. Seção Troubleshooting deste README

---

**Desenvolvido com ❤️ para WorkAdventure**
