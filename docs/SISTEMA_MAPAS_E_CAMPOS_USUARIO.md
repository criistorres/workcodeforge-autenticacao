# Sistema de Mapas e Novos Campos de Usuário

**Data de Implementação:** 03 de Novembro de 2025
**Desenvolvedor:** Claude Code Assistant

## Resumo

Este documento descreve a implementação de duas funcionalidades principais no sistema WorkCodeForge:
1. **Sistema de Gerenciamento de Mapas:** CRUD completo de mapas com interface administrativa
2. **Campos Adicionais de Usuário:** Novos campos (telefone, CPF, departamento, avatarUrl) na edição de usuários

---

## 1. Sistema de Gerenciamento de Mapas

### 1.1 Objetivo

Permitir que administradores criem e gerenciem mapas dinamicamente através do painel administrativo, substituindo os mapas hardcoded anteriormente existentes no código.

### 1.2 Componentes Implementados

#### Backend

**Entidade MapEntity** (`workadventure-auth/backend/src/users/entities/map.entity.ts`)
```typescript
@Entity('maps')
export class MapEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ length: 200 })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true, length: 500 })
  mapUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Controller** (`workadventure-auth/backend/src/admin/admin.controller.ts`)
- `GET /admin/maps` - Listar todos os mapas
- `POST /admin/maps` - Criar novo mapa
- `PUT /admin/maps/:id` - Atualizar mapa
- `DELETE /admin/maps/:id` - Deletar mapa

**Service** (`workadventure-auth/backend/src/admin/admin.service.ts`)
- Métodos CRUD completos para gerenciamento de mapas
- Integração com TypeORM Repository

**Módulo** (`workadventure-auth/backend/src/admin/admin.module.ts`)
- Registro da entidade MapEntity no TypeOrmModule

#### Frontend

**Componente MapList.svelte** (`workadventure-auth/frontend/src/routes/admin/MapList.svelte`)
- Interface completa de gerenciamento de mapas
- Cards visuais para cada mapa
- Modais para criar, editar e deletar mapas
- Validação de formulários
- Feedback visual de estados (ativo/inativo)

**API Client** (`workadventure-auth/frontend/src/utils/api.js`)
```javascript
// Maps
getMaps: () => apiRequest('/admin/maps'),
createMap: (data) => apiRequest('/admin/maps', { method: 'POST', body: JSON.stringify(data) }),
updateMap: (mapId, data) => apiRequest(`/admin/maps/${mapId}`, { method: 'PUT', body: JSON.stringify(data) }),
deleteMap: (mapId) => apiRequest(`/admin/maps/${mapId}`, { method: 'DELETE' }),
```

**Roteamento** (`workadventure-auth/frontend/src/App.svelte`)
- Adicionada rota `/admin/maps` para MapList

**Sidebar** (`workadventure-auth/frontend/src/components/Sidebar.svelte`)
- Adicionado item "Mapas" com ícone

**Ícone** (`workadventure-auth/frontend/src/components/Icon.svelte`)
- Adicionado ícone SVG de mapa (name='map')

### 1.3 Fluxo de Uso

1. **Acessar Gerenciamento de Mapas:**
   - Login no painel admin (`http://auth.workadventure.localhost/#/admin/login`)
   - Clicar em "Mapas" na sidebar

2. **Criar Novo Mapa:**
   - Clicar em "Novo Mapa"
   - Preencher:
     - **Nome (ID):** Identificador único (apenas letras minúsculas, números e hífens)
     - **Nome de Exibição:** Nome amigável para exibição
     - **Descrição:** Descrição opcional do mapa
     - **URL do Mapa:** URL opcional do arquivo do mapa
     - **Mapa Ativo:** Checkbox para ativar/desativar
   - Clicar em "Criar Mapa"

3. **Editar Mapa:**
   - Clicar em "Editar" no card do mapa desejado
   - Modificar campos necessários
   - Clicar em "Salvar Alterações"

4. **Deletar Mapa:**
   - Clicar em "Deletar" no card do mapa
   - Confirmar exclusão no modal

### 1.4 Mapas Padrão Criados

Três mapas foram criados para manter a compatibilidade com o sistema anterior:

| Nome (ID) | Nome de Exibição | Descrição | Status |
|-----------|------------------|-----------|--------|
| `filial1` | Filial 1 | Mapa da Filial 1 | Ativo |
| `filial2` | Filial 2 | Mapa da Filial 2 | Ativo |
| `main` | Principal (Main) | Mapa principal padrão | Ativo |

---

## 2. Novos Campos de Usuário

### 2.1 Objetivo

Expandir as informações de usuário com campos adicionais para melhor gerenciamento e personalização.

### 2.2 Campos Adicionados

#### Modelo de Usuário (`workadventure-auth/backend/src/users/entities/user.entity.ts`)

Campos já existentes no modelo mas que **não estavam contemplados** no formulário de edição:

| Campo | Tipo | Descrição | Validação |
|-------|------|-----------|-----------|
| `avatarUrl` | string | URL do avatar do usuário | max 500 caracteres |
| `telefone` | string | Telefone de contato | max 20 caracteres |
| `cpf` | string | CPF do usuário | max 14 caracteres, único |
| `departamento` | string | Departamento/setor | max 100 caracteres |

### 2.3 Atualizações Implementadas

#### Backend

**Controller** (`workadventure-auth/backend/src/admin/admin.controller.ts`)
```typescript
@Put('users/:id')
async updateUser(
  @Param('id') id: string,
  @Body() data: {
    name?: string;
    email?: string;
    username?: string;
    avatarUrl?: string;      // ← NOVO
    telefone?: string;        // ← NOVO
    cpf?: string;            // ← NOVO
    departamento?: string;   // ← NOVO
    isActive?: boolean;
    defaultMap?: string;
  },
) {
  return this.adminService.updateUser(id, data);
}
```

**Service** (`workadventure-auth/backend/src/admin/admin.service.ts`)
- Atualizado para aceitar os novos campos no método `updateUser`

#### Frontend

**UserDetail.svelte** (`workadventure-auth/frontend/src/routes/admin/UserDetail.svelte`)

**Formulário de Edição:**
```svelte
<!-- Telefone e CPF -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label>Telefone</label>
    <input type="tel" bind:value={formData.telefone}
           placeholder="(00) 00000-0000" maxlength="20" />
  </div>
  <div>
    <label>CPF</label>
    <input type="text" bind:value={formData.cpf}
           placeholder="000.000.000-00" maxlength="14" />
  </div>
</div>

<!-- Departamento e Avatar -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label>Departamento</label>
    <input type="text" bind:value={formData.departamento}
           placeholder="Ex: TI, RH, Financeiro" maxlength="100" />
  </div>
  <div>
    <label>Avatar URL</label>
    <input type="url" bind:value={formData.avatarUrl}
           placeholder="https://exemplo.com/avatar.png" maxlength="500" />
  </div>
</div>
```

**Visualização (modo leitura):**
- Adicionados campos de exibição para telefone, CPF, departamento
- Exibição de avatar com preview de imagem quando `avatarUrl` estiver preenchido

### 2.4 Integração com Mapas

**Select de Mapa Padrão** - Agora dinâmico:

**Antes (hardcoded):**
```svelte
<select bind:value={formData.defaultMap}>
  <option value="main">Principal (main)</option>
  <option value="filial1">Filial 1</option>
  <option value="filial2">Filial 2</option>
  <option value="sede">Sede</option>
</select>
```

**Depois (dinâmico):**
```svelte
<select bind:value={formData.defaultMap}>
  <option value="">Selecione um mapa</option>
  {#each allMaps.filter(m => m.isActive) as map}
    <option value={map.name}>{map.displayName}</option>
  {/each}
</select>
{#if allMaps.length === 0}
  <p class="text-yellow-300 text-xs mt-1">
    ⚠️ Nenhum mapa cadastrado. Crie mapas na seção de gerenciamento.
  </p>
{/if}
```

**Função de Carregamento:**
```javascript
async function loadMaps() {
  try {
    allMaps = await adminAPI.getMaps();
  } catch (err) {
    console.error('Error loading maps:', err);
  }
}

onMount(() => {
  loadUser();
  loadRoles();
  loadMaps();  // ← Carrega mapas ao montar componente
});
```

---

## 3. Banco de Dados

### 3.1 Migração

A tabela `maps` será criada automaticamente pelo TypeORM com a seguinte estrutura:

```sql
CREATE TABLE maps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    displayName VARCHAR(200) NOT NULL,
    description TEXT,
    mapUrl VARCHAR(500),
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 Campos de Usuário

Os campos já existiam na tabela `users`, não foi necessária migração adicional.

---

## 4. Testes Realizados

### 4.1 Backend
- ✅ Compilação TypeScript sem erros
- ✅ Rotas `/admin/maps` registradas corretamente
- ✅ Endpoints retornando dados esperados
- ✅ CRUD de mapas funcionando

### 4.2 Frontend
- ✅ Build Vite completado com sucesso
- ✅ Interface de mapas carregando corretamente
- ✅ Criação de mapas funcionando
- ✅ Edição de usuários com novos campos funcionando
- ✅ Select de mapas carregando dinamicamente
- ✅ Validações de formulário ativas

### 4.3 Integração
- ✅ API respondendo corretamente após rebuild
- ✅ Mapas criados aparecem no select de usuários
- ✅ Apenas mapas ativos são exibidos no select

---

## 5. Arquivos Modificados

### Backend

| Arquivo | Tipo de Mudança |
|---------|----------------|
| `src/users/entities/map.entity.ts` | **NOVO** - Entidade de mapa |
| `src/admin/admin.controller.ts` | **MODIFICADO** - Adicionadas rotas de mapas e campos de usuário |
| `src/admin/admin.service.ts` | **MODIFICADO** - Métodos CRUD de mapas e atualização de usuário |
| `src/admin/admin.module.ts` | **MODIFICADO** - Registro de MapEntity |

### Frontend

| Arquivo | Tipo de Mudança |
|---------|----------------|
| `src/routes/admin/MapList.svelte` | **NOVO** - Página de gerenciamento de mapas |
| `src/routes/admin/UserDetail.svelte` | **MODIFICADO** - Novos campos e select dinâmico |
| `src/utils/api.js` | **MODIFICADO** - Métodos API de mapas |
| `src/App.svelte` | **MODIFICADO** - Rota de mapas |
| `src/components/Sidebar.svelte` | **MODIFICADO** - Item de menu Mapas |
| `src/components/Icon.svelte` | **MODIFICADO** - Ícone de mapa |

---

## 6. Deploy e Build

### 6.1 Backend

```bash
cd workadventure-auth/backend
npm run build
```

### 6.2 Frontend

```bash
cd workadventure-auth/frontend
npm run build
```

### 6.3 Docker

```bash
cd /Users/cristiantorres/Documents/GitHub/workcodeforge-autenticacao
docker-compose up -d --build auth-backend auth-frontend
```

---

## 7. Uso em Produção

### 7.1 Primeira Configuração

Após deploy inicial, é recomendado criar os mapas padrão:

1. Acessar painel admin
2. Navegar para "Mapas"
3. Criar os mapas necessários para o projeto

### 7.2 Associar Mapas a Usuários

1. Ir para "Usuários" → "Lista de Usuários"
2. Clicar em "Ver Detalhes" do usuário
3. Clicar em "Editar"
4. Selecionar o mapa padrão no dropdown
5. Salvar alterações

---

## 8. Melhorias Futuras Sugeridas

### 8.1 Sistema de Mapas
- [ ] Upload de arquivos de mapa diretamente pela interface
- [ ] Preview de mapas na listagem
- [ ] Filtros e busca de mapas
- [ ] Paginação para muitos mapas
- [ ] Histórico de alterações de mapas

### 8.2 Campos de Usuário
- [ ] Validação de CPF com algoritmo verificador
- [ ] Máscara automática para telefone e CPF
- [ ] Upload de avatar diretamente (substituindo URL)
- [ ] Crop/resize de imagem de avatar
- [ ] Validação de formato de telefone

### 8.3 Geral
- [ ] Testes unitários para backend
- [ ] Testes E2E para interface
- [ ] Documentação de API (Swagger)
- [ ] Logs de auditoria para mudanças em mapas

---

## 9. Troubleshooting

### 9.1 Mapas não aparecem no select

**Problema:** Select de mapa padrão vazio
**Solução:**
1. Verificar se há mapas cadastrados em `/admin/maps`
2. Verificar se os mapas estão marcados como ativos
3. Verificar console do browser para erros de API

### 9.2 Erro 404 ao acessar /admin/maps

**Problema:** Backend não reconhece a rota
**Solução:**
1. Rebuild do backend: `npm run build`
2. Restart dos containers: `docker-compose restart auth-backend`
3. Verificar logs: `docker-compose logs auth-backend`

### 9.3 Campos de usuário não salvam

**Problema:** Novos campos não persistem no banco
**Solução:**
1. Verificar se o backend foi atualizado com os novos DTOs
2. Verificar permissões do usuário admin
3. Checar logs de erro no backend

---

## 10. Contato e Suporte

Para dúvidas ou problemas relacionados a estas funcionalidades, consulte:
- Documentação do projeto: `/docs`
- Issues no GitHub: [Link do repositório]

---

**Última Atualização:** 03 de Novembro de 2025
**Versão do Sistema:** 2.0.0
