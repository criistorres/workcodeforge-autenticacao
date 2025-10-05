# 🛠️ Admin Panel - Documentação de Desenvolvimento

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Estrutura do Banco de Dados](#-estrutura-do-banco-de-dados)
3. [Progresso de Desenvolvimento](#-progresso-de-desenvolvimento)
4. [Problemas e Soluções](#-problemas-e-soluções)
5. [Decisões de Design](#-decisões-de-design)
6. [Testes e Validações](#-testes-e-validações)
7. [API Endpoints](#-api-endpoints)

---

## 🎯 Visão Geral

Sistema de administração completo para gerenciamento de usuários, roles, permissões e auditoria do serviço de autenticação **WorkCodeForge**.

### Objetivos

- ✅ Gestão completa de usuários
- ✅ Sistema de roles e permissões granulares
- ✅ Auditoria de ações administrativas
- ✅ Dashboard com estatísticas
- ✅ Interface moderna e responsiva

### Stack Tecnológica

**Backend:**
- NestJS 10.x (já existente)
- TypeORM (já existente)
- PostgreSQL 15 (já existente)
- JWT com Guards customizados

**Frontend:**
- Svelte 4.x (já existente)
- Svelte Router (a adicionar)
- CSS/Tailwind (a definir)
- Chart.js para gráficos

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Atuais (Status: ✅ Planejadas)

#### 1. `users` - Usuários do sistema
```sql
id                UUID PRIMARY KEY
email             VARCHAR(255) UNIQUE NOT NULL
password          VARCHAR(255) NOT NULL
name              VARCHAR(255) NOT NULL
username          VARCHAR(100) UNIQUE NOT NULL
tags              TEXT[] DEFAULT ['member']
avatar_url        VARCHAR(500)                    -- NOVO
is_active         BOOLEAN DEFAULT true            -- NOVO
is_email_verified BOOLEAN DEFAULT false           -- NOVO
blocked_at        TIMESTAMP                       -- NOVO
blocked_reason    TEXT                            -- NOVO
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()
last_login        TIMESTAMP
deleted_at        TIMESTAMP                       -- NOVO (soft delete)
```

#### 2. `sessions` - Sessões ativas
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
token           VARCHAR(1000) NOT NULL
ip_address      VARCHAR(45)
user_agent      VARCHAR(500)
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMP DEFAULT NOW()
expires_at      TIMESTAMP NOT NULL
revoked_at      TIMESTAMP                         -- NOVO
```

#### 3. `audit_logs` - Logs de auditoria
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id) ON DELETE SET NULL
action          VARCHAR(100) NOT NULL
target_id       UUID
target_type     VARCHAR(50)                       -- NOVO: 'user', 'role', 'session'
ip_address      VARCHAR(45)                       -- NOVO
user_agent      VARCHAR(500)                      -- NOVO
metadata        JSONB
created_at      TIMESTAMP DEFAULT NOW()
```

#### 4. `roles` - Sistema de roles
```sql
id              UUID PRIMARY KEY
name            VARCHAR(100) UNIQUE NOT NULL      -- 'admin', 'moderator', 'member'
display_name    VARCHAR(255) NOT NULL
description     TEXT
color           VARCHAR(7)                        -- hex color (#FF5733)
permissions     TEXT[]                            -- array de permission codes
is_system       BOOLEAN DEFAULT false             -- roles do sistema (não deletáveis)
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### 5. `user_roles` - Relação usuário-roles
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
role_id         UUID REFERENCES roles(id) ON DELETE CASCADE
assigned_by     UUID REFERENCES users(id)
assigned_at     TIMESTAMP DEFAULT NOW()
expires_at      TIMESTAMP                         -- role temporária (opcional)

UNIQUE(user_id, role_id)
```

#### 6. `permissions` - Permissões granulares
```sql
id              UUID PRIMARY KEY
code            VARCHAR(100) UNIQUE NOT NULL      -- 'users.view', 'users.edit'
module          VARCHAR(50) NOT NULL              -- 'users', 'roles', 'settings'
description     TEXT
created_at      TIMESTAMP DEFAULT NOW()
```

#### 7. `role_permissions` - Permissões por role
```sql
id              UUID PRIMARY KEY
role_id         UUID REFERENCES roles(id) ON DELETE CASCADE
permission_id   UUID REFERENCES permissions(id) ON DELETE CASCADE

UNIQUE(role_id, permission_id)
```

#### 8. `password_resets` - Reset de senha
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
token           VARCHAR(255) UNIQUE NOT NULL
expires_at      TIMESTAMP NOT NULL
used_at         TIMESTAMP
ip_address      VARCHAR(45)
created_at      TIMESTAMP DEFAULT NOW()
```

#### 9. `email_verifications` - Verificação de email
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
token           VARCHAR(255) UNIQUE NOT NULL
expires_at      TIMESTAMP NOT NULL
verified_at     TIMESTAMP
ip_address      VARCHAR(45)
created_at      TIMESTAMP DEFAULT NOW()
```

#### 10. `login_attempts` - Tentativas de login
```sql
id              UUID PRIMARY KEY
email           VARCHAR(255) NOT NULL
ip_address      VARCHAR(45) NOT NULL
user_agent      VARCHAR(500)
success         BOOLEAN NOT NULL
failure_reason  VARCHAR(100)                      -- 'invalid_password', 'user_blocked'
created_at      TIMESTAMP DEFAULT NOW()

INDEX idx_email_ip (email, ip_address, created_at)
```

#### 11. `admin_actions` - Ações administrativas
```sql
id              UUID PRIMARY KEY
admin_id        UUID REFERENCES users(id) NOT NULL
action_type     VARCHAR(100) NOT NULL             -- 'user.block', 'user.unblock', 'role.assign'
target_user_id  UUID REFERENCES users(id)
target_role_id  UUID REFERENCES roles(id)
reason          TEXT
metadata        JSONB
ip_address      VARCHAR(45)
created_at      TIMESTAMP DEFAULT NOW()
```

#### 12. `system_settings` - Configurações do sistema
```sql
id              UUID PRIMARY KEY
key             VARCHAR(100) UNIQUE NOT NULL
value           TEXT NOT NULL
type            VARCHAR(20) DEFAULT 'string'      -- 'string', 'number', 'boolean', 'json'
description     TEXT
updated_by      UUID REFERENCES users(id)
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### 13. `notifications` - Sistema de notificações
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
type            VARCHAR(50) NOT NULL
title           VARCHAR(255) NOT NULL
message         TEXT
is_read         BOOLEAN DEFAULT false
read_at         TIMESTAMP
created_at      TIMESTAMP DEFAULT NOW()
```

### Diagrama de Relacionamentos

```
users (1) ----< (N) user_roles (N) >---- (1) roles
                                                |
                                                |
                                         (1) ----< (N) role_permissions (N) >---- (1) permissions

users (1) ----< (N) sessions
users (1) ----< (N) audit_logs
users (1) ----< (N) password_resets
users (1) ----< (N) email_verifications
users (1) ----< (N) login_attempts (via email)
users (1) ----< (N) admin_actions (admin_id)
users (1) ----< (N) admin_actions (target_user_id)
users (1) ----< (N) notifications
```

### Índices de Performance

```sql
-- Busca e performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_login_attempts_email_ip ON login_attempts(email, ip_address, created_at);

-- Full-text search
CREATE INDEX idx_users_search ON users USING gin(to_tsvector('english', name || ' ' || email));
```

### Seeds Iniciais

#### Permissões (módulos principais)
```javascript
// Módulo: users
'users.view'           // Ver lista de usuários
'users.view.details'   // Ver detalhes completos
'users.create'         // Criar usuários
'users.edit'           // Editar usuários
'users.delete'         // Deletar usuários
'users.block'          // Bloquear/desbloquear
'users.reset_password' // Resetar senha

// Módulo: roles
'roles.view'
'roles.create'
'roles.edit'
'roles.delete'
'roles.assign'

// Módulo: audit
'audit.view'

// Módulo: settings
'settings.view'
'settings.edit'

// Módulo: sessions
'sessions.view'
'sessions.revoke'
```

#### Roles Padrão
```javascript
// 1. Super Admin
{
  name: 'super_admin',
  display_name: 'Super Administrador',
  color: '#DC2626',
  permissions: ['*'],
  is_system: true
}

// 2. Admin
{
  name: 'admin',
  display_name: 'Administrador',
  color: '#EA580C',
  permissions: ['users.*', 'roles.view', 'roles.assign', 'audit.view', 'sessions.*'],
  is_system: true
}

// 3. Moderador
{
  name: 'moderator',
  display_name: 'Moderador',
  color: '#2563EB',
  permissions: ['users.view', 'users.view.details', 'users.edit', 'users.block', 'audit.view'],
  is_system: true
}

// 4. Member
{
  name: 'member',
  display_name: 'Membro',
  color: '#059669',
  permissions: [],
  is_system: true
}
```

---

## 📈 Progresso de Desenvolvimento

### Fase 1: Backend - Estrutura de Dados ⏳

- [x] Planejar estrutura completa do banco de dados
- [ ] Renomear referências de WorkAdventure para WorkCodeForge
  - [ ] Variáveis de ambiente (.env files)
  - [ ] Client ID e Client Secret
  - [ ] Nomes de database
  - [ ] Comentários e documentação no código
  - [ ] URLs e endpoints
  - [ ] Mensagens de log
- [ ] Criar/atualizar entities TypeORM
  - [ ] UserEntity (adicionar novos campos)
  - [ ] SessionEntity (adicionar revoked_at)
  - [ ] AuditLogEntity (adicionar campos de contexto)
  - [ ] RoleEntity (criar nova)
  - [ ] PermissionEntity (criar nova)
  - [ ] UserRoleEntity (criar nova)
  - [ ] RolePermissionEntity (criar nova)
  - [ ] PasswordResetEntity (criar nova)
  - [ ] EmailVerificationEntity (criar nova)
  - [ ] LoginAttemptEntity (criar nova)
  - [ ] AdminActionEntity (criar nova)
  - [ ] SystemSettingEntity (criar nova)
  - [ ] NotificationEntity (criar nova)
- [ ] Configurar migrations TypeORM
- [ ] Criar seeds de dados iniciais
- [ ] Atualizar DatabaseModule

**Data Início:** 2024-10-04
**Status:** Em planejamento

### Fase 2: Backend - AdminModule ⏳

- [ ] Criar AdminModule estrutura básica
  - [ ] admin.module.ts
  - [ ] admin.controller.ts
  - [ ] admin.service.ts
- [ ] Implementar Guards de permissão
  - [ ] AdminGuard (verificar role admin)
  - [ ] PermissionsGuard (verificar permissões granulares)
- [ ] Criar endpoints de gestão de usuários
  - [ ] GET /admin/users (listar paginado)
  - [ ] GET /admin/users/:id (detalhes)
  - [ ] PUT /admin/users/:id (editar)
  - [ ] DELETE /admin/users/:id (deletar)
  - [ ] PUT /admin/users/:id/status (ativar/desativar)
  - [ ] PUT /admin/users/:id/block (bloquear)
- [ ] Criar endpoints de roles
  - [ ] GET /admin/roles
  - [ ] POST /admin/roles
  - [ ] PUT /admin/roles/:id
  - [ ] DELETE /admin/roles/:id
- [ ] Criar endpoints de auditoria
  - [ ] GET /admin/audit-logs (paginado)
  - [ ] GET /admin/audit-logs/user/:userId
- [ ] Criar endpoint de estatísticas
  - [ ] GET /admin/stats

**Data Início:** Aguardando Fase 1
**Status:** Pendente

### Fase 3: Frontend - Estrutura e Routing ⏳

- [ ] Adicionar svelte-routing
- [ ] Criar estrutura de pastas
  - [ ] src/routes/admin/
  - [ ] src/components/admin/
  - [ ] src/stores/
  - [ ] src/utils/
- [ ] Criar layout admin
  - [ ] AdminLayout.svelte (com sidebar)
  - [ ] Sidebar.svelte
  - [ ] Header.svelte
- [ ] Configurar rotas
  - [ ] /admin (Dashboard)
  - [ ] /admin/users (Lista)
  - [ ] /admin/users/:id (Detalhes)
  - [ ] /admin/logs (Auditoria)
  - [ ] /admin/roles (Gestão de roles)
- [ ] Criar stores Svelte
  - [ ] authStore.js (autenticação)
  - [ ] adminStore.js (dados admin)
  - [ ] uiStore.js (estado UI)

**Data Início:** Aguardando Fase 2
**Status:** Pendente

### Fase 4: Frontend - Dashboard ⏳

- [ ] Dashboard.svelte
  - [ ] Cards de estatísticas
    - [ ] Total de usuários
    - [ ] Novos hoje
    - [ ] Usuários online
    - [ ] Logins hoje
  - [ ] Gráficos
    - [ ] Registros por dia (7 dias)
    - [ ] Logins por dia
    - [ ] Distribuição de roles
  - [ ] Atividade recente

**Data Início:** Aguardando Fase 3
**Status:** Pendente

### Fase 5: Frontend - Gestão de Usuários ⏳

- [ ] UserList.svelte
  - [ ] Tabela de usuários
  - [ ] Busca e filtros
  - [ ] Paginação
  - [ ] Ações rápidas
- [ ] UserDetail.svelte
  - [ ] Informações do usuário
  - [ ] Edição de dados
  - [ ] Gestão de roles
  - [ ] Histórico de ações
  - [ ] Sessões ativas
- [ ] Componentes auxiliares
  - [ ] UserTable.svelte
  - [ ] UserForm.svelte
  - [ ] RoleBadge.svelte

**Data Início:** Aguardando Fase 4
**Status:** Pendente

### Fase 6: Frontend - Auditoria e Logs ⏳

- [ ] AuditLogs.svelte
  - [ ] Tabela de logs
  - [ ] Filtros avançados
  - [ ] Export de dados
- [ ] Componentes
  - [ ] LogsTable.svelte
  - [ ] LogDetails.svelte

**Data Início:** Aguardando Fase 5
**Status:** Pendente

### Fase 7: Testes e Documentação ⏳

- [ ] Testes backend
  - [ ] Unit tests (services)
  - [ ] Integration tests (controllers)
- [ ] Testes frontend
  - [ ] Component tests
- [ ] Documentação
  - [ ] API docs (Swagger)
  - [ ] Guia de uso
  - [ ] Screenshots

**Data Início:** Aguardando Fase 6
**Status:** Pendente

---

## 🐛 Problemas e Soluções

### Problema 1: [Título do Problema]

**Data:** YYYY-MM-DD
**Fase:** Nome da Fase

**Descrição:**
Descrever o problema encontrado de forma clara e detalhada.

**Tentativas:**
1. Primeira tentativa e resultado
2. Segunda tentativa e resultado
3. ...

**Solução:**
Descrever a solução que funcionou.

**Código/Mudanças:**
```typescript
// Código relevante
```

**Lições Aprendidas:**
- Ponto importante 1
- Ponto importante 2

---

### Problema 2: [Título do Problema]

**Data:** YYYY-MM-DD
**Fase:** Nome da Fase

...

---

## 💡 Decisões de Design

### Decisão 1: Sistema de Permissões

**Data:** 2024-10-04
**Contexto:** Definir como implementar permissões granulares

**Opções Consideradas:**
1. **Tags simples (atual)** - Array de strings no user
2. **RBAC (Role-Based)** - Tabela de roles + user_roles
3. **ABAC (Attribute-Based)** - Sistema complexo com atributos

**Decisão:** RBAC (opção 2)

**Justificativa:**
- Mais flexível que tags simples
- Mais simples que ABAC
- Padrão da indústria
- Fácil de entender e manter
- Suporta herança de permissões

**Implementação:**
- Tabelas: `roles`, `permissions`, `role_permissions`, `user_roles`
- Wildcard support: `users.*` = todas permissões de users
- Guards customizados no NestJS

---

### Decisão 2: Soft Delete vs Hard Delete

**Data:** 2024-10-04
**Contexto:** Como deletar usuários

**Opções Consideradas:**
1. **Hard Delete** - Deletar registro permanentemente
2. **Soft Delete** - Marcar como deletado (deleted_at)

**Decisão:** Soft Delete (opção 2)

**Justificativa:**
- Manter auditoria completa
- Possibilidade de recuperação
- Preservar integridade de logs
- Compliance com GDPR (com purge agendado)

**Implementação:**
- Campo `deleted_at` em UserEntity
- Filtrar automaticamente no query
- Endpoint admin para purge definitivo

---

### Decisão 3: Frontend - Biblioteca de UI

**Data:** 2024-10-04
**Contexto:** Escolher componentes UI para o admin

**Opções Consideradas:**
1. **CSS puro + componentes custom**
2. **Tailwind CSS**
3. **Svelte Material UI**
4. **Carbon Components**

**Decisão:** A decidir com o usuário

**Considerações:**
- Consistência com resto do projeto
- Curva de aprendizado
- Tamanho do bundle
- Customização

---

## ✅ Testes e Validações

### Checklist de Testes - Backend

#### Módulo Admin
- [ ] Guard de permissões funciona corretamente
- [ ] Endpoints protegidos rejeitam usuários sem permissão
- [ ] Listagem de usuários com paginação
- [ ] Busca de usuários funciona
- [ ] Edição de usuário persiste dados
- [ ] Soft delete funciona
- [ ] Bloqueio de usuário impede login
- [ ] Auditoria registra todas ações admin

#### Módulo Roles
- [ ] Criação de role
- [ ] Atribuição de permissões
- [ ] Atribuição de roles a usuários
- [ ] Roles de sistema não podem ser deletadas
- [ ] Wildcards de permissão funcionam

#### Módulo Auditoria
- [ ] Logs são criados automaticamente
- [ ] Filtros de logs funcionam
- [ ] Paginação de logs
- [ ] Export de logs

### Checklist de Testes - Frontend

#### Layout e Navegação
- [ ] Sidebar funciona
- [ ] Rotas protegidas redirecionam
- [ ] Menu responsivo em mobile
- [ ] Logout funciona

#### Dashboard
- [ ] Cards de estatísticas carregam
- [ ] Gráficos renderizam corretamente
- [ ] Dados atualizam em tempo real

#### Gestão de Usuários
- [ ] Listagem carrega
- [ ] Busca funciona
- [ ] Filtros funcionam
- [ ] Paginação funciona
- [ ] Edição salva dados
- [ ] Validação de formulários

---

## 📡 API Endpoints

### Admin - Users

#### `GET /admin/users`
Lista usuários com paginação e filtros.

**Query Parameters:**
- `page` (number) - Página atual (default: 1)
- `limit` (number) - Items por página (default: 20)
- `search` (string) - Busca por nome/email
- `role` (string) - Filtrar por role
- `status` (string) - 'active' | 'inactive' | 'blocked'
- `sort` (string) - Campo de ordenação
- `order` (string) - 'ASC' | 'DESC'

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "username": "username",
      "roles": ["admin"],
      "isActive": true,
      "isEmailVerified": true,
      "lastLogin": "2024-10-04T10:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

#### `GET /admin/users/:id`
Detalhes completos de um usuário.

**Response 200:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "username": "username",
  "avatarUrl": "https://...",
  "roles": [
    {
      "id": "uuid",
      "name": "admin",
      "displayName": "Administrador",
      "color": "#EA580C"
    }
  ],
  "isActive": true,
  "isEmailVerified": true,
  "blockedAt": null,
  "blockedReason": null,
  "lastLogin": "2024-10-04T10:00:00Z",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-10-04T09:00:00Z",
  "sessions": [
    {
      "id": "uuid",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-10-04T08:00:00Z",
      "expiresAt": "2024-10-04T20:00:00Z"
    }
  ],
  "recentActions": [
    {
      "action": "login",
      "createdAt": "2024-10-04T10:00:00Z",
      "metadata": {}
    }
  ]
}
```

---

#### `PUT /admin/users/:id`
Editar usuário.

**Request:**
```json
{
  "name": "New Name",
  "email": "newemail@example.com",
  "isActive": true,
  "roleIds": ["role-uuid-1", "role-uuid-2"]
}
```

**Response 200:**
```json
{
  "success": true,
  "user": { /* user object */ }
}
```

---

#### `PUT /admin/users/:id/block`
Bloquear/desbloquear usuário.

**Request:**
```json
{
  "blocked": true,
  "reason": "Violação dos termos de uso"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "User blocked successfully"
}
```

---

### Admin - Roles

#### `GET /admin/roles`
Listar roles.

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "admin",
      "displayName": "Administrador",
      "description": "Acesso total ao sistema",
      "color": "#EA580C",
      "permissions": ["users.*", "roles.*"],
      "isSystem": true,
      "userCount": 5
    }
  ]
}
```

---

#### `POST /admin/roles`
Criar nova role.

**Request:**
```json
{
  "name": "support",
  "displayName": "Suporte",
  "description": "Equipe de suporte",
  "color": "#10B981",
  "permissionIds": ["perm-uuid-1", "perm-uuid-2"]
}
```

---

### Admin - Audit

#### `GET /admin/audit-logs`
Logs de auditoria.

**Query Parameters:**
- `page`, `limit` - Paginação
- `userId` - Filtrar por usuário
- `action` - Filtrar por ação
- `startDate`, `endDate` - Período

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "action": "user.block",
      "targetType": "user",
      "targetId": "target-uuid",
      "ipAddress": "192.168.1.1",
      "metadata": {
        "reason": "Spam"
      },
      "createdAt": "2024-10-04T10:00:00Z"
    }
  ],
  "meta": {
    "total": 1000,
    "page": 1,
    "limit": 50
  }
}
```

---

### Admin - Stats

#### `GET /admin/stats`
Estatísticas do sistema.

**Response 200:**
```json
{
  "users": {
    "total": 1500,
    "active": 1200,
    "blocked": 50,
    "newToday": 15,
    "newThisWeek": 80,
    "newThisMonth": 250
  },
  "sessions": {
    "active": 450,
    "total": 50000
  },
  "logins": {
    "today": 890,
    "thisWeek": 5400,
    "failedToday": 23
  },
  "roles": {
    "distribution": {
      "admin": 10,
      "moderator": 50,
      "member": 1440
    }
  },
  "charts": {
    "registrations": [
      { "date": "2024-10-01", "count": 45 },
      { "date": "2024-10-02", "count": 38 }
    ],
    "logins": [
      { "date": "2024-10-01", "count": 890 }
    ]
  }
}
```

---

## 📝 Notas de Desenvolvimento

### Convenções de Código

**Backend:**
- DTOs em `*.dto.ts`
- Entities em `*.entity.ts`
- Services em `*.service.ts`
- Controllers em `*.controller.ts`
- Guards em `guards/`

**Frontend:**
- Componentes PascalCase: `UserList.svelte`
- Stores camelCase: `authStore.js`
- Utils/helpers lowercase: `api.js`

### Comandos Úteis

```bash
# Gerar migration
npm run typeorm migration:generate -- -n MigrationName

# Rodar migrations
npm run typeorm migration:run

# Reverter migration
npm run typeorm migration:revert

# Seed de dados
npm run seed
```

---

## 🔄 Histórico de Mudanças

### 2024-10-04
- ✅ Planejamento inicial da estrutura do banco
- ✅ Definição de entities e relacionamentos
- ✅ Documentação base criada
- ⏳ Aguardando confirmação para iniciar implementação

---

**Última atualização:** 2024-10-04
**Próxima revisão:** Após Fase 1
