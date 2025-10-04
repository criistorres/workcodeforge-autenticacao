# 📚 Documentação Completa - Serviço de Autenticação Customizado WorkAdventure

## 📖 Índice

1. [Visão Geral](#-visão-geral)
2. [Arquitetura do Sistema](#-arquitetura-do-sistema)
3. [Componentes Principais](#-componentes-principais)
4. [Fluxo de Autenticação](#-fluxo-de-autenticação)
5. [Configuração e Instalação](#-configuração-e-instalação)
6. [API Reference](#-api-reference)
7. [Segurança](#-segurança)
8. [Deployment com Docker](#-deployment-com-docker)
9. [Troubleshooting](#-troubleshooting)
10. [Exemplos de Uso](#-exemplos-de-uso)

---

## 🎯 Visão Geral

Este é um **serviço de autenticação OpenID Connect (OIDC)** completo e customizado para WorkAdventure, desenvolvido para substituir o servidor OIDC mock padrão por uma solução própria de produção.

### Características Principais

- ✅ **Backend NestJS** - API robusta com TypeScript
- ✅ **Frontend Svelte** - Interface moderna e responsiva
- ✅ **OpenID Connect** - Protocolo padrão da indústria
- ✅ **JWT com RSA256** - Assinatura criptográfica segura
- ✅ **Docker Ready** - Containerizado e pronto para produção
- ✅ **Zero Dependencies** - Armazenamento em memória (desenvolvimento)
- ✅ **CORS Configurado** - Integração perfeita com WorkAdventure

### Tecnologias Utilizadas

**Backend:**
- NestJS 10.x
- TypeScript 5.x
- jsonwebtoken (JWT)
- bcrypt (hash de senhas)
- Node.js 18+

**Frontend:**
- Svelte 4.x
- Vite 5.x
- CSS Moderno

**Infraestrutura:**
- Docker & Docker Compose
- Traefik (reverse proxy)
- OpenSSL (geração de chaves RSA)

---

## 🏗️ Arquitetura do Sistema

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     WorkAdventure Ecosystem                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────────────────┐      │
│  │              │         │  Auth Service (Custom)    │      │
│  │ WorkAdventure│◄────────┤                          │      │
│  │   (Play)     │ OIDC    │  ┌────────────────────┐  │      │
│  │              │ Flow    │  │  Backend (NestJS)  │  │      │
│  └──────────────┘         │  │  - Auth Module     │  │      │
│         │                 │  │  - OIDC Module     │  │      │
│         │                 │  │  - Users Module    │  │      │
│         │                 │  └────────────────────┘  │      │
│         │                 │                          │      │
│         │                 │  ┌────────────────────┐  │      │
│         └─────────────────┼─►│ Frontend (Svelte)  │  │      │
│           Redirect        │  │  - Login Page      │  │      │
│                          │  │  - Register Page   │  │      │
│                          │  └────────────────────┘  │      │
│                          │                          │      │
│                          │  ┌────────────────────┐  │      │
│                          │  │  RSA Keys          │  │      │
│                          │  │  - private.key     │  │      │
│                          │  │  - public.key      │  │      │
│                          │  └────────────────────┘  │      │
│                          └──────────────────────────┘      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                    Traefik Reverse Proxy                     │
│  - play.workadventure.localhost                              │
│  - auth.workadventure.localhost                              │
│  - matrix.workadventure.localhost                            │
└─────────────────────────────────────────────────────────────┘
```

### Estrutura de Diretórios

```
workadventure-auth/
├── backend/                           # Servidor NestJS
│   ├── keys/                         # Chaves RSA (NÃO versionar!)
│   │   ├── private.key               # Chave privada RSA 2048-bit
│   │   └── public.key                # Chave pública RSA
│   │
│   ├── src/
│   │   ├── auth/                     # Módulo de Autenticação
│   │   │   ├── dto/
│   │   │   │   └── login.dto.ts      # DTOs de login/registro
│   │   │   ├── auth.controller.ts    # Endpoints de auth
│   │   │   ├── auth.service.ts       # Lógica de autenticação
│   │   │   └── auth.module.ts        # Módulo NestJS
│   │   │
│   │   ├── oidc/                     # Módulo OIDC Provider
│   │   │   ├── oidc.controller.ts    # Endpoints OIDC padrão
│   │   │   ├── oidc.service.ts       # Geração JWT e tokens
│   │   │   └── oidc.module.ts        # Módulo NestJS
│   │   │
│   │   ├── users/                    # Módulo de Usuários
│   │   │   ├── user.entity.ts        # Entidade User
│   │   │   ├── users.service.ts      # CRUD de usuários
│   │   │   └── users.module.ts       # Módulo NestJS
│   │   │
│   │   ├── app.module.ts             # Módulo raiz
│   │   └── main.ts                   # Bootstrap da aplicação
│   │
│   ├── .env                          # Configurações (NÃO versionar!)
│   ├── Dockerfile                    # Build de produção
│   ├── package.json                  # Dependências
│   └── tsconfig.json                 # Config TypeScript
│
├── frontend/                         # Interface Svelte
│   ├── src/
│   │   ├── routes/
│   │   │   └── Login.svelte          # Página de login/registro
│   │   ├── App.svelte                # Componente raiz
│   │   ├── main.js                   # Entry point
│   │   └── app.css                   # Estilos globais
│   │
│   ├── Dockerfile                    # Build de produção
│   ├── index.html                    # HTML base
│   ├── vite.config.js                # Config Vite
│   └── package.json                  # Dependências
│
└── README.md                         # Documentação principal
```

---

## 🧩 Componentes Principais

### 1. Backend - Auth Module

**Arquivo:** `backend/src/auth/auth.service.ts`

**Responsabilidades:**
- Validar credenciais de usuários
- Registrar novos usuários
- Gerar authorization codes OIDC
- Integração com UsersService e OidcService

**Principais Métodos:**

```typescript
// Autenticar usuário
async login(loginDto: LoginDto): Promise<UserResponse>

// Registrar novo usuário
async register(registerDto: RegisterDto): Promise<UserResponse>

// Gerar código de autorização OIDC
async authorize(userId: string, authParams: any): Promise<{ code: string }>
```

**Endpoints (auth.controller.ts):**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/login` | Login de usuário |
| POST | `/auth/register` | Registro de novo usuário |
| POST | `/auth/authorize` | Gerar authorization code |

---

### 2. Backend - OIDC Module

**Arquivo:** `backend/src/oidc/oidc.service.ts`

**Responsabilidades:**
- Implementar protocolo OpenID Connect
- Gerar e validar JWTs
- Gerenciar authorization codes
- Expor discovery document e JWKS

**Principais Métodos:**

```typescript
// Retornar chaves públicas (JWKS)
async getPublicKeys(): Promise<JWKSet>

// Gerar authorization code
async generateAuthorizationCode(data: AuthData): Promise<string>

// Validar authorization code
async validateAuthorizationCode(code: string): Promise<AuthData | null>

// Gerar access_token e id_token
async generateTokens(authData: AuthData): Promise<Tokens>

// Validar access token
async validateAccessToken(token: string): Promise<any>
```

**Endpoints (oidc.controller.ts):**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/.well-known/openid-configuration` | Discovery document |
| GET | `/.well-known/jwks` | JSON Web Key Set |
| GET | `/authorize` | Iniciar fluxo de autorização |
| POST | `/token` | Trocar code por tokens |
| GET | `/userinfo` | Informações do usuário |
| GET | `/logout` | Encerrar sessão |

---

### 3. Backend - Users Module

**Arquivo:** `backend/src/users/users.service.ts`

**Responsabilidades:**
- Gerenciar usuários em memória (Map)
- Hash de senhas com bcrypt
- CRUD de usuários
- Validação de senhas

**Principais Métodos:**

```typescript
// Buscar usuário por email
async findByEmail(email: string): Promise<User | undefined>

// Buscar usuário por ID
async findById(id: string): Promise<User | undefined>

// Criar novo usuário
async create(userData: Partial<User>): Promise<User>

// Validar senha
async validatePassword(user: User, password: string): Promise<boolean>

// Atualizar tags do usuário
async updateTags(userId: string, tags: string[]): Promise<User>
```

**Entidade User:**

```typescript
interface User {
  id: string;                // UUID ou ID sequencial
  email: string;             // Email único
  password: string;          // Hash bcrypt
  name: string;              // Nome completo
  username: string;          // Nome de usuário
  tags: string[];            // Roles/permissions (admin, member, etc)
  createdAt: Date;           // Data de criação
}
```

**Usuários de Teste Pré-criados:**

| Email | Senha | Nome | Tags |
|-------|-------|------|------|
| user1@example.com | pwd | User 1 | admin, moderator |
| user2@example.com | pwd | User 2 | member |
| admin@example.com | pwd | Admin User | admin, moderator |

---

### 4. Frontend - Login Component

**Arquivo:** `frontend/src/routes/Login.svelte`

**Responsabilidades:**
- Capturar parâmetros OIDC da URL (client_id, redirect_uri, state, nonce)
- Exibir formulário de login/registro
- Enviar credenciais para backend
- Redirecionar com authorization code

**Fluxo:**

1. Recebe parâmetros via query string:
   ```
   /login?client_id=workadventure-local&redirect_uri=...&state=...&nonce=...
   ```

2. Usuário preenche credenciais

3. POST para `/auth/login` ou `/auth/register`

4. Backend retorna userId

5. POST para `/auth/authorize` com userId + params OIDC

6. Backend retorna authorization code

7. Redirect para WorkAdventure:
   ```
   redirect_uri?code={code}&state={state}
   ```

---

## 🔄 Fluxo de Autenticação

### Fluxo Completo (Authorization Code Flow)

```
┌─────────┐                                      ┌─────────────┐
│         │                                      │             │
│  User   │                                      │ WorkAdvent. │
│ Browser │                                      │   (Play)    │
│         │                                      │             │
└────┬────┘                                      └──────┬──────┘
     │                                                  │
     │  1. Acessa http://play.workadventure.localhost  │
     ├─────────────────────────────────────────────────►
     │                                                  │
     │  2. Redirect to /authorize (sem autenticação)   │
     │◄─────────────────────────────────────────────────┤
     │                                                  │
     │                                                  │
     │              ┌──────────────────┐                │
     │              │                  │                │
     │  3. GET /authorize?              │ Auth Backend │
     │     client_id=...                │   (NestJS)   │
     │     redirect_uri=...             │              │
     │     response_type=code           │              │
     │     scope=openid...              │              │
     │     state=...                    │              │
     │     nonce=...                    │              │
     ├──────────────────────────────────►              │
     │                                  │              │
     │  4. Redirect to /login           │              │
     │     (com params preservados)     │              │
     │◄──────────────────────────────────              │
     │                                  │              │
     │              ┌──────────────────┐               │
     │              │                  │               │
     │  5. GET /login?params            │ Auth Frontend│
     ├──────────────────────────────────►   (Svelte)  │
     │                                  │              │
     │  6. Exibe formulário             │              │
     │◄──────────────────────────────────              │
     │                                  │              │
     │  7. Preenche credenciais         │              │
     │     Email: user1@example.com     │              │
     │     Senha: pwd                   │              │
     │                                  │              │
     │  8. POST /auth/login             │              │
     │     { email, password }          │              │
     ├──────────────────────────────────┼──────────────►
     │                                  │              │
     │  9. Valida credenciais           │              │
     │     Retorna { userId, ... }      │              │
     │◄─────────────────────────────────┼───────────────┤
     │                                  │              │
     │  10. POST /auth/authorize        │              │
     │      { userId, clientId, ... }   │              │
     ├──────────────────────────────────┼──────────────►
     │                                  │              │
     │  11. Gera authorization code     │              │
     │      Retorna { code }            │              │
     │◄─────────────────────────────────┼───────────────┤
     │                                  │              │
     │  12. Redirect to WorkAdventure   │              │
     │      redirect_uri?code=XXX&state=YYY            │
     ├─────────────────────────────────────────────────►
     │                                                  │
     │  13. POST /token                                 │
     │      grant_type=authorization_code               │
     │      code=XXX                                    │
     │      client_id=...                               │
     │      client_secret=...           ┌──────────────┐│
     │◄─────────────────────────────────┤              ││
     │                                  │ Auth Backend ││
     │  14. Valida code + client        │              ││
     │      Gera access_token + id_token│              ││
     │      Retorna tokens              │              ││
     ├──────────────────────────────────►              ││
     │                                  └──────────────┘│
     │  15. GET /userinfo                               │
     │      Authorization: Bearer {access_token}        │
     ├──────────────────────────────────────────────────►
     │                                                  │
     │  16. Retorna dados do usuário                    │
     │◄─────────────────────────────────────────────────┤
     │                                                  │
     │  17. Usuário autenticado!                        │
     │      Exibe mundo WorkAdventure                   │
     │◄─────────────────────────────────────────────────┤
     │                                                  │
```

### Detalhamento dos Passos

**Passos 1-2:** WorkAdventure detecta usuário não autenticado e inicia fluxo OIDC

**Passo 3:** WorkAdventure chama endpoint `/authorize` com parâmetros OIDC padrão

**Passo 4:** Backend redireciona para página de login preservando parâmetros

**Passos 5-7:** Frontend exibe formulário e usuário insere credenciais

**Passos 8-9:** Backend valida credenciais via UsersService (bcrypt compare)

**Passos 10-11:** Backend gera authorization code (válido por 10 minutos)

**Passo 12:** Frontend redireciona para WorkAdventure com code

**Passos 13-14:** WorkAdventure troca code por tokens (chamada server-side)

**Passos 15-16:** WorkAdventure busca informações do usuário

**Passo 17:** Usuário está autenticado e pode acessar o mundo virtual

---

## ⚙️ Configuração e Instalação

### Pré-requisitos

```bash
# Verificar versões
node --version   # v18.0.0 ou superior
npm --version    # 9.0.0 ou superior
docker --version # 20.0.0 ou superior
```

### Passo 1: Configurar /etc/hosts

```bash
# Adicionar entradas necessárias
sudo bash -c 'cat >> /etc/hosts << EOF
127.0.0.1 auth.workadventure.localhost
127.0.0.1 play.workadventure.localhost
127.0.0.1 maps.workadventure.localhost
127.0.0.1 matrix.workadventure.localhost
EOF'

# Verificar
cat /etc/hosts | grep workadventure
```

### Passo 2: Gerar Chaves RSA

```bash
cd workadventure-auth/backend

# Criar diretório de chaves
mkdir -p keys

# Gerar chave privada (2048-bit RSA)
openssl genrsa -out keys/private.key 2048

# Gerar chave pública a partir da privada
openssl rsa -in keys/private.key -pubout -out keys/public.key

# Verificar permissões (importante!)
chmod 600 keys/private.key
chmod 644 keys/public.key

# Verificar conteúdo
ls -lh keys/
```

**Saída esperada:**
```
-rw------- 1 user user 1.7K private.key
-rw-r--r-- 1 user user  451 public.key
```

### Passo 3: Configurar Backend

**Arquivo:** `workadventure-auth/backend/.env`

```bash
# Servidor
NODE_ENV=production
PORT=3000

# URLs (IMPORTANTE: Sem porta em produção com Traefik)
ISSUER_URL=http://auth.workadventure.localhost
FRONTEND_URL=http://auth.workadventure.localhost

# Cliente WorkAdventure (DEVE CORRESPONDER ao .env do WorkAdventure)
WORKADVENTURE_CLIENT_ID=workadventure-local
WORKADVENTURE_CLIENT_SECRET=my-super-secret-key-for-local-dev

# Redirect URIs permitidas (separadas por vírgula)
ALLOWED_REDIRECT_URIS=http://play.workadventure.localhost/login-callback,http://play.workadventure.localhost/oauth2/callback,http://play.workadventure.localhost/openid-callback,http://matrix.workadventure.localhost/_synapse/client/oidc/callback

# CORS
CORS_ORIGIN=http://play.workadventure.localhost

# Logout
DEFAULT_LOGOUT_REDIRECT=http://play.workadventure.localhost
```

### Passo 4: Configurar WorkAdventure

**Arquivo:** `/Users/cristiantorres/Documents/GitHub/workcodeforge-autenticacao/.env`

```bash
# Configurações OpenID Connect
OPENID_CLIENT_ID=workadventure-local
OPENID_CLIENT_SECRET=my-super-secret-key-for-local-dev
OPENID_CLIENT_ISSUER=http://auth.workadventure.localhost
OPENID_SCOPE=openid email profile tags-scope
OPENID_USERNAME_CLAIM=preferred_username
OPENID_TAGS_CLAIM=tags

# Desabilitar acesso anônimo (força autenticação)
DISABLE_ANONYMOUS=true
```

### Passo 5: Configurar Docker Compose Override

**Arquivo:** `docker-compose.override.yml`

```yaml
version: "3.6"
services:
  # Desabilitar OIDC mock
  oidc-server-mock:
    deploy:
      replicas: 0

  # Backend de autenticação
  auth-backend:
    build:
      context: ./workadventure-auth/backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - PORT=3000
      - ISSUER_URL=http://auth.workadventure.localhost
      - FRONTEND_URL=http://auth.workadventure.localhost
      - WORKADVENTURE_CLIENT_ID=workadventure-local
      - WORKADVENTURE_CLIENT_SECRET=my-super-secret-key-for-local-dev
      - ALLOWED_REDIRECT_URIS=http://play.workadventure.localhost/login-callback,http://play.workadventure.localhost/oauth2/callback,http://play.workadventure.localhost/openid-callback
      - CORS_ORIGIN=http://play.workadventure.localhost
      - DEFAULT_LOGOUT_REDIRECT=http://play.workadventure.localhost
    volumes:
      - ./workadventure-auth/backend/keys:/app/keys:ro
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.auth-api.rule=Host(`auth.workadventure.localhost`) && (PathPrefix(`/.well-known`) || PathPrefix(`/auth`) || PathPrefix(`/authorize`) || PathPrefix(`/token`) || PathPrefix(`/userinfo`) || PathPrefix(`/logout`))"
      - "traefik.http.routers.auth-api.entryPoints=web"
      - "traefik.http.routers.auth-api.priority=200"
      - "traefik.http.services.auth-api.loadbalancer.server.port=3000"

  # Frontend de autenticação
  auth-frontend:
    build:
      context: ./workadventure-auth/frontend
      dockerfile: Dockerfile
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.auth-front.rule=Host(`auth.workadventure.localhost`)"
      - "traefik.http.routers.auth-front.entryPoints=web"
      - "traefik.http.routers.auth-front.priority=10"
      - "traefik.http.services.auth-front.loadbalancer.server.port=5173"

  # Configurar Play para acessar auth internamente
  play:
    extra_hosts:
      - "auth.workadventure.localhost:172.17.0.1"
    environment:
      OPENID_CLIENT_ID: "${OPENID_CLIENT_ID}"
      OPENID_CLIENT_SECRET: "${OPENID_CLIENT_SECRET}"
      OPENID_CLIENT_ISSUER: "${OPENID_CLIENT_ISSUER}"
      OPENID_SCOPE: "${OPENID_SCOPE}"
      OPENID_USERNAME_CLAIM: "${OPENID_USERNAME_CLAIM}"
      OPENID_TAGS_CLAIM: "${OPENID_TAGS_CLAIM}"
      DISABLE_ANONYMOUS: "${DISABLE_ANONYMOUS}"
```

### Passo 6: Iniciar o Sistema

```bash
# Parar containers existentes
docker-compose down

# Buildar e iniciar todos os serviços
docker-compose up --build -d

# Verificar logs
docker-compose logs -f auth-backend
docker-compose logs -f auth-frontend
docker-compose logs -f play
```

### Passo 7: Verificar Funcionamento

```bash
# Testar discovery document
curl http://auth.workadventure.localhost/.well-known/openid-configuration | jq

# Testar JWKS
curl http://auth.workadventure.localhost/.well-known/jwks | jq

# Testar login
curl -X POST http://auth.workadventure.localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@example.com","password":"pwd"}' | jq
```

**Acessar aplicação:**
```
http://play.workadventure.localhost
```

---

## 📡 API Reference

### Authentication Endpoints

#### POST /auth/login

Autenticar usuário existente.

**Request:**
```json
{
  "email": "user1@example.com",
  "password": "pwd"
}
```

**Response 200:**
```json
{
  "userId": "1",
  "email": "user1@example.com",
  "name": "User 1",
  "tags": ["admin", "moderator"]
}
```

**Response 401:**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

---

#### POST /auth/register

Registrar novo usuário.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "senha123",
  "name": "New User"
}
```

**Response 200:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "newuser@example.com",
  "name": "New User",
  "tags": ["member"]
}
```

**Response 401:**
```json
{
  "statusCode": 401,
  "message": "User already exists"
}
```

---

#### POST /auth/authorize

Gerar authorization code (uso interno do frontend).

**Request:**
```json
{
  "userId": "1",
  "clientId": "workadventure-local",
  "redirectUri": "http://play.workadventure.localhost/login-callback",
  "scope": "openid email profile tags-scope",
  "state": "random-state-string",
  "nonce": "random-nonce-string"
}
```

**Response 200:**
```json
{
  "code": "a1b2c3d4e5f6..."
}
```

---

### OIDC Standard Endpoints

#### GET /.well-known/openid-configuration

Discovery document (metadata do provedor OIDC).

**Response 200:**
```json
{
  "issuer": "http://auth.workadventure.localhost",
  "authorization_endpoint": "http://auth.workadventure.localhost/authorize",
  "token_endpoint": "http://auth.workadventure.localhost/token",
  "userinfo_endpoint": "http://auth.workadventure.localhost/userinfo",
  "jwks_uri": "http://auth.workadventure.localhost/.well-known/jwks",
  "end_session_endpoint": "http://auth.workadventure.localhost/logout",
  "response_types_supported": ["code"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "email", "profile", "tags-scope"],
  "token_endpoint_auth_methods_supported": ["client_secret_post", "client_secret_basic"],
  "claims_supported": ["sub", "email", "email_verified", "name", "preferred_username", "tags"]
}
```

---

#### GET /.well-known/jwks

JSON Web Key Set (chaves públicas para validação de JWT).

**Response 200:**
```json
{
  "keys": [
    {
      "kty": "RSA",
      "n": "base64-encoded-modulus...",
      "e": "AQAB",
      "kid": "key-1",
      "use": "sig",
      "alg": "RS256"
    }
  ]
}
```

---

#### GET /authorize

Iniciar fluxo de autorização OAuth2/OIDC.

**Query Parameters:**
- `client_id` (required): ID do cliente registrado
- `redirect_uri` (required): URI de callback
- `response_type` (required): Deve ser `code`
- `scope` (required): Escopos solicitados (ex: `openid email profile tags-scope`)
- `state` (recommended): String aleatória para proteção CSRF
- `nonce` (recommended): String aleatória incluída no id_token

**Response:** HTTP 302 Redirect para página de login

**Exemplo:**
```
GET /authorize?
  client_id=workadventure-local&
  redirect_uri=http://play.workadventure.localhost/login-callback&
  response_type=code&
  scope=openid%20email%20profile%20tags-scope&
  state=abc123&
  nonce=xyz789
```

---

#### POST /token

Trocar authorization code por tokens.

**Content-Type:** `application/x-www-form-urlencoded`

**Request Body:**
```
grant_type=authorization_code
code=a1b2c3d4e5f6...
client_id=workadventure-local
client_secret=my-super-secret-key-for-local-dev
redirect_uri=http://play.workadventure.localhost/login-callback
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0xIn0...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0xIn0...",
  "scope": "openid email profile tags-scope"
}
```

**Response 400:**
```json
{
  "error": "invalid_grant",
  "error_description": "Invalid authorization code"
}
```

---

#### GET /userinfo

Obter informações do usuário autenticado.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response 200:**
```json
{
  "sub": "1",
  "email": "user1@example.com",
  "email_verified": true,
  "name": "User 1",
  "preferred_username": "user1",
  "tags": ["admin", "moderator"]
}
```

**Response 401:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

#### GET /logout

Encerrar sessão do usuário.

**Query Parameters:**
- `post_logout_redirect_uri` (optional): URI de redirecionamento após logout

**Response:** HTTP 302 Redirect

**Exemplo:**
```
GET /logout?post_logout_redirect_uri=http://play.workadventure.localhost
```

---

## 🔒 Segurança

### Mecanismos Implementados

#### 1. Criptografia de Senhas
- **Algoritmo:** bcrypt
- **Salt Rounds:** 10
- **Proteção:** Rainbow table attacks, brute force

```typescript
// Hash de senha ao criar usuário
const hashedPassword = await bcrypt.hash(password, 10);

// Validação de senha
const isValid = await bcrypt.compare(inputPassword, user.password);
```

#### 2. JWT com RSA256

**Assinatura:**
- Algoritmo: RS256 (RSA-SHA256)
- Chave: RSA 2048-bit
- Kid (Key ID): `key-1`

**Claims do ID Token:**
```json
{
  "iss": "http://auth.workadventure.localhost",
  "sub": "1",
  "aud": "workadventure-local",
  "exp": 1234567890,
  "iat": 1234567890,
  "email": "user@example.com",
  "email_verified": true,
  "name": "User Name",
  "preferred_username": "username",
  "tags": ["admin"],
  "nonce": "xyz789"
}
```

#### 3. Authorization Code

**Características:**
- Gerado com `crypto.randomBytes(32)`
- Armazenado em memória (Map)
- Expiração: 10 minutos
- Uso único (deletado após troca por tokens)

#### 4. CORS

**Configuração:**
```typescript
app.enableCors({
  origin: 'http://play.workadventure.localhost',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type']
});
```

#### 5. Validação de Redirect URI

```typescript
const allowedUris = process.env.ALLOWED_REDIRECT_URIS.split(',');
if (!allowedUris.includes(redirectUri)) {
  throw new UnauthorizedException('Invalid redirect_uri');
}
```

#### 6. Client Authentication

**Token Endpoint:**
- Valida `client_id` e `client_secret`
- Protege contra clients não autorizados

### Recomendações para Produção

#### ⚠️ CRÍTICO

1. **HTTPS Obrigatório**
   - Usar Let's Encrypt ou certificado válido
   - Configurar HSTS (HTTP Strict Transport Security)

2. **Banco de Dados Persistente**
   - Migrar de Map para PostgreSQL/MySQL
   - Implementar migrations e backups

3. **Refresh Tokens**
   - Implementar refresh tokens para renovação
   - Configurar rotação de tokens

4. **Rate Limiting**
   - Limitar requisições de login (ex: 5/minuto por IP)
   - Proteger contra brute force

5. **Logging e Monitoramento**
   - Logs estruturados (Winston, Pino)
   - Monitoramento de tentativas de login
   - Alertas de segurança

6. **Secrets Management**
   - Usar variáveis de ambiente seguras
   - Considerar HashiCorp Vault, AWS Secrets Manager
   - NUNCA commitar `.env` ou chaves privadas

7. **Session Management**
   - Implementar revogação de tokens
   - Gerenciar sessões ativas
   - Timeout de inatividade

8. **Two-Factor Authentication (2FA)**
   - Adicionar TOTP (Google Authenticator)
   - SMS ou email verification

---

## 🐳 Deployment com Docker

### Dockerfile - Backend

**Arquivo:** `workadventure-auth/backend/Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Compilar TypeScript
RUN npm run build

# Expor porta
EXPOSE 3000

# Comando de inicialização
CMD ["node", "dist/main.js"]
```

### Dockerfile - Frontend

**Arquivo:** `workadventure-auth/frontend/Dockerfile`

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Servidor de produção
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

Ver `docker-compose.override.yml` na seção de Configuração.

### Build e Deploy

```bash
# Build das imagens
docker-compose build auth-backend auth-frontend

# Iniciar serviços
docker-compose up -d auth-backend auth-frontend

# Verificar logs
docker-compose logs -f auth-backend
docker-compose logs -f auth-frontend

# Restart de serviço específico
docker-compose restart auth-backend

# Parar tudo
docker-compose down
```

---

## 🐛 Troubleshooting

### Problema: "Cannot connect to auth server"

**Sintomas:**
- WorkAdventure não consegue conectar ao auth
- Erro de rede no console do navegador

**Diagnóstico:**
```bash
# 1. Verificar se backend está rodando
curl http://auth.workadventure.localhost/.well-known/openid-configuration

# 2. Verificar /etc/hosts
cat /etc/hosts | grep auth.workadventure.localhost

# 3. Verificar logs do Docker
docker-compose logs auth-backend

# 4. Verificar se container está rodando
docker-compose ps | grep auth
```

**Soluções:**

1. **Backend não está rodando:**
   ```bash
   docker-compose up -d auth-backend
   ```

2. **Entrada faltando em /etc/hosts:**
   ```bash
   echo "127.0.0.1 auth.workadventure.localhost" | sudo tee -a /etc/hosts
   ```

3. **Traefik não está roteando:**
   - Verificar labels no `docker-compose.override.yml`
   - Restart do Traefik: `docker-compose restart reverse-proxy`

---

### Problema: "CORS error"

**Sintomas:**
```
Access to fetch at 'http://auth.workadventure.localhost/auth/login' from origin
'http://play.workadventure.localhost' has been blocked by CORS policy
```

**Diagnóstico:**
```bash
# Verificar configuração CORS no backend
docker-compose exec auth-backend cat /app/.env | grep CORS_ORIGIN
```

**Solução:**

1. **Corrigir CORS_ORIGIN:**
   ```bash
   # Em workadventure-auth/backend/.env
   CORS_ORIGIN=http://play.workadventure.localhost
   ```

2. **Rebuild e restart:**
   ```bash
   docker-compose up -d --build auth-backend
   ```

---

### Problema: "JWT validation failed"

**Sintomas:**
- Token inválido
- WorkAdventure rejeita id_token

**Diagnóstico:**
```bash
# 1. Verificar JWKS
curl http://auth.workadventure.localhost/.well-known/jwks | jq

# 2. Verificar se chaves existem
ls -la workadventure-auth/backend/keys/

# 3. Testar geração de token
curl -X POST http://auth.workadventure.localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@example.com","password":"pwd"}'
```

**Soluções:**

1. **Chaves não encontradas:**
   ```bash
   cd workadventure-auth/backend
   openssl genrsa -out keys/private.key 2048
   openssl rsa -in keys/private.key -pubout -out keys/public.key
   ```

2. **Chaves corrompidas:**
   ```bash
   rm keys/private.key keys/public.key
   # Regenerar (comando acima)
   ```

3. **Rebuild do container:**
   ```bash
   docker-compose up -d --build auth-backend
   ```

---

### Problema: "Invalid client"

**Sintomas:**
```json
{
  "error": "invalid_client",
  "error_description": "Client authentication failed"
}
```

**Diagnóstico:**
```bash
# Backend
grep -E "WORKADVENTURE_CLIENT_ID|WORKADVENTURE_CLIENT_SECRET" \
  workadventure-auth/backend/.env

# WorkAdventure
grep -E "OPENID_CLIENT_ID|OPENID_CLIENT_SECRET" .env
```

**Solução:**

Garantir que valores correspondem:

**Backend (.env):**
```
WORKADVENTURE_CLIENT_ID=workadventure-local
WORKADVENTURE_CLIENT_SECRET=my-super-secret-key-for-local-dev
```

**WorkAdventure (.env):**
```
OPENID_CLIENT_ID=workadventure-local
OPENID_CLIENT_SECRET=my-super-secret-key-for-local-dev
```

Restart de ambos:
```bash
docker-compose restart auth-backend play
```

---

### Problema: "Login não redireciona"

**Sintomas:**
- Após login, página não redireciona
- Fica na tela de login

**Diagnóstico:**
```bash
# Verificar logs do frontend
docker-compose logs auth-frontend | tail -50

# Verificar console do navegador (F12)
```

**Possíveis Causas:**

1. **Parâmetros OIDC perdidos:** Frontend não está capturando query params
2. **Endpoint /auth/authorize falhando:** Verificar logs do backend
3. **redirect_uri inválida:** Não está na lista de permitidas

**Solução:**

1. **Verificar ALLOWED_REDIRECT_URIS:**
   ```bash
   # Backend .env
   ALLOWED_REDIRECT_URIS=http://play.workadventure.localhost/login-callback,http://play.workadventure.localhost/oauth2/callback,http://play.workadventure.localhost/openid-callback
   ```

2. **Verificar logs:**
   ```bash
   docker-compose logs -f auth-backend | grep authorize
   ```

---

### Problema: "User not found" para usuários de teste

**Sintomas:**
- Login com `user1@example.com` retorna 401

**Diagnóstico:**
```bash
# Verificar logs
docker-compose logs auth-backend | grep "FIND BY EMAIL"
```

**Solução:**

Usuários de teste são criados no `UsersService.constructor()`. Se o backend foi reiniciado sem rebuild, pode ter bug.

```bash
# Rebuild completo
docker-compose up -d --build --force-recreate auth-backend
```

---

### Problema: "Port 3000 already in use"

**Sintomas:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use
```

**Diagnóstico:**
```bash
# Ver o que está usando a porta
lsof -i :3000

# Ou (Linux)
netstat -tulpn | grep :3000
```

**Solução:**

1. **Parar processo conflitante:**
   ```bash
   kill -9 <PID>
   ```

2. **Ou mudar porta do serviço:**
   ```yaml
   # docker-compose.override.yml
   auth-backend:
     environment:
       - PORT=3001
   ```

---

## 💡 Exemplos de Uso

### Exemplo 1: Login Programático

```bash
#!/bin/bash

# Fazer login e obter dados do usuário
response=$(curl -s -X POST http://auth.workadventure.localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@example.com",
    "password": "pwd"
  }')

echo "Login response: $response"

user_id=$(echo $response | jq -r '.userId')
echo "User ID: $user_id"
```

### Exemplo 2: Testar Fluxo OIDC Completo

```bash
#!/bin/bash

# Variáveis
CLIENT_ID="workadventure-local"
CLIENT_SECRET="my-super-secret-key-for-local-dev"
REDIRECT_URI="http://play.workadventure.localhost/login-callback"
STATE="test-state-123"
NONCE="test-nonce-456"

# 1. Login
login_response=$(curl -s -X POST http://auth.workadventure.localhost/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user1@example.com\",\"password\":\"pwd\"}")

user_id=$(echo $login_response | jq -r '.userId')
echo "✓ Login OK - User ID: $user_id"

# 2. Gerar authorization code
auth_response=$(curl -s -X POST http://auth.workadventure.localhost/auth/authorize \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\":\"$user_id\",
    \"clientId\":\"$CLIENT_ID\",
    \"redirectUri\":\"$REDIRECT_URI\",
    \"scope\":\"openid email profile tags-scope\",
    \"state\":\"$STATE\",
    \"nonce\":\"$NONCE\"
  }")

code=$(echo $auth_response | jq -r '.code')
echo "✓ Authorization Code: $code"

# 3. Trocar code por tokens
token_response=$(curl -s -X POST http://auth.workadventure.localhost/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=$code&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&redirect_uri=$REDIRECT_URI")

access_token=$(echo $token_response | jq -r '.access_token')
id_token=$(echo $token_response | jq -r '.id_token')

echo "✓ Access Token: ${access_token:0:50}..."
echo "✓ ID Token: ${id_token:0:50}..."

# 4. Buscar userinfo
userinfo=$(curl -s http://auth.workadventure.localhost/userinfo \
  -H "Authorization: Bearer $access_token")

echo "✓ User Info: $userinfo"
```

### Exemplo 3: Registrar Novo Usuário

```bash
#!/bin/bash

# Registrar novo usuário
register_response=$(curl -s -X POST http://auth.workadventure.localhost/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepass123",
    "name": "New User Test"
  }')

echo "Register response: $register_response"

# Fazer login com novo usuário
login_response=$(curl -s -X POST http://auth.workadventure.localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepass123"
  }')

echo "Login response: $login_response"
```

### Exemplo 4: Verificar Saúde do Sistema

```bash
#!/bin/bash

echo "=== Auth Service Health Check ==="

# 1. Discovery Document
echo -n "Discovery Document: "
curl -s -o /dev/null -w "%{http_code}" \
  http://auth.workadventure.localhost/.well-known/openid-configuration
echo ""

# 2. JWKS
echo -n "JWKS Endpoint: "
curl -s -o /dev/null -w "%{http_code}" \
  http://auth.workadventure.localhost/.well-known/jwks
echo ""

# 3. Login
echo -n "Login Endpoint: "
curl -s -o /dev/null -w "%{http_code}" \
  -X POST http://auth.workadventure.localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@example.com","password":"pwd"}'
echo ""

echo "=== Health Check Complete ==="
```

---

## 📊 Monitoramento e Logs

### Visualizar Logs

```bash
# Todos os logs do auth backend
docker-compose logs -f auth-backend

# Filtrar por erro
docker-compose logs auth-backend | grep ERROR

# Últimas 100 linhas
docker-compose logs --tail=100 auth-backend

# Todos os serviços de auth
docker-compose logs -f auth-backend auth-frontend
```

### Métricas Importantes

**Performance:**
- Tempo de resposta de `/token`
- Tempo de resposta de `/userinfo`
- Taxa de sucesso de login

**Segurança:**
- Tentativas de login falhadas por IP
- Authorization codes expirados
- Tokens inválidos

**Disponibilidade:**
- Uptime dos containers
- Latência de rede
- Erros 5xx

---

## 🚀 Próximos Passos

### Melhorias Recomendadas

1. **Persistência de Dados**
   - [ ] Migrar de Map para PostgreSQL
   - [ ] Implementar TypeORM ou Prisma
   - [ ] Criar migrations de banco

2. **Refresh Tokens**
   - [ ] Implementar refresh_token no /token endpoint
   - [ ] Configurar rotação de tokens
   - [ ] Adicionar endpoint /revoke

3. **Interface de Administração**
   - [ ] Dashboard de usuários
   - [ ] Gerenciamento de permissões
   - [ ] Logs de auditoria

4. **Two-Factor Authentication**
   - [ ] TOTP (Google Authenticator)
   - [ ] Backup codes
   - [ ] SMS/Email verification

5. **OAuth2 Clients Management**
   - [ ] Registro de múltiplos clients
   - [ ] Gerenciamento de redirect_uris
   - [ ] Client credentials grant

6. **Advanced Security**
   - [ ] PKCE (Proof Key for Code Exchange)
   - [ ] Rate limiting por IP
   - [ ] Account lockout após X tentativas
   - [ ] Password strength policy

7. **Observability**
   - [ ] Prometheus metrics
   - [ ] Grafana dashboards
   - [ ] Structured logging (Winston/Pino)
   - [ ] Sentry integration

8. **Testing**
   - [ ] Unit tests (Jest)
   - [ ] Integration tests
   - [ ] E2E tests (Playwright)
   - [ ] Load testing (k6, Artillery)

---

## 📝 Conclusão

Este serviço de autenticação customizado fornece uma base sólida para WorkAdventure self-hosted, implementando os padrões OpenID Connect de forma completa e segura.

### Principais Conquistas

✅ **OpenID Connect completo** - Todos os endpoints necessários
✅ **JWT com RSA256** - Assinatura criptográfica robusta
✅ **Interface moderna** - Login/registro intuitivo
✅ **Docker ready** - Fácil deployment
✅ **Documentação completa** - Este documento!

### Suporte

Para dúvidas ou problemas:
1. Consultar seção [Troubleshooting](#-troubleshooting)
2. Verificar logs dos containers
3. Revisar configurações de ambiente
4. Testar endpoints individualmente

---

**Desenvolvido para WorkAdventure Self-Hosted**
**Versão:** 1.0.0
**Data:** Outubro 2024
