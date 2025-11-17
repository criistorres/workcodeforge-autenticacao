# Problema: Saída para Filial 2 Não Funciona

**Data:** 2025-11-04
**Autor:** Claude Code
**Status:** Investigado - Solução Identificada

## Problema Relatado

Ao criar uma área de saída no mapa `filial1.wam` usando o editor de mapas, o usuário conseguiu:
1. Criar a área com sucesso
2. Nomear como "Saída para Filial 2"
3. Configurar o destino como "Filial 2 - Secundária" no dropdown

**Comportamento observado:**
- Ao entrar na área de saída, o jogador é redirecionado de volta para a área inicial de filial1
- A transição para filial2 não acontece

## Investigação Realizada

### 1. Análise do Código Fonte

Investiguei os seguintes arquivos:

#### `play/src/front/Phaser/Game/GameScene.ts` (linhas 691-693, 732-734)
```typescript
const exitUrl = this.getExitUrl(layer);
if (exitUrl !== undefined) {
    this.loadNextGameFromExitUrl(exitUrl).catch((e) => console.error(e));
}

this.gameMapFrontWrapper.getExitUrls().forEach((exitUrl) => {
    this.loadNextGameFromExitUrl(exitUrl).catch((e) => console.error(e));
});
```

#### `libs/map-editor/src/types.ts`
```typescript
export enum GameMapProperties {
    EXIT_URL = "exitUrl",
    EXIT_SCENE_URL = "exitSceneUrl",
    // ...
}
```

#### `play/src/front/Phaser/Game/GameMapPropertiesListener.ts`
```typescript
this.gameMapFrontWrapper.onPropertyChange(GameMapProperties.EXIT_URL, (newValue) => {
    if (newValue) {
        this.scene
            .onMapExit(Room.getRoomPathFromExitUrl(newValue as string, window.location.toString()))
    }
});
```

### 2. Descobertas

1. **Propriedade `exitUrl` obrigatória**: O sistema WorkAdventure requer que a propriedade `exitUrl` seja definida com uma URL válida do mapa de destino.

2. **Formato da URL**: A propriedade `exitUrl` deve conter uma URL relativa ou absoluta para o mapa de destino, por exemplo:
   - Relativo: `~/filial2.wam`
   - Absoluto: `http://play.workadventure.localhost/~/filial2.wam`

3. **Dropdown vs. URL**: O dropdown "Mapa de saída" que mostra "Filial 2 - Secundária" é apenas uma interface UI para facilitar a seleção, mas pode não estar configurando corretamente a propriedade `exitUrl` subjacente.

## Causa Raiz

A área de saída foi criada com sucesso através da interface do editor, mas a **propriedade `exitUrl` não foi configurada com a URL do mapa de destino**. O dropdown pode estar configurando uma propriedade diferente ou pode ser uma funcionalidade incompleta do editor de mapas.

## Solução

Existem duas abordagens para resolver este problema:

### Solução 1: Configurar via Editor de Mapas (Recomendada)

1. Abrir o editor de mapas
2. Selecionar a área "Saída para Filial 2"
3. Procurar por um campo para adicionar propriedades personalizadas ou URL
4. Adicionar manualmente a propriedade `exitUrl` com o valor: `~/filial2.wam`

### Solução 2: Editar Arquivo WAM Diretamente

1. Localizar o arquivo `filial1.wam` em:
   ```
   map-storage/data/maps/filial1.wam
   ```

2. Abrir o arquivo WAM (formato JSON)

3. Encontrar a área criada (procurar por "Saída para Filial 2")

4. Adicionar a propriedade `exitUrl`:
   ```json
   {
     "id": "...",
     "name": "Saída para Filial 2",
     "x": ...,
     "y": ...,
     "width": ...,
     "height": ...,
     "properties": {
       "exitUrl": "~/filial2.wam"
     }
   }
   ```

5. Salvar o arquivo

6. Recarregar o mapa no navegador

### Solução 3: Usar AreaEditor com Propriedade Customizada

Se o editor permitir adicionar propriedades personalizadas:

1. Abrir AreaEditor
2. Selecionar a área
3. Adicionar propriedade personalizada:
   - Nome: `exitUrl`
   - Valor: `~/filial2.wam`

## Formato da URL

Para mapas locais (no mesmo servidor):
- `~/nome-do-mapa.wam` - Relativo ao diretório do usuário
- `/@/organization/world/nome-do-mapa` - Caminho absoluto no WorkAdventure

Para mapas externos:
- URL completa: `https://play.workadventure.localhost/~/filial2.wam`

## Testes Necessários

Após aplicar a solução:

1. Entrar em filial1.wam
2. Mover o jogador até a área de saída
3. Verificar se o jogador é transportado para filial2.wam
4. Verificar se a posição inicial em filial2 está correta

## Referências Técnicas

- **GameMapProperties.EXIT_URL**: Propriedade principal para definir saídas
- **GameMapProperties.EXIT_SCENE_URL**: Propriedade antiga (deprecated)
- **Room.getRoomPathFromExitUrl()**: Método que processa a URL de saída
- **GameMapFrontWrapper.getExitUrls()**: Método que retorna todas as URLs de saída do mapa

## Próximos Passos Recomendados

1. **Implementar a solução escolhida** (preferencialmente Solução 1 se o editor permitir)
2. **Testar a funcionalidade** entrando na área de saída
3. **Criar área de retorno** em filial2 para voltar à filial1
4. **Documentar o processo** correto no manual do usuário
5. **Reportar bug** no editor de mapas se o dropdown não estiver configurando `exitUrl`

## Observações

- O sistema de saídas do WorkAdventure é baseado em propriedades de áreas, não em entidades
- Áreas podem ter múltiplas propriedades além de `exitUrl` (como `focusable`, `silent`, etc.)
- É importante usar URLs relativas (`~/`) para facilitar movimentação de mapas entre ambientes

## Status

🔍 **Investigação Completa**
⏳ **Aguardando Implementação da Solução**
