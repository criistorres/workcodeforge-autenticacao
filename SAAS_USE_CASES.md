# 🎯 Casos de Uso - WorkAdventure SaaS

Documentação detalhada dos fluxos de usuário do sistema multi-tenant, do signup até o uso diário.

---

## 📋 Índice

1. [Caso de Uso 1: Signup & Criação de Workspace](#caso-1)
2. [Caso de Uso 2: Primeiro Acesso ao Workspace](#caso-2)
3. [Caso de Uso 3: Convidar Membros da Equipe](#caso-3)
4. [Caso de Uso 4: Gerenciar Mapas](#caso-4)
5. [Caso de Uso 5: Personalizar Workspace](#caso-5)
6. [Caso de Uso 6: Acesso de Membro Convidado](#caso-6)
7. [Caso de Uso 7: Uso Diário - Entrar no Mundo Virtual](#caso-7)
8. [Caso de Uso 8: Admin Gerenciando Usuários](#caso-8)

---

<a name="caso-1"></a>
## 🚀 Caso de Uso 1: Signup & Criação de Workspace

### **Persona**: Maria, Fundadora de Startup

**Contexto**: Maria quer criar um espaço virtual para sua equipe de 8 pessoas se reunir diariamente.

### **Fluxo Passo a Passo**

#### **1. Descoberta**
Maria acessa `https://workadventure.io`

**Landing Page mostra**:
- Hero section: "Crie seu mundo virtual em minutos"
- Demonstração em vídeo de um workspace funcionando
- Botão CTA: "Começar Gratuitamente"

#### **2. Clica em "Começar Gratuitamente"**
Redireciona para: `https://workadventure.io/signup`

**Página de Signup - Passo 1/4: Dados Pessoais**

```
┌────────────────────────────────────────────────┐
│  Crie sua Conta                                │
│                                                │
│  Nome Completo: [Maria Silva Santos.........]  │
│                                                │
│  Nickname:  @[mariasilva...................]   │
│  💡 Como você aparecerá no mundo virtual       │
│              ✓ Disponível                      │
│                                                │
│  Email:     [maria@startup.com............]   │
│  Senha:     [••••••••••••••••••••••••••••]     │
│  [████████░░] Senha: Forte                     │
│                                                │
│  Tipo de Conta:                                │
│  ┌───────────┐  ┌───────────┐                 │
│  │    👤     │  │    🏢     │                 │
│  │  Pessoa   │  │  Pessoa   │                 │
│  │  Física   │  │ Jurídica  │                 │
│  │    ✓      │  │           │                 │
│  └───────────┘  └───────────┘                 │
│                                                │
│  CPF: [000.000.000-00.................]        │
│                                                │
│  Telefone: [(11) 99999-9999..............] ⚪  │
│                                                │
│  ☑ Aceito os Termos de Uso e Privacidade      │
│                                                │
│  [Próximo: Configurar Workspace →]            │
└────────────────────────────────────────────────┘
```

Maria preenche:
- Nome: "Maria Silva Santos"
- Nickname: "mariasilva" (sistema verifica disponibilidade em tempo real)
- Email: "maria@startup.com"
- Senha: forte com 10+ caracteres
- Tipo: Pessoa Física
- CPF: "123.456.789-00" (validado com algoritmo)
- Telefone: (opcional) deixa em branco

Maria marca a caixa de termos e clica em "Próximo".

#### **3. Passo 2/4: Informações do Workspace**

```
┌────────────────────────────────────────────────┐
│  Configure seu Workspace                       │
│                                                │
│  Nome do Workspace:                            │
│  [Startup XYZ........................]         │
│                                                │
│  Escolha seu endereço:                         │
│  [startup-xyz] .workadventure.io               │
│  ✓ Disponível                                  │
│                                                │
│  💡 Você poderá acessar em:                    │
│  https://startup-xyz.workadventure.io          │
│                                                │
│  [← Voltar]  [Próximo: Escolher Mapa →]       │
└────────────────────────────────────────────────┘
```

**Validação em Tempo Real**:
- Ao digitar "startup-xyz", API verifica: `GET /workspaces/check-subdomain?subdomain=startup-xyz`
- Se disponível: ✅ ícone verde
- Se ocupado: ❌ "Este endereço já está em uso. Tente: startup-xyz-team"

Maria escolhe "startup-xyz" (disponível) e clica em "Próximo".

#### **4. Passo 3/4: Escolher Template de Mapa**

```
┌────────────────────────────────────────────────────────────────┐
│  Escolha um Mapa Inicial                                       │
│                                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│  │[Lobby]   │  │[Café]    │  │[Escritór]│                    │
│  │  🏢      │  │  ☕      │  │  💼      │                    │
│  │          │  │          │  │          │                    │
│  │✓ Ideal   │  │ Casual   │  │ Completo │                    │
│  │  p/ 10   │  │  p/ 15   │  │  p/ 50   │                    │
│  └──────────┘  └──────────┘  └──────────┘                    │
│      [Selecionar]   ← Selecionado                             │
│                                                                │
│  Preview:                                                      │
│  ┌──────────────────────────────────────┐                    │
│  │ [Miniatura do mapa Café]             │                    │
│  │                                       │                    │
│  │ "Espaço aconchegante para reuniões   │                    │
│  │  informais e networking. Capacidade  │                    │
│  │  para 15 pessoas simultâneas."       │                    │
│  └──────────────────────────────────────┘                    │
│                                                                │
│  [← Voltar]  [Criar Workspace 🚀]                             │
└────────────────────────────────────────────────────────────────┘
```

Maria escolhe **"Virtual Café"** e clica em "Criar Workspace".

#### **5. Criação em Progresso**

Tela de loading com steps:

```
┌────────────────────────────────────────┐
│  ✓ Criando sua conta                   │
│  ✓ Configurando workspace              │
│  ⏳ Preparando seu mapa virtual...      │
│                                        │
│  [Barra de progresso animada]         │
└────────────────────────────────────────┘
```

**Backend executa**:
1. `POST /auth/register` → Cria user com dados completos:
   ```json
   {
     "name": "Maria Silva Santos",
     "nickname": "mariasilva",
     "email": "maria@startup.com",
     "password": "SenhaForte123!",
     "accountType": "personal",
     "documentType": "cpf",
     "documentNumber": "12345678900", // Sem máscara
     "phone": null,
     "acceptedTerms": true,
     "acceptedPrivacy": true
   }
   ```

2. **AuthService.register()** valida:
   - CPF válido (algoritmo)
   - CPF não existe no DB
   - Nickname único
   - Email único
   - Senha forte (8+ chars, 1 maiúscula, 1 número)
   - Gera `username` do email: "maria"
   - Hash da senha com bcrypt
   - Salva no DB

3. `POST /workspaces` → Cria workspace:
   ```json
   {
     "subdomain": "startup-xyz",
     "displayName": "Startup XYZ",
     "ownerId": "uuid-maria",
     "templateId": "uuid-cafe-template"
   }
   ```
4. **WorkspacesService.create()**:
   - Valida subdomain único
   - Cria registro `Workspace`
   - Cria `WorkspaceMember` (Maria como `owner`)
   - Chama `MapsService.cloneFromTemplate()`:
     - Lê `/templates/virtual-cafe.json`
     - Copia para `/storage/workspaces/{workspace-id}/maps/{map-id}.json`
     - Cria registro `Map` no DB
     - Define como `isDefault: true`
   - Atualiza `workspace.settings.defaultMapId`
4. Email de boas-vindas enviado para Maria

#### **6. Redirecionamento**

```
window.location.href = 'https://startup-xyz.workadventure.localhost';
```

Maria é redirecionada para seu workspace.

---

<a name="caso-2"></a>
## 🎮 Caso de Uso 2: Primeiro Acesso ao Workspace

### **Continuação do Caso 1**

#### **1. Landing no Workspace**

Maria acessa: `https://startup-xyz.workadventure.localhost`

**Traefik recebe request**:
- Host header: `startup-xyz.workadventure.localhost`
- Roteia para `play` service

**TenantMiddleware processa**:
1. Extrai subdomain: `startup-xyz`
2. Query DB: `SELECT * FROM workspaces WHERE subdomain = 'startup-xyz'`
3. Injeta `workspace` no request context
4. Valida `workspace.isActive = true`

**Play service**:
- Detecta usuário já autenticado (cookie de sessão do signup)
- Busca `workspace.settings.defaultMapId`
- Monta URL: `/_/global/startup-xyz.workadventure.localhost/workspaces/{id}/maps/{map-id}.json`
- Redireciona para o mapa

#### **2. Carregamento do Mapa**

**Frontend do WorkAdventure** (Phaser.js):
- Carrega `virtual-cafe.json` do storage
- Renderiza tiles, objetos, colisões
- Posiciona avatar de Maria na spawn zone
- Carrega outros players (nenhum ainda)

**Tela de Maria**:
```
┌────────────────────────────────────────────────────────┐
│  [🎮 Avatar de Maria aparece no café virtual]          │
│                                                        │
│  💬 Chat lateral:                                      │
│     "Bem-vinda ao Startup XYZ! 🎉"                     │
│                                                        │
│  👥 Players online: 1/15                               │
│                                                        │
│  [Controles: WASD para mover]                         │
└────────────────────────────────────────────────────────┘
```

#### **3. Exploração Inicial**

Maria anda pelo mapa e encontra:
- ☕ **Zona de Café**: Área aberta para conversar
- 🎥 **Sala Jitsi**: Zona destacada com texto "Clique para reunião"
- 📺 **Tela de YouTube**: Área para assistir vídeos juntos
- 🚪 **Portal de Saída**: Link para voltar

Maria entra na **Sala Jitsi**.

**Interação**:
- Modal aparece: "Iniciar reunião? 🎥"
- Maria clica "Sim"
- Jitsi abre em iframe
- Camera e microfone ativam (com permissão)

Como está sozinha, Maria desliga a reunião e decide convidar sua equipe.

#### **4. Acessa Admin Panel**

Maria clica no botão flutuante "⚙️ Admin" (visível apenas para owners/admins).

Redireciona para: `https://startup-xyz.workadventure.localhost/admin`

**Dashboard inicial**:
```
┌────────────────────────────────────────────────────┐
│  📊 Dashboard - Startup XYZ                        │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ 1        │  │ 1        │  │ 0        │        │
│  │ Users    │  │ Maps     │  │ Online   │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                    │
│  🗺️ Mapa Padrão: Virtual Café                     │
│  📅 Criado em: Hoje                                │
│                                                    │
│  Menu:                                             │
│  • Dashboard                                       │
│  • 👥 Membros  ← [Clica aqui]                      │
│  • 🗺️ Mapas                                        │
│  • ⚙️ Configurações                                │
└────────────────────────────────────────────────────┘
```

---

<a name="caso-3"></a>
## 👥 Caso de Uso 3: Convidar Membros da Equipe

### **Continuação do Caso 2**

#### **1. Página de Membros**

Maria acessa `/admin/members`

```
┌────────────────────────────────────────────────────────────┐
│  👥 Membros do Workspace                                   │
│                                                            │
│  ┌───────────────────────────────────────────────────┐    │
│  │ Convidar Novo Membro                              │    │
│  │                                                   │    │
│  │ Email: [joao@startup.com............]            │    │
│  │ Role:  [Membro ▼]                                │    │
│  │                                                   │    │
│  │ [Enviar Convite]                                 │    │
│  └───────────────────────────────────────────────────┘    │
│                                                            │
│  Membros Atuais (1):                                      │
│  ┌─────────────────────────────────────────────────┐     │
│  │ Nome         Email              Role      Ações │     │
│  ├─────────────────────────────────────────────────┤     │
│  │ Maria Silva  maria@startup.com  Owner     -     │     │
│  └─────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────┘
```

#### **2. Convite Individual**

Maria convida 3 pessoas:
1. `joao@startup.com` (Membro)
2. `ana@startup.com` (Admin)
3. `pedro@startup.com` (Membro)

Para cada convite:

**Frontend** → `POST /workspaces/{workspace-id}/invite`
```json
{
  "email": "joao@startup.com",
  "role": "member"
}
```

**Backend** (`WorkspacesService.inviteMember()`):
1. Verifica se user existe no sistema
   - Se sim: Cria `WorkspaceMember` imediatamente
   - Se não: Cria `PendingInvite` (tabela nova)
2. Envia email:

```
De: Startup XYZ <noreply@workadventure.io>
Para: joao@startup.com
Assunto: Maria convidou você para o Startup XYZ

Olá!

Maria Silva convidou você para fazer parte do workspace "Startup XYZ"
no WorkAdventure.

🌐 Acesse agora: https://startup-xyz.workadventure.localhost/join?token=xyz123

Se você ainda não tem uma conta, será redirecionado para criar uma.

---
WorkAdventure
```

#### **3. Lista Atualizada**

Após enviar 3 convites:

```
┌────────────────────────────────────────────────────────────┐
│  Membros Atuais (1) + Convites Pendentes (3):             │
│  ┌─────────────────────────────────────────────────┐      │
│  │ Nome         Email              Role    Status  │      │
│  ├─────────────────────────────────────────────────┤      │
│  │ Maria Silva  maria@startup.com  Owner   ✓ Ativo│      │
│  │ -            joao@startup.com   Member  ⏳ Conv.│      │
│  │ -            ana@startup.com    Admin   ⏳ Conv.│      │
│  │ -            pedro@startup.com  Member  ⏳ Conv.│      │
│  └─────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────┘
```

---

<a name="caso-4"></a>
## 🗺️ Caso de Uso 4: Gerenciar Mapas

### **Persona**: Maria (continuação)

**Contexto**: Maria quer adicionar um segundo mapa para reuniões formais.

#### **1. Acessa Página de Mapas**

Maria clica em "🗺️ Mapas" no menu do admin.

`https://startup-xyz.workadventure.localhost/admin/maps`

```
┌────────────────────────────────────────────────────────────┐
│  🗺️ Mapas do Workspace                  [+ Importar]      │
│                                                            │
│  ┌─────────────────────────────────────────────┐          │
│  │ [Thumbnail do Café]                         │          │
│  │                                             │          │
│  │ Virtual Café                                │          │
│  │ Espaço casual para networking               │          │
│  │                                             │          │
│  │ ⭐ Mapa Padrão                              │          │
│  │ 👥 15 players max                           │          │
│  │                                             │          │
│  │ [Editar] [Deletar]                          │          │
│  └─────────────────────────────────────────────┘          │
└────────────────────────────────────────────────────────────┘
```

#### **2. Importar Novo Template**

Maria clica em **"+ Importar"**.

**Modal de Templates**:

```
┌────────────────────────────────────────────────────────────┐
│  Escolha um Template                              [X]      │
│                                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │[Lobby]   │  │[Café]    │  │[Office]  │                │
│  │  🏢      │  │  ☕      │  │  💼      │                │
│  │          │  │  ✓ Usado │  │          │ ← Seleciona    │
│  │ p/ 10    │  │          │  │ p/ 50    │                │
│  └──────────┘  └──────────┘  └──────────┘                │
│                                                            │
│  Preview: Office Space                                     │
│  ┌──────────────────────────────────────┐                │
│  │ [Thumbnail do escritório]            │                │
│  │                                       │                │
│  │ Layout completo com salas de reunião,│                │
│  │ mesas de trabalho e áreas colabora-  │                │
│  │ tivas. Ideal para até 50 pessoas.   │                │
│  └──────────────────────────────────────┘                │
│                                                            │
│  [Cancelar]  [Importar Template]                          │
└────────────────────────────────────────────────────────────┘
```

Maria clica em **"Importar Template"**.

**Backend executa**:
```javascript
// POST /workspaces/{id}/maps/import
{
  "templateId": "uuid-office-template"
}

// MapsService.cloneFromTemplate()
1. Lê /templates/office-space.json
2. Copia para /workspaces/{workspace-id}/maps/{new-map-id}.json
3. Cria registro Map no DB
4. Retorna sucesso
```

**Toast de sucesso**: "✓ Mapa 'Office Space' importado!"

#### **3. Lista de Mapas Atualizada**

```
┌────────────────────────────────────────────────────────────┐
│  🗺️ Mapas do Workspace (2)              [+ Importar]      │
│                                                            │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │[Café Thumbnail] │  │[Office Thumb]   │                │
│  │                 │  │                 │                │
│  │ Virtual Café    │  │ Office Space    │                │
│  │                 │  │                 │                │
│  │ ⭐ Padrão       │  │                 │                │
│  │ [Editar][Del]   │  │[Editar][Del]    │                │
│  └─────────────────┘  └─────────────────┘                │
└────────────────────────────────────────────────────────────┘
```

#### **4. Mudar Mapa Padrão**

Maria quer que novos visitantes caiam direto no Office.

Clica em **"Editar"** no card "Office Space".

**Modal de Edição**:

```
┌────────────────────────────────────────────────────────────┐
│  Editar Mapa                                      [X]      │
│                                                            │
│  Nome:        [Office Space................]              │
│  Descrição:   [Escritório principal........]              │
│                                                            │
│  ☑ Definir como mapa padrão                               │
│                                                            │
│  [Cancelar]  [Salvar]                                      │
└────────────────────────────────────────────────────────────┘
```

Maria marca **"Definir como mapa padrão"** e salva.

**Backend atualiza**:
```javascript
// PATCH /maps/{map-id}
{
  "isDefault": true
}

// MapsService.update()
1. Desmarcar isDefault de todos os outros mapas do workspace
2. Marcar este como isDefault: true
3. Atualizar workspace.settings.defaultMapId
```

**Agora**: Quando alguém acessar `startup-xyz.workadventure.localhost`, cai no Office Space.

---

<a name="caso-5"></a>
## 🎨 Caso de Uso 5: Personalizar Workspace

### **Persona**: Maria (continuação)

**Contexto**: Maria quer adicionar a logo da startup e mudar as cores.

#### **1. Acessa Configurações**

Maria clica em "⚙️ Configurações" no admin.

`https://startup-xyz.workadventure.localhost/admin/settings`

```
┌────────────────────────────────────────────────────────────┐
│  ⚙️ Configurações do Workspace                             │
│                                                            │
│  ┌───────────────────────────────────────────────────┐    │
│  │ 📝 Informações Gerais                             │    │
│  │                                                   │    │
│  │ Nome do Workspace:                                │    │
│  │ [Startup XYZ........................]             │    │
│  │                                                   │    │
│  │ Subdomain:                                        │    │
│  │ [startup-xyz] (não pode mudar)                   │    │
│  │ 🔗 https://startup-xyz.workadventure.localhost    │    │
│  └───────────────────────────────────────────────────┘    │
│                                                            │
│  ┌───────────────────────────────────────────────────┐    │
│  │ 🎨 Personalização                                 │    │
│  │                                                   │    │
│  │ Logo URL:                                         │    │
│  │ [https://startup.com/logo.png........]            │    │
│  │                                                   │    │
│  │ Cor Principal:                                    │    │
│  │ [#6366f1] 🎨                                      │    │
│  │ Preview: ████████                                 │    │
│  └───────────────────────────────────────────────────┘    │
│                                                            │
│  [Salvar Configurações]                                   │
└────────────────────────────────────────────────────────────┘
```

#### **2. Upload da Logo**

Maria cola a URL da logo: `https://cdn.startup.com/logo.png`

Muda a cor para: `#ec4899` (rosa vibrante)

Clica em **"Salvar Configurações"**.

**Backend atualiza**:
```javascript
// PATCH /workspaces/{id}
{
  "settings": {
    "logoUrl": "https://cdn.startup.com/logo.png",
    "brandColor": "#ec4899"
  }
}
```

**Efeito visual**:
- Logo aparece no canto do mapa (overlay)
- Botões e highlights usam a cor rosa
- Avatar name tags têm borda rosa

#### **3. Preview das Mudanças**

Maria volta para o mundo virtual:

```
┌────────────────────────────────────────────────────────────┐
│  [Logo da Startup no canto superior esquerdo]             │
│                                                            │
│  [Mapa Office Space renderizado]                          │
│                                                            │
│  [Avatar de Maria com tag rosa brilhante]                 │
│                                                            │
│  💬 Chat com bordas rosas                                 │
└────────────────────────────────────────────────────────────┘
```

---

<a name="caso-6"></a>
## 📧 Caso de Uso 6: Acesso de Membro Convidado

### **Persona**: João (Desenvolvedor na Startup)

**Contexto**: João recebeu o email de convite de Maria.

#### **1. Recebe Email**

João abre o email:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 De: Startup XYZ

Olá!

Maria Silva convidou você para fazer parte do
workspace "Startup XYZ" no WorkAdventure.

🌐 Acesse: [Clique Aqui]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### **2. Clica no Link**

Link: `https://startup-xyz.workadventure.localhost/join?token=abc123xyz`

**Backend processa** (`/join?token=...`):
1. Valida token (busca em `pending_invites`)
2. Verifica se user existe pelo email do convite
   - **Caso A**: User existe → Loga automaticamente e adiciona ao workspace
   - **Caso B**: User NÃO existe → Redireciona para signup pré-preenchido

**João não tem conta ainda** → Caso B

#### **3. Signup Pré-Preenchido**

Redireciona para: `/signup?invite=abc123xyz`

```
┌────────────────────────────────────────────────────────────┐
│  🎉 Você foi convidado para Startup XYZ!                   │
│                                                            │
│  Crie sua conta para entrar:                              │
│                                                            │
│  Email:     [joao@startup.com] (bloqueado)                │
│  Senha:     [••••••••••••••••]                            │
│  Seu Nome:  [João Silva........]                          │
│                                                            │
│  [Criar Conta e Entrar]                                   │
└────────────────────────────────────────────────────────────┘
```

Email já vem preenchido e bloqueado (do convite).

João preenche senha e nome, clica **"Criar Conta e Entrar"**.

#### **4. Backend Processa**

```javascript
// POST /auth/register-invite
{
  "inviteToken": "abc123xyz",
  "password": "senha123",
  "name": "João Silva"
}

// AuthService.registerFromInvite()
1. Validar token de convite
2. Criar UserEntity (email do convite)
3. Buscar pending_invite associado ao token
4. Criar WorkspaceMemberEntity (userId, workspaceId, role)
5. Deletar pending_invite
6. Logar user automaticamente
7. Redirecionar para workspace
```

#### **5. Primeiro Acesso ao Workspace**

João é redirecionado para: `https://startup-xyz.workadventure.localhost`

**Tela de boas-vindas**:

```
┌────────────────────────────────────────────────────────────┐
│  Bem-vindo ao Startup XYZ! 👋                              │
│                                                            │
│  Você foi adicionado como Membro.                         │
│                                                            │
│  Seu nickname: @joaodev                                    │
│                                                            │
│  [Entrar no Mundo Virtual →]                              │
└────────────────────────────────────────────────────────────┘
```

João clica e entra no Office Space (mapa padrão atual).

**Mapa carrega**:
- Avatar de João aparece na spawn zone com tag **"@joaodev"**
- Ele vê Maria online com tag **"@mariasilva"**: "👥 Players: 2/50"
- Chat mostra: "**@joaodev** entrou no mundo!"

---

<a name="caso-7"></a>
## 🎮 Caso de Uso 7: Uso Diário - Entrar no Mundo Virtual

### **Persona**: Ana (Designer, Admin do Workspace)

**Contexto**: Ana foi convidada como Admin, já criou conta e quer usar o workspace diariamente.

#### **1. Acessa URL do Workspace**

Ana digita no navegador: `startup-xyz.workadventure.localhost`

**Middleware processa**:
1. Extrai subdomain: `startup-xyz`
2. Busca workspace no DB
3. Verifica se Ana está autenticada (cookie de sessão)
   - **Caso A**: Sim → Carrega mapa
   - **Caso B**: Não → Redireciona para login

**Ana já está logada** → Caso A

#### **2. Carregamento do Mapa**

**Frontend**:
- Busca `workspace.settings.defaultMapId` → Office Space
- Carrega `/workspaces/{id}/maps/{map-id}.json`
- Renderiza mapa
- Posiciona Ana na spawn zone
- Carrega outros players online: Maria, João, Pedro

**Tela de Ana**:
```
┌────────────────────────────────────────────────────────────┐
│  [Logo da Startup]              👥 Online: 4/50            │
│                                                            │
│  [Mapa Office Space renderizado]                          │
│                                                            │
│  [Avatares visíveis:]                                     │
│  • Maria (Owner) - Sala de Reunião                        │
│  • João (Member) - Mesa de Dev                            │
│  • Pedro (Member) - Café                                  │
│  • Ana (você) - Entrada                                   │
│                                                            │
│  💬 Chat:                                                  │
│     Maria: "Bom dia, time!"                               │
│     João: "Bom dia! 🚀"                                    │
│                                                            │
│  [WASD para mover | E para interagir]                    │
└────────────────────────────────────────────────────────────┘
```

#### **3. Navegação no Mapa**

Ana usa **WASD** para andar até a "Sala de Reunião" onde Maria está.

**Ao se aproximar de Maria**:
- Círculo de proximidade ativa
- Vídeo de Maria aparece em mini-janela
- Áudio espacial ativa (quanto mais perto, mais alto)

#### **4. Iniciar Reunião em Sala Jitsi**

Ana entra na zona "🎥 Meeting Room".

**Modal aparece**:

```
┌────────────────────────────────────────────┐
│  Entrar em Reunião?                        │
│                                            │
│  👥 2 pessoas já estão aqui:               │
│     • Maria Silva                          │
│     • Você                                 │
│                                            │
│  [Cancelar]  [Entrar na Reunião]          │
└────────────────────────────────────────────┘
```

Ana clica **"Entrar"**.

**Jitsi Meeting abre**:
- Iframe full-screen com Jitsi
- Camera e mic de Ana ativam
- Maria e Ana podem conversar
- Chat do Jitsi disponível
- Screen sharing habilitado

#### **5. Sair da Reunião**

Ana clica **"Sair da Reunião"**.

Volta para o mapa normalmente, ainda vê Maria andando.

#### **6. Ir para Outra Área**

Ana anda até a zona "📺 YouTube Area".

**Interação**:
- Modal: "Assistir vídeo?"
- Ana cola URL: `https://youtube.com/watch?v=...`
- Vídeo sincronizado aparece para todos na zona
- João entra na zona e vê o mesmo vídeo no mesmo timestamp

---

<a name="caso-8"></a>
## 👨‍💼 Caso de Uso 8: Admin Gerenciando Usuários

### **Persona**: Maria (Owner)

**Contexto**: Pedro (membro) está spamming no chat. Maria precisa bloqueá-lo temporariamente.

#### **1. Acessa Admin Panel**

Maria, enquanto no mapa, clica no botão **"⚙️ Admin"** (flutuante).

Nova aba abre: `https://startup-xyz.workadventure.localhost/admin`

#### **2. Vai para Gestão de Usuários**

Menu lateral → **"👥 Usuários"**

**Lista de usuários**:

```
┌────────────────────────────────────────────────────────────┐
│  👥 Usuários do Workspace (4)                              │
│                                                            │
│  🔍 [Buscar usuário......................]                │
│                                                            │
│  Filtros: [Todos ▼] [Ordenar: Nome ▼]                     │
│                                                            │
│  ┌─────────────────────────────────────────────────┐      │
│  │ Nome      Email             Role    Status  Ações│     │
│  ├─────────────────────────────────────────────────┤      │
│  │ Maria     maria@startup     Owner   ✓ Ativo  -  │     │
│  │ Ana       ana@startup       Admin   ✓ Ativo [Ver]│     │
│  │ João      joao@startup      Member  ✓ Ativo [Ver]│     │
│  │ Pedro     pedro@startup     Member  ✓ Ativo [Ver]│ ←   │
│  └─────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────┘
```

#### **3. Ver Detalhes de Pedro**

Maria clica em **"[Ver]"** na linha de Pedro.

`/admin/users/{pedro-id}`

```
┌────────────────────────────────────────────────────────────┐
│  👤 Pedro Santos                           [Bloquear User] │
│                                                            │
│  📧 Email: pedro@startup.com                               │
│  📅 Membro desde: 3 dias atrás                             │
│  🔐 Role: Member                                           │
│  ⏰ Último acesso: 5 minutos atrás                         │
│                                                            │
│  ┌───────────────────────────────────────────────────┐    │
│  │ 📊 Atividade                                      │    │
│  │                                                   │    │
│  │ • Total de logins: 15                             │    │
│  │ • Tempo no mundo: 8h 32min                        │    │
│  │ • Mensagens enviadas: 234                         │    │
│  └───────────────────────────────────────────────────┘    │
│                                                            │
│  ┌───────────────────────────────────────────────────┐    │
│  │ 📜 Histórico de Ações (últimas 10)                │    │
│  │                                                   │    │
│  │ • [Hoje 14:32] Enviou mensagem no chat            │    │
│  │ • [Hoje 14:30] Entrou na zona Jitsi               │    │
│  │ • [Hoje 14:15] Conectou ao workspace              │    │
│  └───────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

#### **4. Bloquear Usuário**

Maria clica em **"[Bloquear User]"**.

**Modal de Confirmação**:

```
┌────────────────────────────────────────────────────────────┐
│  ⚠️ Bloquear Pedro Santos?                        [X]      │
│                                                            │
│  Este usuário não poderá mais acessar o workspace.        │
│                                                            │
│  Motivo do bloqueio: (obrigatório)                        │
│  ┌──────────────────────────────────────────────┐         │
│  │ Spam no chat e comportamento inadequado       │         │
│  │                                                │         │
│  └──────────────────────────────────────────────┘         │
│                                                            │
│  [Cancelar]  [Confirmar Bloqueio]                         │
└────────────────────────────────────────────────────────────┘
```

Maria escreve o motivo e clica **"Confirmar Bloqueio"**.

**Backend executa**:
```javascript
// PATCH /admin/users/{pedro-id}/block
{
  "reason": "Spam no chat e comportamento inadequado",
  "blockedBy": "maria-id" // Automaticamente
}

// AdminService.blockUser()
1. Atualizar UserEntity:
   - isActive = false
   - blockedAt = now()
   - blockedReason = motivo
2. Criar registro AuditLog:
   - action: "block_user"
   - performedBy: maria-id
   - targetUser: pedro-id
   - metadata: { reason: "..." }
3. Desconectar Pedro (WebSocket kick)
4. Enviar email para Pedro notificando bloqueio
```

#### **5. Pedro é Desconectado**

**Do lado de Pedro** (ainda no mapa):

```
┌────────────────────────────────────────────┐
│  🚫 Você foi removido do workspace         │
│                                            │
│  Motivo: Spam no chat e comportamento      │
│          inadequado                        │
│                                            │
│  Entre em contato com o administrador      │
│  se achar que isso é um erro.             │
│                                            │
│  [OK]                                      │
└────────────────────────────────────────────┘
```

Pedro é redirecionado para página de "Acesso Negado".

Se tentar acessar novamente `startup-xyz.workadventure.localhost`:

```
┌────────────────────────────────────────────┐
│  ⛔ Acesso Negado                           │
│                                            │
│  Sua conta foi bloqueada neste workspace.  │
│                                            │
│  Motivo: Spam no chat e comportamento      │
│          inadequado                        │
│                                            │
│  Data do bloqueio: Hoje, 14:35             │
└────────────────────────────────────────────┘
```

#### **6. Auditoria Registrada**

Maria pode ver na página **"/admin/logs"**:

```
┌────────────────────────────────────────────────────────────┐
│  📜 Logs de Auditoria                                      │
│                                                            │
│  🔍 Filtros: [Todos ▼] [Últimos 7 dias ▼]                │
│                                                            │
│  Timeline:                                                 │
│  ┌───────────────────────────────────────────────────┐    │
│  │ 🚫 Hoje, 14:35                                    │    │
│  │ Maria Silva bloqueou Pedro Santos                 │    │
│  │ Motivo: "Spam no chat e comportamento inadequado" │    │
│  │ IP: 192.168.1.10                                  │    │
│  └───────────────────────────────────────────────────┘    │
│                                                            │
│  ┌───────────────────────────────────────────────────┐    │
│  │ ✏️ Hoje, 10:22                                    │    │
│  │ Maria Silva editou configurações do workspace     │    │
│  │ Mudanças: brandColor                              │    │
│  └───────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

---

## 🎯 Resumo dos Fluxos

| Caso de Uso | Persona | Resultado Final |
|-------------|---------|-----------------|
| 1. Signup | Maria (Fundadora) | Workspace criado, mapa clonado, owner adicionado |
| 2. Primeiro Acesso | Maria | Entra no mapa, explora, vê admin panel |
| 3. Convidar Membros | Maria | 3 convites enviados, emails disparados |
| 4. Gerenciar Mapas | Maria | 2 mapas no workspace, Office como padrão |
| 5. Personalizar | Maria | Logo e cor aplicados no workspace |
| 6. Aceitar Convite | João | Conta criada, adicionado ao workspace, entra no mapa |
| 7. Uso Diário | Ana | Entra no mapa, usa Jitsi, assiste YouTube |
| 8. Admin - Bloqueio | Maria | Pedro bloqueado, desconectado, auditoria registrada |

---

## 🔄 Fluxo Completo End-to-End (30.000 pés)

```
1. Maria acessa workadventure.io
   └→ Clica "Começar Gratuitamente"
      └→ Preenche signup (4 passos)
         └→ Passo 1: Dados pessoais
            • Nome completo: "Maria Silva Santos"
            • Nickname: "@mariasilva" (disponível ✓)
            • Email + senha forte
            • Tipo de conta: Pessoa Física
            • CPF: 123.456.789-00 (validado ✓)
            • Aceita termos
         └→ Passo 2: Configura workspace
            • Nome: "Startup XYZ"
            • Subdomain: "startup-xyz" (disponível ✓)
         └→ Passo 3: Escolhe template
            • Seleciona "Virtual Café" (15 pessoas)
         └→ Passo 4: Criação em progresso
            • Backend valida CPF/CNPJ
            • Backend verifica nickname único
            • Cria user com documentNumber
            • Cria workspace + clona mapa
            • Redireciona para startup-xyz.workadventure.localhost
               └→ Maria entra no Café virtual com tag @mariasilva

2. Maria convida 3 pessoas via Admin Panel
   └→ Emails enviados com links de convite
      └→ João, Ana, Pedro clicam nos links
         └→ Criam contas com seus nicknames (@joaodev, @anadesign, @pedropm)
            └→ Cada um escolhe CPF ou CNPJ
               └→ Backend valida documentos brasileiros
                  └→ São adicionados ao workspace automaticamente
                     └→ Entram no mundo com seus nicknames visíveis

3. Equipe usa diariamente
   └→ Acessam startup-xyz.workadventure.localhost
      └→ Entram no mapa padrão (Office Space)
         └→ Avatares exibem tags com @ (ex: @mariasilva, @joaodev)
            └→ Chat mostra "@joaodev entrou no mundo!"
               └→ Andam, conversam, usam Jitsi, assistem YouTube
                  └→ Trabalham colaborativamente no mundo virtual

4. Maria gerencia tudo pelo Admin Panel
   └→ Adiciona mais mapas
      └→ Personaliza logo e cores
         └→ Gerencia membros (vê CPF/CNPJ de cada um)
            └→ Bloqueia usuários problemáticos
               └→ Vê logs de auditoria com identificação por nickname e documento
```

---

**Total de páginas criadas**: 8 casos de uso detalhados
**Fluxos cobertos**: Signup, onboarding, gestão, uso diário, moderação
**Próximo passo**: Implementar Sprint 1 do Roadmap!
