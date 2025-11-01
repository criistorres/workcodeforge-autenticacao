# Documentação - Mapas das Filiais (filial1.tmj e filial2.tmj)

## Resumo Executivo

Foram criados dois mapas interativos para as filiais da WorkCodeForge:
- **filial1.tmj** - Filial 1 (Matriz)
- **filial2.tmj** - Filial 2 (Secundária)

Ambos os mapas foram gerados baseado na estrutura do `chatzone.json` (mapa starter kit) e contêm toda a infraestrutura necessária para ambientes virtuais colaborativos com suporte a videoconferência, links de websites e interatividade.

## Localização dos Arquivos

```
/maps/mapas/filial1.tmj
/maps/mapas/filial2.tmj
```

## Especificações Técnicas

### Dimensões e Estrutura

| Propriedade | Valor |
|-------------|-------|
| **Largura** | 31 tiles |
| **Altura** | 23 tiles |
| **Tamanho do Tile** | 32 x 32 pixels |
| **Resolução Visual** | 992 x 736 pixels |
| **Formato** | TMJ (Tiled Map Editor JSON) |
| **Versão Tiled** | 1.9.0 |
| **Compressão** | Desabilitada |
| **Orientação** | Orthogonal (2D padrão) |

### Tilesets Inclusos

Os mapas utilizam 5 tilesets principais do starter kit:

1. **tileset5_export.png** - Tiles complementares (100 tiles)
2. **tileset6_export.png** - Mais tiles complementares (100 tiles)
3. **tileset1.png** - Tileset principal (121 tiles)
4. **tileset1-repositioning.png** - Variações de posicionamento (121 tiles)
5. **Special_Zones.png** - Zonas especiais com propriedades interativas (12 tiles)

**Total de Tiles Disponíveis**: 454+ tiles

### Camadas (Layers)

Ambos os mapas contêm 17 camadas organizadas hierarquicamente:

#### Camadas Base Visual
- **floorLayer** (ID: 2) - Base visual do piso
- **floor** (ID: 4) - Camada adicional de piso
- **furniture** (ID: 1) - Móveis e objetos decorativos
- **aboveFurniture** (ID: 33) - Elementos acima dos móveis
- **walls** (ID: 9) - Paredes e obstáculos estruturais

#### Camadas de Controle
- **collisions** (ID: 7) - Definiçõs de colisão (usando tile 443)
- **start** (ID: 6) - Ponto de partida do jogador

#### Camadas de Interatividade

**Salas de Videoconferência (Jitsi Meet):**
- **jitsiMeetingRoom** (ID: 29)
  - Filial 1: Conecta a `MeetingRoom-Filial1`
  - Filial 2: Conecta a `MeetingRoom-Filial2`
  - Uso: Salas de reunião formal

- **jitsiChillzone** (ID: 38)
  - Filial 1: Conecta a `ChillZone-Filial1`
  - Filial 2: Conecta a `ChillZone-Filial2`
  - Uso: Salas de relaxamento/socialização
  - Trigger: onaction (clique para ativar)

**Integração com Websites:**
- **openWebsite** (ID: 43) - Link principal para website
- **openWebsite-action** (ID: 41) - Ativa website ao clicar
- **openWebsite-icon** (ID: 42) - Mostra ícone de interação
- **openWebsite-2** (ID: 44) - Link secundário para outro website

**Zonas Especiais:**
- **clockZone** (ID: 23) - Zona com exibição de relógio

#### Camadas de Efeito Visual
- **abovePlayer1** (ID: 3) - Elementos acima do player (nível 1)
- **abovePlayer2** (ID: 27) - Elementos acima do player (nível 2)
- **abovePlayer3** (ID: 28) - Elementos acima do player (nível 3)

## Propriedades Customizadas

### Filial 1 - Matriz

```json
{
  "mapName": "Filial 1 - Matriz",
  "mapDescription": "Filial 1 - Matriz - Espaço de trabalho colaborativo da filial 1",
  "mapImage": "map.png",
  "mapLink": "https://thecodingmachine.github.io/workadventure-map-starter-kit/map.json",
  "mapCopyright": "Credits: Valdo Romao | License: CC-BY-SA 3.0",
  "script": "./script.js"
}
```

### Filial 2 - Secundária

```json
{
  "mapName": "Filial 2 - Secundária",
  "mapDescription": "Filial 2 - Secundária - Espaço de trabalho colaborativo da filial 2",
  "mapImage": "map.png",
  "mapLink": "https://thecodingmachine.github.io/workadventure-map-starter-kit/map.json",
  "mapCopyright": "Credits: Valdo Romao | License: CC-BY-SA 3.0",
  "script": "./script.js"
}
```

## Diferenças Entre Filiais

### Salas Jitsi Separadas

Cada filial possui suas próprias salas de videoconferência:

| Recurso | Filial 1 | Filial 2 |
|---------|----------|----------|
| **Sala de Reunião** | `MeetingRoom-Filial1` | `MeetingRoom-Filial2` |
| **Chill Zone** | `ChillZone-Filial1` | `ChillZone-Filial2` |

Isso garante que colaboradores de diferentes filiais em salas diferentes podem ter videoconferências isoladas.

### Layout Comum

Ambos os mapas compartilham:
- Mesma estrutura visual (layout, tilesets, camadas)
- Mesmos pontos de interatividade (websites, zonas)
- Mesma dimensão (31 x 23 tiles)
- Mesmas funcionalidades

## Como Usar os Mapas

### No Editor Tiled

1. Abra o Tiled Map Editor (v1.9.0 ou superior)
2. File → Open
3. Navegue para `/maps/mapas/` e abra `filial1.tmj` ou `filial2.tmj`

### Na Aplicação WorkCodeForge

Os mapas devem ser referenciados nas configurações de roteamento. Ver `ROUTING.md` para integração.

### Editar Layout

1. Abra o arquivo .tmj no Tiled
2. Modifique tiles, adicione/remova camadas
3. Adicione propriedades customizadas às camadas conforme necessário
4. Salve e o arquivo será atualizado

## Propriedades de Layer Importantes

### Propriedade `jitsiRoom`

Define a sala de videoconferência Jitsi que será acessada quando o jogador entrar nessa área.

```json
{
  "name": "jitsiRoom",
  "type": "string",
  "value": "MeetingRoom-Filial1"
}
```

### Propriedade `jitsiTrigger`

Define como a sala Jitsi é acionada:
- `onicon`: Ativa quando o jogador vê o ícone
- `onaction`: Ativa quando o jogador clica (padrão)

### Propriedade `openWebsite`

Indica que essa camada abre um website. O URL é armazenado em uma propriedade separada.

```json
{
  "name": "openWebsite",
  "type": "string",
  "value": "https://workadventu.re"
}
```

### Propriedade `zone`

Define zonas especiais:
```json
{
  "name": "zone",
  "type": "string",
  "value": "clock"
}
```

## Estrutura de Dados JSON

Ambos os arquivos .tmj seguem a especificação Tiled JSON v1.9. Estrutura simplificada:

```
map.json
├── compressionlevel: -1 (sem compressão)
├── height: 23
├── width: 31
├── tileheight: 32
├── tilewidth: 32
├── version: "1.9"
├── tiledversion: "1.9.0"
├── properties: [...] (metadados do mapa)
├── tilesets: [...] (5 tilesets)
└── layers: [...]  (17 camadas)
    ├── Camadas visuais (floor, furniture, walls)
    ├── Camadas de controle (collisions, start)
    ├── Camadas de interatividade (jitsi, website, zones)
    └── Camadas de efeito (abovePlayer)
```

## Ativos Gráficos Necessários

Os mapas referenciam os seguintes assets que devem estar presentes em `/maps/assets/`:

```
/maps/assets/
├── tileset5_export.png
├── tileset6_export.png
├── tileset1.png
├── tileset1-repositioning.png
└── Special_Zones.png
```

**Importante**: Se os assets não forem encontrados, o mapa será renderizado sem as imagens dos tiles.

## Tamanhos dos Arquivos

- **filial1.tmj**: ~89 KB
- **filial2.tmj**: ~89 KB

## Processo de Criação

Os mapas foram criados usando o seguinte processo:

1. ✓ Leitura do arquivo `chatzone.json` (mapa starter kit)
2. ✓ Análise da estrutura completa (tilesets, layers, propriedades)
3. ✓ Cópia profunda do mapa base
4. ✓ Customização de propriedades por filial
5. ✓ Atualização de referências Jitsi (salas isoladas por filial)
6. ✓ Exportação em formato .tmj (JSON Tiled)
7. ✓ Validação de integridade JSON
8. ✓ Documentação completa

## Próximos Passos

Para usar esses mapas na aplicação:

1. **Integração no Roteamento**: Adicione referências aos mapas no sistema de roteamento
2. **Customização Visual**: Edite no Tiled para ajustar layout visual
3. **Propriedades Adicionais**: Adicione propriedades customizadas conforme necessário
4. **Testes**: Verifique colisões, interatividade e performance
5. **Documentação**: Atualize guias de usuário com informações das filiais

## Referências

- **Arquivo Original**: `/maps/starter/chatzone.json`
- **Documentação Tiled**: https://doc.mapeditor.org/
- **Especificação TMJ**: https://doc.mapeditor.org/en/stable/reference/json-map-format.html
- **WorkAdventure Docs**: https://docs.workadventu.re/

---

**Criado em**: 2025-10-27
**Versão**: 1.0
**Status**: ✓ Completado e Validado
