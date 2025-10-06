# 🚀 Roadmap SaaS Multi-Tenant - WorkAdventure Auth

**Objetivo**: Transformar o sistema atual em um SaaS onde cada cliente tem seu próprio workspace isolado com mapas personalizados.

**Estratégia**: MVP sem billing inicialmente, foco em multi-tenancy e experiência do usuário.

---

## 📊 Visão Geral da Arquitetura

### **Modelo Multi-Tenant Escolhido: Shared Database + Tenant Isolation**

```
┌─────────────────────────────────────────────────────────────┐
│                    workadventure.io                         │
│                   (Landing Page Pública)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Signup Flow     │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────────────────────┐
                    │  Cria Workspace                   │
                    │  subdomain: "acme"                │
                    │  owner: user@email.com            │
                    └─────────┬─────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
┌───────▼──────────┐                    ┌───────────▼────────┐
│ acme.workadv.io  │                    │ startup.workadv.io │
│                  │                    │                    │
│ Mapa: Office     │                    │ Mapa: Cafe         │
│ Users: 5/10      │                    │ Users: 2/10        │
│ Owner: ACME Inc  │                    │ Owner: Startup XYZ │
└──────────────────┘                    └────────────────────┘
```

---

## 🎯 MVP - Fase 1 (4-5 semanas)

### **Objetivo**: Permitir que múltiplos workspaces coexistam, cada um com seu próprio mapa e usuários isolados.

**Não inclui**:
- ❌ Billing/Stripe
- ❌ Planos pagos
- ❌ Limites rígidos de uso
- ❌ Custom domains

**Inclui**:
- ✅ Signup self-service
- ✅ Workspace por subdomain
- ✅ Isolamento de dados (users, maps, sessions)
- ✅ Map templates pré-configurados
- ✅ Admin panel para gerenciar workspace

---

## 📅 Sprint Breakdown - MVP

### **Sprint 1: Database Schema & Core Entities (Semana 1)**

#### 1.1 Atualizar UserEntity com Campos Brasileiros

**IMPORTANTE**: Antes de criar workspaces, precisamos melhorar o cadastro de usuários.

**Arquivo**: `backend/src/users/entities/user.entity.ts`

```typescript
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 📧 Autenticação
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  // 👤 Identificação
  @Column()
  name: string; // Nome completo

  @Column({ unique: true, length: 20 })
  nickname: string; // NOVO: Como aparece no mundo virtual

  @Column({ unique: true })
  username: string; // Gerado do email (para OIDC)

  // 📄 Documentos Brasileiros
  @Column({ type: 'enum', enum: ['personal', 'business'] })
  accountType: 'personal' | 'business';

  @Column({ type: 'enum', enum: ['cpf', 'cnpj'] })
  documentType: 'cpf' | 'cnpj';

  @Column({ unique: true, length: 18 })
  documentNumber: string; // CPF ou CNPJ (sem máscara)

  // 🏢 Empresa (se accountType = business)
  @Column({ nullable: true })
  companyName?: string;

  @Column({ nullable: true })
  tradingName?: string; // Nome fantasia

  @Column({ nullable: true, length: 20 })
  stateRegistration?: string;

  // 📞 Contato
  @Column({ nullable: true, length: 20 })
  phone?: string;

  // 📍 Endereço (JSONB)
  @Column({ type: 'jsonb', nullable: true })
  address?: {
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string; // UF
  };

  // 💼 Profissional
  @Column({ nullable: true })
  jobTitle?: string;

  @Column({ nullable: true })
  department?: string;

  // 🎨 Avatar
  @Column({ nullable: true, length: 500 })
  avatarUrl?: string;

  // 🏷️ Tags (OIDC roles)
  @Column('simple-array', { default: 'member' })
  tags: string[];

  // 🔒 Status
  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: false })
  isPhoneVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  blockedAt: Date;

  @Column({ type: 'text', nullable: true })
  blockedReason: string;

  // 📅 Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin: Date;

  // 🔗 Relações
  @OneToMany(() => SessionEntity, session => session.user)
  sessions: SessionEntity[];

  @OneToMany(() => AuditLogEntity, log => log.user)
  auditLogs: AuditLogEntity[];

  @OneToMany(() => WorkspaceMemberEntity, member => member.user)
  workspaceMemberships: WorkspaceMemberEntity[];
}
```

#### 1.2 Criar Entidades Base de Workspace

**Arquivo**: `backend/src/workspaces/entities/workspace.entity.ts`

```typescript
@Entity('workspaces')
export class WorkspaceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  subdomain: string; // "acme", "startup-demo"
  // Validação: apenas [a-z0-9-], min 3 chars, max 50

  @Column({ length: 100 })
  displayName: string; // "ACME Corporation"

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: {} })
  settings: {
    defaultMapId?: string;
    brandColor?: string; // "#6366f1"
    logoUrl?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relações
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'ownerId' })
  owner: UserEntity;

  @Column()
  ownerId: string;

  @OneToMany(() => WorkspaceMemberEntity, member => member.workspace)
  members: WorkspaceMemberEntity[];

  @OneToMany(() => MapEntity, map => map.workspace)
  maps: MapEntity[];
}
```

**Arquivo**: `backend/src/workspaces/entities/workspace-member.entity.ts`

```typescript
@Entity('workspace_members')
export class WorkspaceMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkspaceEntity)
  @JoinColumn({ name: 'workspaceId' })
  workspace: WorkspaceEntity;

  @Column()
  workspaceId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  userId: string;

  @Column({ default: 'member' })
  role: 'owner' | 'admin' | 'member';

  @CreateDateColumn()
  joinedAt: Date;

  // Unique constraint: um user só pode estar uma vez em um workspace
  @Index(['workspaceId', 'userId'], { unique: true })
}
```

**Arquivo**: `backend/src/maps/entities/map.entity.ts`

```typescript
@Entity('maps')
export class MapEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string; // "Company HQ"

  @Column({ length: 200, nullable: true })
  description: string;

  @Column({ length: 500 })
  filePath: string; // "workspaces/{workspaceId}/maps/{id}.json"

  @Column({ length: 500, nullable: true })
  thumbnailUrl: string;

  @Column({ default: false })
  isDefault: boolean; // Se é o mapa padrão do workspace

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    maxPlayers?: number;
    size?: { width: number; height: number };
    features?: string[]; // ["jitsi", "chat", "youtube"]
  };

  @ManyToOne(() => WorkspaceEntity)
  @JoinColumn({ name: 'workspaceId' })
  workspace: WorkspaceEntity;

  @Column()
  workspaceId: string;

  @ManyToOne(() => MapTemplateEntity, { nullable: true })
  @JoinColumn({ name: 'templateId' })
  template: MapTemplateEntity;

  @Column({ nullable: true })
  templateId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Arquivo**: `backend/src/maps/entities/map-template.entity.ts`

```typescript
@Entity('map_templates')
export class MapTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  slug: string; // "welcome-lobby"

  @Column({ length: 100 })
  name: string; // "Welcome Lobby"

  @Column({ length: 500 })
  description: string;

  @Column({ length: 500 })
  thumbnailUrl: string;

  @Column({ default: 'social' })
  category: 'office' | 'social' | 'event' | 'education';

  @Column({ length: 500 })
  templateFilePath: string; // "templates/welcome-lobby.json"

  @Column({ type: 'jsonb' })
  metadata: {
    maxPlayers: number;
    size: { width: number; height: number };
    features: string[];
  };

  @Column({ default: 0 })
  usageCount: number; // Quantos workspaces usaram este template

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

#### 1.3 Criar Validadores de Documentos Brasileiros

**Arquivo**: `backend/src/common/validators/document.validator.ts`

```typescript
export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false; // 111.111.111-11

  // Algoritmo de validação do CPF
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  let digit1 = remainder >= 10 ? 0 : remainder;

  if (digit1 !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  let digit2 = remainder >= 10 ? 0 : remainder;

  return digit2 === parseInt(cleaned.charAt(10));
}

export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');

  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  // Algoritmo de validação do CNPJ
  const weights1 = [5,4,3,2,9,8,7,6,5,4,3,2];
  const weights2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;

  if (digit1 !== parseInt(cleaned.charAt(12))) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;

  return digit2 === parseInt(cleaned.charAt(13));
}
```

#### 1.4 Migration

```bash
npm run migration:generate -- src/database/migrations/CreateWorkspaceSchema
npm run migration:run
```

**Checklist Sprint 1**:
- [ ] ✅ Atualizar UserEntity com campos brasileiros (nickname, CPF/CNPJ, endereço)
- [ ] ✅ Criar validadores de CPF e CNPJ
- [ ] ✅ Criar máscaras de input (frontend)
- [ ] ✅ Atualizar RegisterDto com novos campos
- [ ] [ ] Criar 4 entidades (Workspace, WorkspaceMember, Map, MapTemplate)
- [ ] [ ] Rodar migration
- [ ] [ ] Criar módulos NestJS (WorkspacesModule, MapsModule)
- [ ] [ ] Seeds de 3 map templates (lobby, cafe, office)

---

### **Sprint 2: Workspace CRUD & Signup Flow (Semana 2)**

#### 2.1 Backend - Auth Service (Atualizado)

**Arquivo**: `backend/src/auth/auth.service.ts`

```typescript
@Injectable()
export class AuthService {
  async register(dto: RegisterDto): Promise<UserEntity> {
    // 1. Validar CPF/CNPJ
    const cleanedDocument = dto.documentNumber.replace(/\D/g, '');

    if (dto.documentType === 'cpf') {
      if (!validateCPF(cleanedDocument)) {
        throw new BadRequestException('CPF inválido');
      }
    } else {
      if (!validateCNPJ(cleanedDocument)) {
        throw new BadRequestException('CNPJ inválido');
      }
    }

    // 2. Verificar se documento já existe
    const existingDoc = await this.userRepo.findOne({
      where: { documentNumber: cleanedDocument }
    });
    if (existingDoc) {
      throw new ConflictException('Este documento já está cadastrado');
    }

    // 3. Verificar se nickname já existe
    const existingNickname = await this.userRepo.findOne({
      where: { nickname: dto.nickname }
    });
    if (existingNickname) {
      throw new ConflictException('Este nickname já está em uso');
    }

    // 4. Gerar username do email
    const username = dto.email.split('@')[0].toLowerCase();

    // 5. Hash da senha
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 6. Criar usuário
    const user = this.userRepo.create({
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      name: dto.name,
      nickname: dto.nickname,
      username,
      accountType: dto.accountType,
      documentType: dto.documentType,
      documentNumber: cleanedDocument,
      phone: dto.phone,
      companyName: dto.companyName,
      tradingName: dto.tradingName,
      acceptedTerms: dto.acceptedTerms,
      acceptedPrivacy: dto.acceptedPrivacy,
    });

    await this.userRepo.save(user);

    return user;
  }
}
```

#### 2.2 Backend - Workspaces Service

**Arquivo**: `backend/src/workspaces/workspaces.service.ts`

```typescript
@Injectable()
export class WorkspacesService {
  async create(dto: CreateWorkspaceDto, ownerId: string): Promise<WorkspaceEntity> {
    // 1. Validar subdomain único
    const exists = await this.workspaceRepo.findOne({ where: { subdomain: dto.subdomain } });
    if (exists) throw new ConflictException('Subdomain already taken');

    // 2. Criar workspace
    const workspace = this.workspaceRepo.create({
      subdomain: dto.subdomain.toLowerCase(),
      displayName: dto.displayName,
      ownerId,
    });
    await this.workspaceRepo.save(workspace);

    // 3. Adicionar owner como membro com role "owner"
    const membership = this.memberRepo.create({
      workspaceId: workspace.id,
      userId: ownerId,
      role: 'owner',
    });
    await this.memberRepo.save(membership);

    // 4. Se escolheu um template, clonar mapa
    if (dto.templateId) {
      await this.mapsService.cloneFromTemplate(workspace.id, dto.templateId);
    }

    return workspace;
  }

  async findBySubdomain(subdomain: string): Promise<WorkspaceEntity> {
    const workspace = await this.workspaceRepo.findOne({
      where: { subdomain },
      relations: ['owner', 'members'],
    });

    if (!workspace) throw new NotFoundException('Workspace not found');
    if (!workspace.isActive) throw new ForbiddenException('Workspace is inactive');

    return workspace;
  }

  async updateSettings(workspaceId: string, settings: Partial<WorkspaceSettings>) {
    // Implementar
  }

  async inviteMember(workspaceId: string, email: string, role: string) {
    // 1. Procurar user por email (ou criar convite pendente)
    // 2. Criar WorkspaceMemberEntity
    // 3. Enviar email de convite
  }
}
```

#### 2.2 Backend - Workspaces Controller

**Arquivo**: `backend/src/workspaces/workspaces.controller.ts`

```typescript
@Controller('workspaces')
export class WorkspacesController {
  @Post()
  async create(@Body() dto: CreateWorkspaceDto, @CurrentUser() user: UserEntity) {
    return this.workspacesService.create(dto, user.id);
  }

  @Get(':subdomain')
  async findOne(@Param('subdomain') subdomain: string) {
    return this.workspacesService.findBySubdomain(subdomain);
  }

  @Patch(':id')
  @UseGuards(WorkspaceOwnerGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateWorkspaceDto) {
    return this.workspacesService.update(id, dto);
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string) {
    return this.workspacesService.getMembers(id);
  }

  @Post(':id/invite')
  @UseGuards(WorkspaceAdminGuard)
  async inviteMember(@Param('id') id: string, @Body() dto: InviteMemberDto) {
    return this.workspacesService.inviteMember(id, dto.email, dto.role);
  }
}
```

#### 2.3 Frontend - Signup Page (Atualizado com Campos Brasileiros)

**Arquivo**: `frontend/src/routes/Signup.svelte`

```svelte
<script>
  import { maskCPF, maskCNPJ } from '../utils/masks';
  import PasswordStrength from '../components/PasswordStrength.svelte';

  let step = 1; // 1: Dados pessoais, 2: Workspace, 3: Template, 4: Loading

  // Dados pessoais
  let name = '';
  let nickname = '';
  let email = '';
  let password = '';
  let accountType = 'personal'; // 'personal' ou 'business'
  let documentNumber = '';
  let phone = '';
  let companyName = '';
  let tradingName = '';
  let acceptedTerms = false;

  // Workspace
  let subdomain = '';
  let displayName = '';
  let selectedTemplate = null;

  let templates = [];
  let nicknameAvailable = null;
  let loading = false;

  onMount(async () => {
    // Carregar templates disponíveis
    const res = await fetch('/map-templates');
    templates = await res.json();
  });

  async function checkNickname() {
    if (nickname.length < 3) return;
    const res = await fetch(`/auth/check-nickname?nickname=${nickname}`);
    nicknameAvailable = res.ok;
  }

  function formatDocument() {
    if (accountType === 'personal') {
      documentNumber = maskCPF(documentNumber);
    } else {
      documentNumber = maskCNPJ(documentNumber);
    }
  }

  async function handlePersonalDataSubmit() {
    // Validações client-side
    if (!acceptedTerms) {
      alert('Você deve aceitar os termos');
      return;
    }
    step = 2; // Vai para configuração do workspace
  }

  async function handleWorkspaceSubmit() {
    step = 3; // Vai para escolha de template
  }

  async function handleFinalSubmit() {
    step = 4;
    loading = true;

    try {
      // 1. Criar conta
      const registerRes = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          nickname,
          email,
          password,
          accountType,
          documentType: accountType === 'personal' ? 'cpf' : 'cnpj',
          documentNumber,
          phone,
          companyName,
          tradingName,
          acceptedTerms,
          acceptedPrivacy: true,
        }),
      });

      if (!registerRes.ok) {
        const error = await registerRes.json();
        throw new Error(error.message);
      }

      const { userId } = await registerRes.json();

      // 2. Criar workspace
      const workspaceRes = await fetch('/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain,
          displayName,
          templateId: selectedTemplate?.id,
        }),
      });

      if (!workspaceRes.ok) {
        throw new Error('Erro ao criar workspace');
      }

      // 3. Redirecionar para workspace
      window.location.href = `http://${subdomain}.workadventure.localhost`;
    } catch (err) {
      alert(err.message);
      loading = false;
      step = 1;
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 p-4 flex items-center justify-center">
  <div class="max-w-2xl w-full">
    {#if step === 1}
      <!-- ETAPA 1: Dados Pessoais -->
      <div class="bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 border border-cyan-500/20">
        <h1 class="text-3xl font-bold text-white mb-6">Criar Conta</h1>

        <form on:submit|preventDefault={handlePersonalDataSubmit}>
          <!-- Nome Completo -->
          <div class="form-group mb-4">
            <label class="text-white font-medium mb-2 block">Nome Completo *</label>
            <input
              bind:value={name}
              type="text"
              placeholder="João Silva Santos"
              required
              class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
            />
          </div>

          <!-- Nickname -->
          <div class="form-group mb-4">
            <label class="text-white font-medium mb-2 block">Nickname no Mundo Virtual *</label>
            <div class="relative">
              <span class="absolute left-4 top-3 text-cyan-400 font-bold">@</span>
              <input
                bind:value={nickname}
                type="text"
                placeholder="joaosilva"
                pattern="[a-zA-Z0-9_-]{3,20}"
                required
                on:blur={checkNickname}
                class="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
              {#if nicknameAvailable === true}
                <span class="absolute right-4 top-3 text-green-400">✓</span>
              {:else if nicknameAvailable === false}
                <span class="absolute right-4 top-3 text-red-400">✗</span>
              {/if}
            </div>
            <p class="text-slate-400 text-sm mt-1">Como você aparecerá para outros usuários</p>
          </div>

          <!-- Email -->
          <div class="form-group mb-4">
            <label class="text-white font-medium mb-2 block">Email *</label>
            <input
              bind:value={email}
              type="email"
              placeholder="[email protected]"
              required
              class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
            />
          </div>

          <!-- Senha -->
          <div class="form-group mb-4">
            <label class="text-white font-medium mb-2 block">Senha *</label>
            <input
              bind:value={password}
              type="password"
              placeholder="Mínimo 8 caracteres"
              required
              minlength="8"
              class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
            />
            <PasswordStrength value={password} />
          </div>

          <!-- Tipo de Conta -->
          <div class="form-group mb-4">
            <label class="text-white font-medium mb-2 block">Tipo de Conta *</label>
            <div class="grid grid-cols-2 gap-4">
              <label class="cursor-pointer">
                <input
                  type="radio"
                  bind:group={accountType}
                  value="personal"
                  class="hidden"
                />
                <div class="p-4 border-2 rounded-xl text-center transition-all {accountType === 'personal' ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 hover:border-slate-600'}">
                  <div class="text-4xl mb-2">👤</div>
                  <div class="text-white font-bold">Pessoa Física</div>
                  <div class="text-slate-400 text-sm">CPF</div>
                </div>
              </label>

              <label class="cursor-pointer">
                <input
                  type="radio"
                  bind:group={accountType}
                  value="business"
                  class="hidden"
                />
                <div class="p-4 border-2 rounded-xl text-center transition-all {accountType === 'business' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 hover:border-slate-600'}">
                  <div class="text-4xl mb-2">🏢</div>
                  <div class="text-white font-bold">Pessoa Jurídica</div>
                  <div class="text-slate-400 text-sm">CNPJ</div>
                </div>
              </label>
            </div>
          </div>

          <!-- CPF/CNPJ -->
          <div class="form-group mb-4">
            <label class="text-white font-medium mb-2 block">
              {accountType === 'personal' ? 'CPF' : 'CNPJ'} *
            </label>
            <input
              bind:value={documentNumber}
              type="text"
              placeholder={accountType === 'personal' ? '000.000.000-00' : '00.000.000/0000-00'}
              maxlength={accountType === 'personal' ? 14 : 18}
              required
              on:input={formatDocument}
              class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
            />
          </div>

          <!-- Telefone -->
          <div class="form-group mb-4">
            <label class="text-white font-medium mb-2 block">Telefone (Opcional)</label>
            <input
              bind:value={phone}
              type="tel"
              placeholder="(11) 99999-9999"
              class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
            />
          </div>

          <!-- Se Business: Empresa -->
          {#if accountType === 'business'}
            <div class="form-group mb-4">
              <label class="text-white font-medium mb-2 block">Razão Social *</label>
              <input
                bind:value={companyName}
                type="text"
                placeholder="Empresa LTDA"
                required={accountType === 'business'}
                class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div class="form-group mb-4">
              <label class="text-white font-medium mb-2 block">Nome Fantasia (Opcional)</label>
              <input
                bind:value={tradingName}
                type="text"
                placeholder="Nome da Marca"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>
          {/if}

          <!-- Termos -->
          <div class="form-group mb-6">
            <label class="flex items-start gap-3 cursor-pointer">
              <input
                bind:checked={acceptedTerms}
                type="checkbox"
                required
                class="mt-1"
              />
              <span class="text-slate-300 text-sm">
                Eu li e aceito os <a href="/terms" class="text-cyan-400 hover:underline">Termos de Uso</a>
                e a <a href="/privacy" class="text-cyan-400 hover:underline">Política de Privacidade</a>
              </span>
            </label>
          </div>

          <button
            type="submit"
            class="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all"
            disabled={!acceptedTerms}
          >
            Próximo: Configurar Workspace →
          </button>
        </form>
      </div>

    {:else if step === 2}
      <!-- ETAPA 2: Configurar Workspace -->
      <div class="bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 border border-cyan-500/20">
        <h1 class="text-3xl font-bold text-white mb-6">Configure seu Workspace</h1>

        <form on:submit|preventDefault={handleWorkspaceSubmit}>
          <div class="form-group mb-4">
            <label class="text-white font-medium mb-2 block">Nome do Workspace *</label>
            <input
              bind:value={displayName}
              type="text"
              placeholder="Minha Empresa"
              required
              class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
            />
          </div>

          <div class="form-group mb-6">
            <label class="text-white font-medium mb-2 block">Endereço do Workspace *</label>
            <div class="flex items-center gap-2">
              <input
                bind:value={subdomain}
                type="text"
                placeholder="minha-empresa"
                pattern="[a-z0-9-]{3,50}"
                required
                class="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
              <span class="text-slate-400">.workadventure.io</span>
            </div>
            <p class="text-slate-400 text-sm mt-1">Apenas letras minúsculas, números e hífen</p>
          </div>

          <button
            type="submit"
            class="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all"
          >
            Próximo: Escolher Mapa →
          </button>
        </form>
      </div>

    {:else if step === 3}
      <!-- ETAPA 3: Escolher Template -->
      <div class="bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 border border-cyan-500/20">
        <h1 class="text-3xl font-bold text-white mb-6">Escolha um Mapa Inicial</h1>

        <div class="grid grid-cols-2 gap-4 mb-6">
          {#each templates as template}
            <button
              class="p-4 border-2 rounded-xl transition-all {selectedTemplate?.id === template.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 hover:border-slate-600'}"
              on:click={() => selectedTemplate = template}
            >
              <img src={template.thumbnailUrl} alt={template.name} class="rounded-lg mb-3" />
              <h3 class="text-white font-bold">{template.name}</h3>
              <p class="text-slate-400 text-sm">{template.description}</p>
            </button>
          {/each}
        </div>

        <button
          on:click={handleFinalSubmit}
          disabled={!selectedTemplate}
          class="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50"
        >
          Criar Workspace 🚀
        </button>
      </div>

    {:else}
      <!-- ETAPA 4: Loading -->
      <div class="bg-slate-900/90 backdrop-blur-xl rounded-3xl p-12 border border-cyan-500/20 text-center">
        <div class="animate-spin w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h2 class="text-2xl font-bold text-white mb-2">Criando seu workspace...</h2>
        <p class="text-slate-400">Aguarde alguns segundos</p>
      </div>
    {/if}
  </div>
</div>
```

**Checklist Sprint 2**:
- [ ] ✅ Atualizar AuthService com validação de CPF/CNPJ
- [ ] ✅ Endpoint `/auth/check-nickname` para verificar disponibilidade
- [ ] ✅ Criar máscaras de CPF/CNPJ no frontend (`utils/masks.js`)
- [ ] ✅ Componente `PasswordStrength.svelte`
- [ ] ✅ Signup em 3 etapas (dados pessoais → workspace → template)
- [ ] [ ] Implementar WorkspacesService (create, findBySubdomain)
- [ ] [ ] Implementar WorkspacesController
- [ ] [ ] DTOs de validação (CreateWorkspaceDto)
- [ ] [ ] Template gallery com preview
- [ ] [ ] Fluxo completo: signup → create workspace → redirect

---

### **Sprint 3: Tenant Middleware & Dynamic Routing (Semana 3)**

#### 3.1 Tenant Context Middleware

**Arquivo**: `backend/src/common/middleware/tenant.middleware.ts`

```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private workspacesService: WorkspacesService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Opção 1: Extrair de subdomain
    const host = req.headers.host; // "acme.workadventure.localhost"
    const subdomain = host.split('.')[0];

    // Opção 2: Header customizado (para testes)
    const workspaceHeader = req.headers['x-workspace-id'];

    if (subdomain && subdomain !== 'www' && subdomain !== 'workadventure') {
      try {
        const workspace = await this.workspacesService.findBySubdomain(subdomain);
        req['workspace'] = workspace; // Injetar no request
        req['workspaceId'] = workspace.id;
      } catch (error) {
        return res.status(404).json({ error: 'Workspace not found' });
      }
    }

    next();
  }
}
```

**Aplicar globalmente**:

```typescript
// app.module.ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*'); // Todas as rotas
  }
}
```

#### 3.2 Workspace Guard

**Arquivo**: `backend/src/common/guards/workspace.guard.ts`

```typescript
@Injectable()
export class WorkspaceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (!request.workspace) {
      throw new UnauthorizedException('No workspace context');
    }

    return true;
  }
}
```

**Uso**: Aplicar em rotas que precisam de workspace context

```typescript
@Get('maps')
@UseGuards(WorkspaceGuard)
async getMaps(@Workspace() workspace: WorkspaceEntity) {
  return this.mapsService.findByWorkspace(workspace.id);
}
```

#### 3.3 Configurar Traefik para Wildcard Subdomains

**Modificação**: `docker-compose.yaml`

```yaml
play:
  labels:
    # Aceitar qualquer subdomain *.workadventure.localhost
    - "traefik.http.routers.play.rule=HostRegexp(`{subdomain:[a-z0-9-]+}.workadventure.localhost`)"
    - "traefik.http.routers.play.priority=10"
```

**Adicionar ao /etc/hosts** (para testes locais):

```bash
127.0.0.1 acme.workadventure.localhost
127.0.0.1 startup.workadventure.localhost
127.0.0.1 demo.workadventure.localhost
```

**Ou usar DNS wildcard** (para produção):
- `*.workadventure.io` → A record para IP do servidor

#### 3.4 Dynamic START_ROOM_URL

**Modificação**: `backend/src/oidc/oidc.service.ts` (ou onde START_ROOM_URL é usado)

```typescript
async getStartRoomUrl(workspaceId: string): Promise<string> {
  // 1. Buscar workspace
  const workspace = await this.workspacesService.findOne(workspaceId);

  // 2. Pegar mapa padrão
  const defaultMap = await this.mapsService.findOne(workspace.settings.defaultMapId);

  // 3. Retornar URL do mapa
  return `/_/global/${workspace.subdomain}.workadventure.localhost/${defaultMap.filePath}`;
}
```

**Checklist Sprint 3**:
- [ ] Criar TenantMiddleware
- [ ] Criar WorkspaceGuard
- [ ] Configurar Traefik wildcard
- [ ] Testar: 2 workspaces em subdomains diferentes
- [ ] Dynamic START_ROOM_URL baseado em workspace

---

### **Sprint 4: Map Management (Semana 4)**

#### 4.1 Maps Service

**Arquivo**: `backend/src/maps/maps.service.ts`

```typescript
@Injectable()
export class MapsService {
  async cloneFromTemplate(workspaceId: string, templateId: string): Promise<MapEntity> {
    // 1. Buscar template
    const template = await this.templateRepo.findOne({ where: { id: templateId } });

    // 2. Ler arquivo JSON do template
    const templateJson = await fs.readFile(template.templateFilePath, 'utf-8');

    // 3. Criar novo arquivo para o workspace
    const mapId = uuid();
    const mapPath = `workspaces/${workspaceId}/maps/${mapId}.json`;
    await this.storageService.saveFile(mapPath, templateJson);

    // 4. Criar registro no DB
    const map = this.mapRepo.create({
      name: template.name,
      workspaceId,
      templateId,
      filePath: mapPath,
      thumbnailUrl: template.thumbnailUrl,
      isDefault: true, // Primeiro mapa é default
      metadata: template.metadata,
    });

    await this.mapRepo.save(map);

    // 5. Atualizar workspace.settings.defaultMapId
    await this.workspacesService.setDefaultMap(workspaceId, map.id);

    return map;
  }

  async findByWorkspace(workspaceId: string): Promise<MapEntity[]> {
    return this.mapRepo.find({ where: { workspaceId } });
  }

  async delete(mapId: string, workspaceId: string) {
    const map = await this.mapRepo.findOne({ where: { id: mapId, workspaceId } });
    if (!map) throw new NotFoundException();

    // Deletar arquivo
    await this.storageService.deleteFile(map.filePath);

    // Deletar registro
    await this.mapRepo.remove(map);
  }
}
```

#### 4.2 Storage Service (MinIO ou File System)

**Arquivo**: `backend/src/storage/storage.service.ts`

**Opção 1: File System (MVP simples)**

```typescript
@Injectable()
export class StorageService {
  private basePath = './storage';

  async saveFile(relativePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.basePath, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  async readFile(relativePath: string): Promise<string> {
    const fullPath = path.join(this.basePath, relativePath);
    return fs.readFile(fullPath, 'utf-8');
  }

  async deleteFile(relativePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, relativePath);
    await fs.unlink(fullPath);
  }
}
```

**Opção 2: MinIO (para produção)**

```typescript
// Usar @nestjs/minio
async saveFile(relativePath: string, content: string): Promise<void> {
  await this.minioClient.putObject('workadventure-maps', relativePath, Buffer.from(content));
}
```

#### 4.3 Map Templates Seeds

**Arquivo**: `backend/src/database/seeds/map-templates.seed.ts`

```typescript
export const MAP_TEMPLATES = [
  {
    slug: 'welcome-lobby',
    name: 'Welcome Lobby',
    description: 'Small lobby perfect for welcoming visitors. Ideal for teams up to 10 people.',
    category: 'social',
    thumbnailUrl: '/templates/thumbnails/lobby.png',
    templateFilePath: 'templates/welcome-lobby.json',
    metadata: {
      maxPlayers: 10,
      size: { width: 20, height: 15 },
      features: ['chat', 'jitsi'],
    },
  },
  {
    slug: 'virtual-cafe',
    name: 'Virtual Café',
    description: 'Cozy café environment for casual meetings and networking.',
    category: 'social',
    thumbnailUrl: '/templates/thumbnails/cafe.png',
    templateFilePath: 'templates/virtual-cafe.json',
    metadata: {
      maxPlayers: 15,
      size: { width: 25, height: 20 },
      features: ['chat', 'jitsi', 'youtube'],
    },
  },
  {
    slug: 'office-space',
    name: 'Office Space',
    description: 'Complete office layout with meeting rooms, desks, and collaboration areas.',
    category: 'office',
    thumbnailUrl: '/templates/thumbnails/office.png',
    templateFilePath: 'templates/office-space.json',
    metadata: {
      maxPlayers: 50,
      size: { width: 50, height: 40 },
      features: ['chat', 'jitsi', 'screenshare', 'youtube'],
    },
  },
];

async function seedTemplates() {
  for (const tmpl of MAP_TEMPLATES) {
    await mapTemplateRepo.save(tmpl);
  }
}
```

#### 4.4 Frontend - Admin Maps Page

**Arquivo**: `frontend/src/routes/admin/Maps.svelte`

```svelte
<script>
  let maps = [];
  let templates = [];
  let showImportModal = false;

  async function loadMaps() {
    const res = await adminAPI.getMaps();
    maps = res.data;
  }

  async function importTemplate(templateId) {
    await adminAPI.importMapTemplate(templateId);
    toast.success('Mapa importado com sucesso!');
    loadMaps();
    showImportModal = false;
  }

  async function deleteMap(mapId) {
    if (confirm('Deletar este mapa?')) {
      await adminAPI.deleteMap(mapId);
      toast.success('Mapa deletado');
      loadMaps();
    }
  }

  onMount(loadMaps);
</script>

<div class="p-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold text-white">Mapas do Workspace</h1>
    <button on:click={() => showImportModal = true} class="btn-primary">
      + Importar Template
    </button>
  </div>

  <div class="grid grid-cols-3 gap-6">
    {#each maps as map}
      <div class="bg-slate-800 rounded-xl p-4">
        <img src={map.thumbnailUrl} class="rounded-lg mb-3" alt={map.name} />
        <h3 class="text-white font-bold">{map.name}</h3>
        <p class="text-slate-400 text-sm">{map.description || 'Sem descrição'}</p>

        {#if map.isDefault}
          <span class="badge badge-primary">Mapa Padrão</span>
        {/if}

        <div class="flex gap-2 mt-4">
          <button class="btn-sm">Editar</button>
          <button class="btn-sm btn-danger" on:click={() => deleteMap(map.id)}>
            Deletar
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>

{#if showImportModal}
  <Modal on:close={() => showImportModal = false}>
    <h2>Importar Template</h2>
    <div class="grid grid-cols-2 gap-4">
      {#each templates as template}
        <button
          class="template-card"
          on:click={() => importTemplate(template.id)}
        >
          <img src={template.thumbnailUrl} alt={template.name} />
          <h3>{template.name}</h3>
        </button>
      {/each}
    </div>
  </Modal>
{/if}
```

**Checklist Sprint 4**:
- [ ] Implementar MapsService (clone, find, delete)
- [ ] Implementar StorageService (file system ou MinIO)
- [ ] Seeds de 3 map templates
- [ ] Copiar 3 arquivos .json reais para `/templates`
- [ ] Admin page `/admin/maps` (listar, importar, deletar)
- [ ] Testar: importar template → ver mapa no workspace

---

### **Sprint 5: Admin Panel - Workspace Settings (Semana 5)**

#### 5.1 Workspace Settings Page

**Arquivo**: `frontend/src/routes/admin/WorkspaceSettings.svelte`

```svelte
<script>
  let workspace = {};
  let loading = false;

  async function loadWorkspace() {
    const res = await adminAPI.getCurrentWorkspace();
    workspace = res;
  }

  async function saveSettings() {
    loading = true;
    await adminAPI.updateWorkspace(workspace.id, {
      displayName: workspace.displayName,
      settings: workspace.settings,
    });
    toast.success('Configurações salvas!');
    loading = false;
  }

  onMount(loadWorkspace);
</script>

<div class="p-8">
  <h1 class="text-3xl font-bold text-white mb-6">Configurações do Workspace</h1>

  <div class="bg-slate-800 rounded-xl p-6 mb-6">
    <h2 class="text-xl font-bold text-white mb-4">Informações Gerais</h2>

    <div class="form-group">
      <label>Nome do Workspace</label>
      <input
        bind:value={workspace.displayName}
        class="input"
        placeholder="ACME Corporation"
      />
    </div>

    <div class="form-group">
      <label>Subdomain</label>
      <input
        value={workspace.subdomain}
        disabled
        class="input bg-slate-700"
      />
      <p class="text-sm text-slate-400 mt-1">
        URL: https://{workspace.subdomain}.workadventure.localhost
      </p>
    </div>
  </div>

  <div class="bg-slate-800 rounded-xl p-6 mb-6">
    <h2 class="text-xl font-bold text-white mb-4">Personalização</h2>

    <div class="form-group">
      <label>Cor Principal</label>
      <input
        type="color"
        bind:value={workspace.settings.brandColor}
        class="input w-24 h-12"
      />
    </div>

    <div class="form-group">
      <label>Logo URL</label>
      <input
        bind:value={workspace.settings.logoUrl}
        class="input"
        placeholder="https://example.com/logo.png"
      />
    </div>
  </div>

  <button on:click={saveSettings} disabled={loading} class="btn-primary">
    {loading ? 'Salvando...' : 'Salvar Configurações'}
  </button>
</div>
```

#### 5.2 Members Management

**Arquivo**: `frontend/src/routes/admin/WorkspaceMembers.svelte`

```svelte
<script>
  let members = [];
  let inviteEmail = '';
  let inviteRole = 'member';

  async function loadMembers() {
    const res = await adminAPI.getWorkspaceMembers();
    members = res.data;
  }

  async function inviteMember() {
    await adminAPI.inviteMember({ email: inviteEmail, role: inviteRole });
    toast.success(`Convite enviado para ${inviteEmail}`);
    inviteEmail = '';
    loadMembers();
  }

  async function removeMember(memberId) {
    if (confirm('Remover este membro?')) {
      await adminAPI.removeMember(memberId);
      toast.success('Membro removido');
      loadMembers();
    }
  }

  onMount(loadMembers);
</script>

<div class="p-8">
  <h1 class="text-3xl font-bold text-white mb-6">Membros do Workspace</h1>

  <!-- Form de convite -->
  <div class="bg-slate-800 rounded-xl p-6 mb-6">
    <h2 class="text-lg font-bold text-white mb-4">Convidar Novo Membro</h2>
    <div class="flex gap-4">
      <input
        bind:value={inviteEmail}
        type="email"
        placeholder="email@example.com"
        class="input flex-1"
      />
      <select bind:value={inviteRole} class="input">
        <option value="member">Membro</option>
        <option value="admin">Admin</option>
      </select>
      <button on:click={inviteMember} class="btn-primary">
        Enviar Convite
      </button>
    </div>
  </div>

  <!-- Tabela de membros -->
  <div class="bg-slate-800 rounded-xl overflow-hidden">
    <table class="w-full">
      <thead class="bg-slate-900">
        <tr>
          <th class="px-6 py-3 text-left">Nome</th>
          <th class="px-6 py-3 text-left">Email</th>
          <th class="px-6 py-3 text-left">Role</th>
          <th class="px-6 py-3 text-left">Entrou em</th>
          <th class="px-6 py-3 text-right">Ações</th>
        </tr>
      </thead>
      <tbody>
        {#each members as member}
          <tr class="border-t border-slate-700">
            <td class="px-6 py-4">{member.user.name}</td>
            <td class="px-6 py-4">{member.user.email}</td>
            <td class="px-6 py-4">
              <span class="badge badge-{member.role === 'owner' ? 'primary' : 'default'}">
                {member.role}
              </span>
            </td>
            <td class="px-6 py-4">{formatDate(member.joinedAt)}</td>
            <td class="px-6 py-4 text-right">
              {#if member.role !== 'owner'}
                <button on:click={() => removeMember(member.id)} class="btn-sm btn-danger">
                  Remover
                </button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
```

**Checklist Sprint 5**:
- [ ] Implementar GET/PATCH `/workspaces/:id` (settings)
- [ ] Implementar GET `/workspaces/:id/members`
- [ ] Implementar POST `/workspaces/:id/invite`
- [ ] Frontend: WorkspaceSettings page (nome, logo, cores)
- [ ] Frontend: WorkspaceMembers page (listar, convidar, remover)
- [ ] Email de convite (template básico)

---

## 🎯 Critérios de Sucesso do MVP

### **Funcional**
- [ ] ✅ Signup self-service funciona
- [ ] ✅ Criar workspace com subdomain único
- [ ] ✅ Escolher template de mapa durante signup
- [ ] ✅ Acessar `{subdomain}.workadventure.localhost` redireciona para mapa correto
- [ ] ✅ Múltiplos workspaces coexistem sem interferência
- [ ] ✅ Admin pode convidar membros para seu workspace
- [ ] ✅ Admin pode gerenciar mapas (importar, deletar)
- [ ] ✅ Configurações de workspace (nome, logo, cores) funcionam

### **Técnico**
- [ ] ✅ Isolamento de dados: users de workspace A não veem dados de workspace B
- [ ] ✅ Traefik roteia subdomains corretamente
- [ ] ✅ TenantMiddleware identifica workspace em todas as requests
- [ ] ✅ Storage de mapas isolado por workspace
- [ ] ✅ Seeds de 3 map templates funcionando

---

## 🚀 Fase 2 - Post-MVP (4-6 semanas depois)

### **Funcionalidades Adicionais**

#### 6. Map Editor Básico
- Interface web para editar JSON do mapa
- Mudar cores, textos, logo
- Adicionar/remover zonas Jitsi
- Preview em tempo real

#### 7. Analytics & Usage Dashboard
- Usuários ativos por dia/semana
- Picos de uso
- Tempo médio de sessão
- Mapa mais acessado

#### 8. Custom Domains
- Permitir `meet.acme.com` ao invés de `acme.workadventure.io`
- Validação DNS (TXT record)
- Certificado SSL automático (Let's Encrypt)

#### 9. Workspace Themes
- Temas pré-configurados (dark, light, colorful)
- Aplicar cores em toda a interface
- Custom CSS (para enterprise)

---

## 💰 Fase 3 - Monetização (2-3 meses depois)

### **Billing & Plans**

Ver arquivo separado: `SAAS_BILLING.md` (criar depois)

**Resumo**:
- Integração Stripe
- Planos: Free (trial 14d), Starter ($29), Pro ($99), Enterprise (custom)
- Limites enforçados (maxUsers, storage, maps)
- Upgrade/downgrade flow
- Webhooks de pagamento

---

## 📊 Métricas de Sucesso

### **Semana 1 pós-MVP**
- 5+ workspaces criados (internos para teste)
- 0 bugs críticos

### **Mês 1**
- 20+ workspaces criados
- 100+ usuários únicos
- Uptime > 99%

### **Mês 3**
- 100+ workspaces
- 10+ conversões para plano pago (quando implementar billing)
- NPS > 40

---

## 🛠️ Stack Técnica Final

### **Backend**
- NestJS 10
- TypeORM 0.3
- PostgreSQL 15
- Redis (cache de workspace config)
- MinIO ou S3 (storage de mapas - opcional no MVP)
- Nodemailer (emails)

### **Frontend**
- Svelte 4
- Tailwind CSS 3
- Svelte Spa Router
- Chart.js (analytics - fase 2)

### **Infraestrutura**
- Docker & Docker Compose
- Traefik (reverse proxy com wildcard SSL)
- PostgreSQL (1 database, schema per tenant)
- Redis (optional para MVP)

---

## 📝 Notas Importantes

1. **MVP foca em multi-tenancy funcional**, sem billing
2. **Storage de mapas** pode ser file system no MVP, migrar para S3 depois
3. **Templates** devem ser mapas Tiled reais, testados e funcionais
4. **Email** pode ser console.log no MVP, adicionar SMTP depois
5. **Custom domains** são Fase 2, MVP usa apenas subdomains

---

**Próximo arquivo**: `SAAS_USE_CASES.md` com fluxos detalhados ponta a ponta
