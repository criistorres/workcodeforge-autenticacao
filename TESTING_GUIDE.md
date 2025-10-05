# 🧪 Guia de Testes - Admin Panel WorkCodeForge

> **⚠️ IMPORTANTE:** Este sistema usa UUIDs (não IDs numéricos como 1, 2, 3).
> Execute o **Setup Rápido** na seção de Testes do Backend para configurar as variáveis automaticamente!

## 📋 Índice

1. [Pré-requisitos](#-pré-requisitos)
2. [Configuração Inicial](#-configuração-inicial)
3. [Testes do Backend](#-testes-do-backend)
4. [Testes do Frontend](#-testes-do-frontend)
5. [Testes de Integração](#-testes-de-integração)
6. [Checklist de Validação](#-checklist-de-validação)
7. [Problemas Conhecidos](#-problemas-conhecidos)
8. [Logs e Debugging](#-logs-e-debugging)

---

## ✅ Pré-requisitos

- [x] Docker e Docker Compose instalados
- [x] Containers rodando: `auth-backend`, `auth-frontend`, `auth-postgres`
- [x] Portas disponíveis: 3000, 5173, 5433
- [x] `/etc/hosts` configurado com `auth.workadventure.localhost`

### Verificar se tudo está rodando:

```bash
# Verificar containers
docker-compose ps | grep auth

# Deve mostrar:
# auth-backend    Up
# auth-frontend   Up
# auth-postgres   Up (healthy)
```

---

## 🚀 Configuração Inicial

### 1. Parar containers existentes

```bash
docker-compose down
```

### 2. Limpar banco de dados (opcional - apenas se quiser recomeçar)

```bash
docker volume rm workcodeforge-autenticacao_auth-postgres-data
```

### 3. Rebuild e iniciar

```bash
# Iniciar TODOS os serviços necessários (incluindo Traefik!)
docker-compose up --build -d reverse-proxy auth-backend auth-frontend auth-postgres
```

**⚠️ IMPORTANTE:**
- O `reverse-proxy` (Traefik) é necessário para as URLs funcionarem!
- Aguarde ~5 segundos para os containers iniciarem completamente antes de testar

### 4. Verificar logs de inicialização

```bash
# Backend - verificar seeds
docker-compose logs auth-backend | grep SEEDS

# Deve mostrar:
# ✓ Roles criadas com sucesso!
# ✓ Usuários de teste criados com sucesso!
```

### 5. Aguardar aplicação iniciar

```bash
# Esperar ~10 segundos para o backend estar pronto
sleep 10

# Verificar se está respondendo
curl http://auth.workadventure.localhost/.well-known/openid-configuration
```

---

## 🔧 Testes do Backend

### 🚀 Setup Rápido (Execute uma vez antes dos testes)

Para facilitar os testes, execute estes comandos para configurar as variáveis de ambiente:

```bash
# Obter o UUID do admin
USER_ID=$(curl -s -X POST http://auth.workadventure.localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"pwd"}' | jq -r '.userId')

echo "✅ Admin User ID: $USER_ID"

# Obter UUID do user2 para testes de bloqueio/desbloqueio
TARGET_USER_ID=$(curl -s -X GET "http://auth.workadventure.localhost/admin/users?page=1&limit=10" \
  -H "X-User-Id: $USER_ID" | jq -r '.data[] | select(.email=="user2@example.com") | .id')

echo "✅ Target User ID (user2): $TARGET_USER_ID"
```

**💡 Dica:** Mantenha este terminal aberto para usar as variáveis `$USER_ID` e `$TARGET_USER_ID` em todos os testes subsequentes!

---

### Teste 1: Health Check - Discovery Document

**Objetivo:** Verificar se o OIDC está configurado corretamente

```bash
curl http://auth.workadventure.localhost/.well-known/openid-configuration | jq
```

**Resultado Esperado:**
```json
{
  "issuer": "http://auth.workadventure.localhost",
  "authorization_endpoint": "http://auth.workadventure.localhost/authorize",
  "token_endpoint": "http://auth.workadventure.localhost/token",
  ...
}
```

**Status:** [x ] ✅ Passou | [ ] ❌ Falhou

---

### Teste 2: Login API

**Objetivo:** Testar autenticação básica

```bash
curl -X POST http://auth.workadventure.localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "pwd"
  }' | jq
```

**Resultado Esperado:**
```json
{
  "userId": "uuid-aqui",
  "email": "admin@example.com",
  "name": "Admin User",
  "tags": ["admin", "moderator"]
}
```

**Status:** [ x] ✅ Passou | [ ] ❌ Falhou

**Notas:**
- Se retornar 401: verificar senha ou email
- Se retornar 404: backend não está rodando

---

### Teste 3: Admin Stats (sem autenticação - temporário)

**Objetivo:** Verificar endpoint de estatísticas

**Passo 1:** Obter o UUID do admin do teste anterior:
```bash
USER_ID=$(curl -s -X POST http://auth.workadventure.localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"pwd"}' | jq -r '.userId')

echo "User ID: $USER_ID"
```

**Passo 2:** Usar o UUID para acessar as estatísticas:
```bash
curl -X GET http://auth.workadventure.localhost/admin/stats \
  -H "X-User-Id: $USER_ID" | jq
```

**Resultado Esperado:**
```json
{
  "users": {
    "total": 3,
    "active": 3,
    "blocked": 0,
    "newToday": 3
  },
  "sessions": {
    "active": 0
  }
}
```

**Status:** [x] ✅ Passou | [ ] ❌ Falhou

---

### Teste 4: Listar Usuários

**Objetivo:** Testar listagem paginada

```bash
# Use a variável $USER_ID do Teste 3, ou execute novamente:
USER_ID=$(curl -s -X POST http://auth.workadventure.localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"pwd"}' | jq -r '.userId')

curl -X GET "http://auth.workadventure.localhost/admin/users?page=1&limit=10" \
  -H "X-User-Id: $USER_ID" | jq
```

**Resultado Esperado:**
```json
{
  "data": [
    {
      "id": "...",
      "email": "admin@example.com",
      "name": "Admin User",
      ...
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

**Status:** [x ] ✅ Passou | [ ] ❌ Falhou

---

### Teste 5: Detalhes de Usuário

**Objetivo:** Testar endpoint de detalhes

**Passo 1:** Obter lista de usuários e seus UUIDs (use o resultado do Teste 4)

**Passo 2:** Usar um UUID real para buscar detalhes:
```bash
# Exemplo usando o UUID do admin (substitua pelo UUID real do seu sistema)
curl -X GET "http://auth.workadventure.localhost/admin/users/$USER_ID" \
  -H "X-User-Id: $USER_ID" | jq
```

**Ou copie um UUID da lista do Teste 4:**
```bash
# Exemplo com UUID fixo (ATENÇÃO: este UUID pode ser diferente no seu sistema!)
curl -X GET "http://auth.workadventure.localhost/admin/users/8b88a65e-617a-4657-a766-765f5be757a1" \
  -H "X-User-Id: 8b88a65e-617a-4657-a766-765f5be757a1" | jq
```

**Resultado Esperado:**
```json
{
  "id": "...",
  "email": "admin@example.com",
  "name": "Admin User",
  "roles": [
    {
      "name": "admin",
      "displayName": "Administrador",
      "color": "#EA580C"
    }
  ],
  "sessions": [],
  "recentActions": []
}
```

**Status:** [ x] ✅ Passou | [ ] ❌ Falhou

---

### Teste 6: Listar Roles

**Objetivo:** Verificar roles criadas pelo seed

```bash
# Use a variável $USER_ID dos testes anteriores
curl -X GET http://auth.workadventure.localhost/admin/roles \
  -H "X-User-Id: $USER_ID" | jq
```

**Resultado Esperado:**
```json
[
  {
    "id": "...",
    "name": "super_admin",
    "displayName": "Super Administrador",
    "color": "#DC2626",
    "permissions": ["*"]
  },
  {
    "name": "admin",
    "displayName": "Administrador",
    ...
  },
  {
    "name": "moderator",
    ...
  },
  {
    "name": "member",
    ...
  }
]
```

**Status:** [ x] ✅ Passou | [ ] ❌ Falhou

---

### Teste 7: Bloquear Usuário

**Objetivo:** Testar bloqueio de conta

```bash
# Primeiro, pegue o UUID de user2 da lista (Teste 4)
# Exemplo: TARGET_USER_ID="cc059feb-7ffd-4c42-ba9f-5d941dec3ebe"

# Ou obtenha automaticamente o ID do user2:
TARGET_USER_ID=$(curl -s -X GET "http://auth.workadventure.localhost/admin/users?page=1&limit=10" \
  -H "X-User-Id: $USER_ID" | jq -r '.data[] | select(.email=="user2@example.com") | .id')

echo "Bloqueando usuário: $TARGET_USER_ID"

curl -X PUT "http://auth.workadventure.localhost/admin/users/$TARGET_USER_ID/block" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_ID" \
  -d '{
    "blocked": true,
    "reason": "Teste de bloqueio"
  }' | jq
```

**Resultado Esperado:**
```json
{
  "id": "...",
  "blockedAt": "2024-10-04T...",
  "blockedReason": "Teste de bloqueio",
  "isActive": false
}
```

**Status:** [ x] ✅ Passou | [ ] ❌ Falhou

---

### Teste 8: Desbloquear Usuário

```bash
# Use a mesma variável $TARGET_USER_ID do teste anterior
curl -X PUT "http://auth.workadventure.localhost/admin/users/$TARGET_USER_ID/block" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_ID" \
  -d '{
    "blocked": false
  }' | jq
```

**Status:** [x ] ✅ Passou | [ ] ❌ Falhou

---

## 🎨 Testes do Frontend

### Teste 9: Acessar Página de Login

**Objetivo:** Verificar se o frontend está servindo

1. Abrir navegador em: http://auth.workadventure.localhost
2. Verificar se aparece a página "Entrar no WorkCodeForge"
3. Verificar usuários de teste listados

**Resultado Esperado:**
- Página carrega sem erros
- Formulário de login visível
- Lista de usuários de teste visível

**Status:** [ x] ✅ Passou | [ ] ❌ Falhou

---

### Teste 10: Login via Interface

**Objetivo:** Testar fluxo de login completo

1. Abrir: http://auth.workadventure.localhost
2. Preencher:
   - Email: `admin@example.com`
   - Senha: `pwd` ⚠️ **IMPORTANTE: tudo minúscula!**
3. Clicar em "🔐 Entrar"

**Resultado Esperado:**
- Sem erros no console (F12)
- URL muda para: `http://auth.workadventure.localhost/?code=CODIGO_GERADO&state=`
- Página fica "em branco" (normal - não há redirect_uri configurado!)

**⚠️ ATENÇÃO:** A senha é case-sensitive! Use `pwd` (minúscula), não `PWD` ou `Pwd`

**📝 Explicação do Comportamento:**
Quando você testa o login sem os parâmetros OIDC (`client_id`, `redirect_uri`, etc.), o sistema:
1. ✅ Valida suas credenciais
2. ✅ Gera um código de autorização (o `code=...` na URL)
3. ❌ Não sabe para onde redirecionar (sem `redirect_uri`)
4. Resultado: URL com código, mas página "parada"

**Isso é CORRETO!** O servidor OIDC está funcionando perfeitamente.

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

### Teste 10.1: Fluxo OIDC Completo (Avançado)

**Objetivo:** Testar todo o fluxo OAuth2/OIDC

**Passo 1:** Fazer login com parâmetros OIDC corretos na URL:
```
http://auth.workadventure.localhost/?client_id=workadventure-local&redirect_uri=http://play.workadventure.localhost/login-callback&scope=openid+profile+email&state=random-state-123&response_type=code
```

**Passo 2:** Após login, copie o `code=...` da URL de redirecionamento

**Passo 3:** Troque o código por tokens JWT:
```bash
# Substitua CODE_AQUI pelo código da URL
curl -X POST http://auth.workadventure.localhost/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=authorization_code' \
  -d 'code=CODE_AQUI' \
  -d 'client_id=workadventure-local' \
  -d 'client_secret=my-super-secret-key-for-local-dev' \
  -d 'redirect_uri=http://play.workadventure.localhost/login-callback' | jq
```

**Resultado Esperado:**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "eyJhbGci...",
  "scope": ""
}
```

**Passo 4 (Opcional):** Decodifique o id_token para ver os dados do usuário:
```bash
# Cole o id_token aqui
echo "ID_TOKEN_AQUI" | cut -d'.' -f2 | base64 -d 2>/dev/null | jq
```

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

### Teste 11: Acessar Admin Dashboard

**Objetivo:** Verificar roteamento e dashboard

**IMPORTANTE:** O admin panel requer autenticação via localStorage. Siga os passos:

**Passo 1:** Fazer login no admin
1. Abrir: http://auth.workadventure.localhost/#/admin/login
2. Preencher:
   - Email: `admin@example.com`
   - Senha: `pwd` (minúscula!)
3. Clicar em "🔐 Entrar no Admin"
4. Você será redirecionado automaticamente para `/admin`

**Passo 2:** Verificar carregamento do dashboard

**Resultado Esperado:**
- Sidebar visível à esquerda
- Cards de estatísticas aparecem
- Números corretos:
  - Total de Usuários: 3
  - Usuários Ativos: 3
  - Bloqueados: 0
  - Novos Hoje: 3
  - Sessões Ativas: 0

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

**Screenshots:**
- [ ] Dashboard

---

### Teste 12: Navegação - Lista de Usuários

**Objetivo:** Testar página de listagem

1. No admin panel, clicar em "👥 Usuários" na sidebar
2. Ou acessar: http://auth.workadventure.localhost/#/admin/users

**Resultado Esperado:**
- Tabela com 3 usuários
- Colunas: Nome, Email, Username, Tags, Status, Último Login, Ações
- Campo de busca no topo

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

**Dados Esperados:**
| Nome | Email | Tags | Status |
|------|-------|------|--------|
| Admin User | admin@example.com | admin, moderator | ✅ Ativo |
| User 1 | user1@example.com | admin, moderator | ✅ Ativo |
| User 2 | user2@example.com | member | ✅ Ativo |

---

### Teste 13: Busca de Usuários

**Objetivo:** Testar filtro de busca

1. Na página de usuários
2. Digitar "Admin" no campo de busca

**Resultado Esperado:**
- Tabela atualiza automaticamente
- Mostra apenas "Admin User"

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

### Teste 14: Ver Detalhes do Usuário

**Objetivo:** Testar página de detalhes

1. Na lista de usuários, clicar em "👁️ Ver" do Admin User
2. Ou acessar: http://auth.workadventure.localhost/#/admin/users/[USER-ID]

**Resultado Esperado:**
- Card "Informações Básicas" com todos os dados
- Card "Roles & Permissões" mostrando role "Administrador"
- Botões: ← Voltar, ✏️ Editar, 🚫 Bloquear, 🗑️ Deletar

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

### Teste 15: Editar Usuário

**Objetivo:** Testar formulário de edição

1. Na página de detalhes, clicar em "✏️ Editar"
2. Alterar nome para "Admin User - Editado"
3. Clicar em "💾 Salvar"

**Resultado Esperado:**
- Formulário aparece
- Campos preenchidos
- Ao salvar: alerta "Usuário atualizado com sucesso!"
- Nome atualizado na tela

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

### Teste 16: Bloquear Usuário via Interface

**Objetivo:** Testar bloqueio

1. Na página de detalhes do User 2
2. Clicar em "🚫 Bloquear"
3. Digitar motivo: "Teste de bloqueio via interface"
4. Confirmar

**Resultado Esperado:**
- Prompt aparece pedindo motivo
- Após confirmar: alerta "Usuário bloqueado!"
- Status muda para "🚫 Bloqueado desde [data]"
- Aparece box amarelo com motivo do bloqueio

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

### Teste 17: Desbloquear Usuário

**Objetivo:** Reverter bloqueio

1. Na mesma página do User 2 bloqueado
2. Clicar em "✅ Desbloquear"
3. Confirmar

**Resultado Esperado:**
- Confirmação aparece
- Alerta "Usuário desbloqueado!"
- Status volta para "✅ Ativo"
- Box amarelo desaparece

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

## 🔗 Testes de Integração

### Teste 18: Fluxo Completo - Criar → Editar → Bloquear → Deletar

**Objetivo:** Testar ciclo completo de vida de um usuário

#### 18.1 - Criar usuário via API
```bash
curl -X POST http://auth.workadventure.localhost/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123",
    "name": "Usuário de Teste"
  }' | jq
```

**Status:** [ ] ✅

#### 18.2 - Verificar na interface
1. Ir para lista de usuários
2. Buscar "Teste"
3. Verificar que aparece

**Status:** [ ] ✅

#### 18.3 - Editar via interface
1. Abrir detalhes
2. Editar nome
3. Salvar

**Status:** [ ] ✅

#### 18.4 - Bloquear
1. Bloquear com motivo

**Status:** [ ] ✅

#### 18.5 - Deletar
1. Clicar em "🗑️ Deletar"
2. Confirmar o alerta duplo
3. Verificar redirect para lista
4. Verificar que usuário sumiu

**Status:** [ ] ✅

---

### Teste 19: Validação de Permissões

**Objetivo:** Verificar se Guards estão funcionando

⚠️ **Nota:** Atualmente usando `X-User-Id` header simples. Em produção deve usar JWT.

1. Tentar acessar `/admin/users` sem header:
```bash
curl http://auth.workadventure.localhost/admin/users
```

**Resultado Esperado:**
- Erro 401 Unauthorized

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

### Teste 20: Roles e Permissões

**Objetivo:** Verificar sistema de roles

1. Acessar: http://auth.workadventure.localhost/#/admin/roles (quando implementado)
2. Verificar 4 roles padrão

**Status:** [ ] ⏳ Pendente (página não implementada ainda)

---

## ✅ Checklist de Validação

### Backend
- [ ] Banco de dados criado corretamente (13 tabelas)
- [ ] Seeds executados (4 roles, 3 usuários)
- [ ] Todos os 13 endpoints respondendo
- [ ] TypeORM sincronizando schemas
- [ ] Logs sem erros críticos

### Frontend
- [ ] Routing funcionando (/, /admin, /admin/users, /admin/users/:id)
- [ ] Sidebar navegável
- [ ] Dashboard mostrando estatísticas corretas
- [ ] Lista de usuários com busca
- [ ] Detalhes de usuário com todas as seções
- [ ] Formulário de edição salvando
- [ ] Bloqueio/desbloqueio funcionando
- [ ] Delete funcionando

### Integração
- [ ] API e Frontend se comunicando
- [ ] Dados persistindo no PostgreSQL
- [ ] Auditoria registrando ações (verificar tabela `audit_logs`)
- [ ] Roles atribuídas corretamente (tabela `user_roles`)

---

## 🐛 Problemas Conhecidos

### ✅ Problema 0: Traefik não roteia `/admin` para backend (RESOLVIDO)

**Descrição:** Inicialmente, requisições para `/admin/*` iam para o frontend ao invés do backend

**Causa:** Traefik routing em `docker-compose.override.yml` não incluía PathPrefix `/admin`

**Solução:** Adicionado `PathPrefix(\`/admin\`)` na linha 32 do docker-compose.override.yml

**Status:** [x] Resolvido

---

### ✅ Problema 0.1: Login via interface retornando 401 (RESOLVIDO)

**Descrição:** Login via interface retornava 401 Unauthorized mesmo com credenciais corretas

**Causa:** Usuário digitou senha em maiúscula (`PWD`) ao invés de minúscula (`pwd`). bcrypt é case-sensitive!

**Solução:**
- Adicionado aviso visual em vermelho na página de login: "⚠️ A senha é `pwd` (tudo minúscula!)"
- Adicionado aviso no TESTING_GUIDE.md
- Frontend reconstruído com a mudança

**Status:** [x] Resolvido

---

### ✅ Problema 0.2: Admin panel retornando 401 - userId não salvo (RESOLVIDO)

**Descrição:** Admin Dashboard mostrava "Erro: User not authorized" e `/admin/stats` retornava 401

**Causa:** O header `X-User-Id` estava sendo lido de `localStorage.getItem('userId')`, mas esse valor nunca era salvo após o login

**Solução:**
- Criado página dedicada de login do admin: `/admin/login`
- `Login.svelte` e `AdminLogin.svelte` agora salvam `userId` no localStorage após login bem-sucedido
- `Dashboard.svelte` agora redireciona para `/admin/login` se não houver userId
- Proteção contra 401: limpa localStorage e redireciona para login

**Arquivos Modificados:**
- `Login.svelte` - adicionado `localStorage.setItem('userId', userId)`
- `AdminLogin.svelte` - **NOVO** - página de login dedicada para admin
- `Dashboard.svelte` - adicionada verificação de autenticação
- `App.svelte` - adicionada rota `/admin/login`

**Status:** [x] Resolvido

---

### ✅ Problema 0.3: Sessões ativas sempre em 0 (RESOLVIDO)

**Descrição:** Admin Dashboard mostrava "Sessões Ativas: 0" mesmo com usuários logados

**Causa:** Sessões não estavam sendo criadas na tabela `sessions` quando tokens JWT eram gerados

**Solução:**
- Adicionado `SessionEntity` ao `OidcModule` via TypeORM
- `OidcService` agora injeta `sessionsRepository`
- Método `generateTokens()` cria uma sessão no banco de dados sempre que emite tokens JWT
- Sessões incluem: userId, token (access_token), expiresAt (+1h), isActive=true
- Log adicionado: `[SESSION] Sessão criada para usuário {email} (ID: {id})`

**Arquivos Modificados:**
- `oidc.module.ts` - adicionado `TypeOrmModule.forFeature([SessionEntity])`
- `oidc.service.ts` - injeção de `sessionsRepository` e criação de sessão em `generateTokens()`

**Como Testar:**
1. Fazer fluxo OIDC completo (login → code → token)
2. Verificar admin stats: `curl http://auth.workadventure.localhost/admin/stats`
3. Deve mostrar `"active": 1` ou mais

**Status:** [x] Resolvido

---

### Problema 1: Header `X-User-Id` ao invés de JWT

**Descrição:** AdminGuard usa header simples, não JWT

**Impacto:** 🟡 Médio - Funciona para testes, mas não é seguro

**Solução Temporária:** Passar userId manualmente nos testes

**Solução Definitiva:** Implementar JWT authentication

**Status:** [ ] Resolvido

---

### Problema 2: CORS pode dar erro em produção

**Descrição:** CORS configurado apenas para localhost

**Impacto:** 🟡 Médio

**Solução:** Atualizar variáveis de ambiente em produção

**Status:** [ ] Resolvido

---

### Problema 3: Soft Delete não reflete em listagens

**Descrição:** `deletedAt` não está sendo filtrado automaticamente

**Impacto:** 🔴 Alto - Usuários deletados ainda aparecem

**Solução:** Adicionar filtro `where: { deletedAt: null }` nas queries

**Status:** [ ] Resolvido

---

## 📊 Logs e Debugging

### Ver logs em tempo real

```bash
# Backend
docker-compose logs -f auth-backend

# Frontend
docker-compose logs -f auth-frontend

# Postgres
docker-compose logs -f auth-postgres
```

### Acessar banco de dados diretamente

```bash
# Via PgAdmin
# Abrir: http://pgadmin.workadventure.localhost
# Credenciais:
#   Email: admin@workadventure.localhost
#   Senha: admin123

# Ou via CLI:
docker-compose exec auth-postgres psql -U auth_user -d workadventure_auth

# Comandos úteis:
\dt                          # Listar tabelas
SELECT * FROM users;         # Ver usuários
SELECT * FROM roles;         # Ver roles
SELECT * FROM user_roles;    # Ver atribuições
SELECT * FROM audit_logs;    # Ver logs
```

### Debug do Frontend

1. Abrir DevTools (F12)
2. Aba Network para ver chamadas API
3. Aba Console para erros JavaScript

### Testar endpoint com curl verbose

```bash
curl -v http://auth.workadventure.localhost/admin/stats \
  -H "X-User-Id: [UUID]"
```

---

## 📝 Notas de Testes

### Data: ___/___/______
**Testador:** __________________

**Resumo:**
- Total de testes: 20
- Passou: [ ]
- Falhou: [ ]
- Pendente: [ ]

**Observações:**
```
[Espaço para anotações]




```

**Bugs Encontrados:**
```
1.

2.

3.
```

**Melhorias Sugeridas:**
```
1.

2.

3.
```

---

**Última atualização:** 2024-10-04
**Versão do sistema:** 1.0.0
