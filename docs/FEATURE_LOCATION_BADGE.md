# Feature: Badge de Localização (Home Office / Presencial)

**Data de Implementação**: 2025-10-19
**Status**: MVP Mockado Concluído

## Resumo

Sistema de badges visuais que exibe se um usuário está em **Home Office** ou **Presencial**, visível tanto acima do avatar no jogo quanto na lista de usuários.

## Funcionalidades Implementadas

### 1. Sistema de Badges Visuais

- **No Jogo (acima do avatar)**:
  - Badge flutuante renderizado com Phaser
  - Texto: "Home-Office" (Azul) e "Presencial" (Verde)
  - Badge com fundo colorido e bordas arredondadas
  - Animação suave ao aparecer/mudar status
  - Posicionado em y=-35 (entre o nome e ícones de talk/speaker)
  - Largura ajustável baseada no comprimento do texto

- **Na Lista de Usuários (Chat)**:
  - Badge exibido abaixo do status de disponibilidade
  - Texto completo: "Home-Office" ou "Presencial"
  - Badge com fundo colorido e bordas arredondadas
  - Cores condicionais: Verde (#68e97a) para Presencial, Azul (#4a90e2) para Home-Office
  - Tooltip com descrição completa

### 2. Arquitetura

```
LocationStatus (enum)
    ├── HOMEOFFICE
    ├── PRESENTE
    └── UNKNOWN

LocationStatusStore (Svelte Store)
    └── Dados mockados por userUuid/email

LocationBadge (Phaser Component)
    ├── Container com Graphics + Text
    └── Animações de show/hide

Character.ts
    ├── Integração do LocationBadge
    └── Métodos setLocationStatus/getLocationStatus

GameScene.ts
    └── Aplicação de status ao criar players

User.svelte
    └── Exibição do badge na lista
```

## Arquivos Criados

### Core System
- `play/src/front/Phaser/Game/LocationStatus.ts` - Enum, interfaces e funções helper
- `play/src/front/Phaser/Components/LocationBadge.ts` - Componente visual Phaser
- `play/src/front/Stores/LocationStatusStore.ts` - Store Svelte com dados mockados

## Arquivos Modificados

### Phaser/Game
- `play/src/front/Phaser/Entity/Character.ts`
  - Adicionado propriedade `locationBadge: LocationBadge`
  - Métodos `setLocationStatus()` e `getLocationStatus()`

- `play/src/front/Phaser/Game/PlayerInterface.ts`
  - Campo `locationStatus?: LocationStatus`

- `play/src/front/Phaser/Game/GameScene.ts`
  - Import de `LocationStatus` e `getLocationStatus`
  - Aplicação de status ao criar RemotePlayer
  - Aplicação de status ao criar CurrentPlayer (usando email do LocalUser)

### UI (Svelte)
- `play/src/front/Chat/Components/UserList/User.svelte`
  - Imports de LocationStatus helpers
  - Store reativo `userLocationStatusStore`
  - Badge visual com emoji e texto

## Como Testar

### 1. Dados Mockados

Os dados de teste estão em `LocationStatusStore.ts`:

```typescript
const MOCK_LOCATION_DATA: Record<string, LocationStatus> = {
    // Por userUuid
    "user-uuid-1": LocationStatus.PRESENTE,
    "user-uuid-2": LocationStatus.HOMEOFFICE,
    "user-uuid-3": LocationStatus.HOMEOFFICE,

    // Por email
    "user1@example.com": LocationStatus.PRESENTE,
    "user2@example.com": LocationStatus.HOMEOFFICE,
    "admin@example.com": LocationStatus.HOMEOFFICE,
    "ctorres@beautyservices.com.br": LocationStatus.PRESENTE,
};
```

### 2. Adicionar Novos Usuários de Teste

Para testar com seus próprios usuários:

1. Obtenha o `userUuid` ou `email` do usuário
2. Edite `play/src/front/Stores/LocationStatusStore.ts`
3. Adicione entrada em `MOCK_LOCATION_DATA`
4. Recompile: `npm run dev`

### 3. Verificar Visualmente

**No Jogo:**
1. Faça login no sistema
2. Entre em uma sala com outros usuários
3. Veja o badge acima dos avatares (🏠 ou 🏢)

**Na Lista de Usuários:**
1. Abra o painel de chat (tecla "C" ou botão de chat)
2. Clique na aba "Usuários"
3. Veja o badge abaixo do status de cada usuário

### 4. Console de Debug

Para inspecionar o estado atual:

```javascript
// No console do navegador
import { getLocationStatusMap } from './src/front/Stores/LocationStatusStore';

// Ver todos os status carregados
getLocationStatusMap().subscribe(map => console.log(map))();
```

## Próximas Etapas (Fase 2 - Integração com API)

### 1. Criar LocationStatusService

Arquivo: `play/src/front/Services/LocationStatusService.ts`

```typescript
class LocationStatusService {
    private cache: Map<string, { status: LocationStatus; timestamp: number }>;

    async fetchLocationStatus(email: string, date: string): Promise<LocationStatus> {
        // Chamar API: https://portalweb.rrperfumes.com.br/api/controlid/controle_presenca/
        // Parâmetros: data (YYYYMMDD), email
        // Retorno: STATUS_FINAL ("PRESENTE" | "FALTA" | "")
    }
}
```

### 2. Atualizar LocationStatusStore

Substituir dados mockados por chamadas ao LocationStatusService:

```typescript
export async function fetchAndSetLocationStatus(email: string): Promise<void> {
    const today = getCurrentDateYYYYMMDD();
    const status = await locationStatusService.fetchLocationStatus(email, today);
    setLocationStatus(email, status);
}
```

### 3. Adicionar Campo Email ao PlayerInterface

Para facilitar a integração, adicionar email ao `PlayerInterface`:

```typescript
export interface PlayerInterface {
    // ... campos existentes
    email?: string; // Email do usuário para consulta na API
}
```

### 4. Backend - Propagar Email

No backend (Pusher), ao criar `AddPlayerInterface`, incluir o email do usuário extraído do token JWT.

### 5. Atualização Periódica (Opcional)

Implementar polling ou WebSocket para atualizar status durante o dia:

```typescript
// A cada 30 minutos
setInterval(() => {
    refreshAllLocationStatuses();
}, 30 * 60 * 1000);
```

### 6. Tratamento de CORS

Se necessário, criar proxy no backend:

**Arquivo**: `play/src/pusher/controllers/LocationStatusController.ts`

```typescript
router.get('/location-status', async (req, res) => {
    const { email } = req.query;
    const response = await axios.get(
        'https://portalweb.rrperfumes.com.br/api/controlid/controle_presenca/',
        { params: { data: getCurrentDate(), email } }
    );
    res.json(response.data);
});
```

## Configurações Futuras

### Variáveis de Ambiente

Adicionar ao `.env`:

```env
# Location Status API
LOCATION_API_URL=https://portalweb.rrperfumes.com.br/api/controlid/controle_presenca/
LOCATION_API_ENABLED=true
LOCATION_CACHE_TTL=1800000  # 30 minutos em ms
```

## Mapeamento da API

| STATUS_FINAL (API) | LocationStatus (Sistema) | Comportamento |
|--------------------|--------------------------|---------------|
| "PRESENTE"         | LocationStatus.PRESENTE  | Badge verde "Presencial" |
| "FALTA"            | LocationStatus.HOMEOFFICE| Badge azul "Home-Office" |
| "" (vazio)         | LocationStatus.HOMEOFFICE| Badge azul "Home-Office" |
| Array vazio []     | LocationStatus.HOMEOFFICE| Badge azul "Home-Office" |
| Erro de rede       | LocationStatus.HOMEOFFICE| Badge azul "Home-Office" (fallback) |
| Timeout            | LocationStatus.HOMEOFFICE| Badge azul "Home-Office" (fallback) |
| Usuário não encontrado | LocationStatus.HOMEOFFICE| Badge azul "Home-Office" (fallback) |

**Importante**: Qualquer erro, timeout, ou situação desconhecida resulta em Home-Office como padrão seguro.

## Troubleshooting

### Badge não aparece no jogo

1. Verifique se o usuário está no `MOCK_LOCATION_DATA`
2. Abra o console: procure por erros relacionados a `LocationBadge`
3. Verifique se o `userUuid` ou `email` corresponde aos dados mockados

### Badge não aparece na lista

1. Verifique se `user.uuid` ou `user.spaceUserId` existe
2. Confira o console para erros de import
3. Verifique se o Svelte compilou sem erros: `npm run svelte-check`

### Badge mostra "Home-Office" para todos

- Isso é o comportamento padrão quando não há dados mockados
- Verifique se adicionou os usuários corretos em `MOCK_LOCATION_DATA`
- Confira se o identificador (email ou userUuid) está correto

## Referências

- **Documentação da API**: Script Python fornecido pelo usuário
- **Exemplo de Badge Existente**: `PlayerStatusDot.ts`, `SpeakerIcon.ts`
- **Padrão de Stores**: `ChatStore.ts`, `MediaStore.ts`

## Autores

- Implementado por: Claude Code
- Solicitado por: Cristian Torres
- Data: 19 de Outubro de 2025
