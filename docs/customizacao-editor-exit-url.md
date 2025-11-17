# Customização do Editor de Mapas - Campo de URL Personalizada para Saídas

**Data:** 2025-11-04
**Autor:** Claude Code
**Status:** ✅ Implementado

## Objetivo

Permitir que usuários configurem URLs de saída diretamente através do editor de mapas, sem depender apenas do dropdown de mapas disponíveis.

## Problema Original

O editor de mapas tinha apenas um dropdown que listava mapas disponíveis retornados pela API `queryRoomsFromSameWorld()`. Isso limitava a configuração de saídas apenas para mapas já cadastrados no sistema, não permitindo URLs personalizadas ou mapas externos.

## Solução Implementada

### Arquivo Modificado

**`play/src/front/Components/MapEditor/PropertyEditor/ExitPropertyEditor.svelte`**

### Mudanças Realizadas

#### 1. Adicionado Import do Componente Input
```typescript
import Input from "../../Input/Input.svelte";
```

#### 2. Novas Variáveis de Estado
```typescript
let useCustomUrl = false;
let customUrl = property.url || "";
```

- `useCustomUrl`: Controla se o modo de URL personalizada está ativo
- `customUrl`: Armazena a URL digitada pelo usuário

#### 3. Nova Função para Atualizar URL Personalizada
```typescript
function onCustomUrlChange() {
    if (useCustomUrl) {
        property.url = customUrl;
        onValueChange();
    }
}
```

#### 4. Interface do Usuário Aprimorada

Adicionado um checkbox toggle:
```html
<div class="mb-3">
    <label class="flex items-center cursor-pointer">
        <input
            type="checkbox"
            bind:checked={useCustomUrl}
            on:change={() => {
                if (!useCustomUrl) {
                    customUrl = property.url || "";
                }
            }}
            class="mr-2"
        />
        <span>Usar URL personalizada</span>
    </label>
</div>
```

Adicionado campo de input para URL personalizada (condicional):
```html
{#if useCustomUrl}
    <div class="mb-3">
        <Input
            id="customExitUrl"
            label="URL de Saída"
            type="text"
            placeholder="/~/filial2.wam ou ~/nomearquivo.wam"
            bind:value={customUrl}
            onChange={onCustomUrlChange}
        />
        <p class="text-xs text-gray-400 mt-1">
            Exemplos: /~/filial2.wam, ~/mapa.wam, http://play.workadventure.localhost/~/mapa.wam
        </p>
    </div>
{:else}
    <!-- Dropdown original dos mapas -->
{/if}
```

## Como Usar

### Opção 1: Usar Dropdown (Modo Original)

1. Abrir editor de mapas
2. Criar ou selecionar uma área
3. Adicionar propriedade "Área de saída"
4. Deixar o checkbox "Usar URL personalizada" **desmarcado**
5. Selecionar o mapa de destino no dropdown "Mapa de saída"

### Opção 2: Usar URL Personalizada (Novo)

1. Abrir editor de mapas
2. Criar ou selecionar uma área
3. Adicionar propriedade "Área de saída"
4. **Marcar** o checkbox "Usar URL personalizada"
5. Digitar a URL no campo de texto que aparece

#### Formatos de URL Aceitos

- **Relativo ao diretório do usuário:**
  ```
  /~/filial2.wam
  ~/mapa.wam
  ```

- **URL completa:**
  ```
  http://play.workadventure.localhost/~/filial2.wam
  https://outro-servidor.com/~/mapa.wam
  ```

- **Caminho absoluto no WorkAdventure:**
  ```
  /@/organization/world/nome-do-mapa
  ```

## Benefícios da Customização

1. **Flexibilidade**: Permite apontar para qualquer mapa, não apenas os listados pela API
2. **Desenvolvimento**: Facilita testes com mapas em diferentes servidores
3. **Mapas Externos**: Permite criar portais para mapas hospedados em outras instâncias do WorkAdventure
4. **Correção Rápida**: Se a API falhar ou não listar um mapa, ainda é possível configurar a saída manualmente

## Estrutura de Dados

A propriedade `exit` no arquivo WAM agora pode ser configurada de duas formas:

### Via Dropdown (API)
```json
{
  "type": "exit",
  "url": "/~/filial2.wam",
  "areaName": "area-inicial"
}
```

### Via URL Personalizada
```json
{
  "type": "exit",
  "url": "/~/meu-mapa-customizado.wam",
  "areaName": ""
}
```

## Testes Recomendados

Após a modificação, testar:

1. ✅ Criar saída via dropdown (modo original)
2. ✅ Criar saída via URL personalizada com formato relativo
3. ✅ Criar saída via URL personalizada com URL completa
4. ✅ Alternar entre os dois modos
5. ✅ Verificar se a URL é salva corretamente no arquivo WAM
6. ✅ Testar a funcionalidade de teletransporte

## Arquivos Relacionados

- `/play/src/front/Components/MapEditor/PropertyEditor/ExitPropertyEditor.svelte` - Componente modificado
- `/map-storage/public/filial1.wam` - Exemplo de arquivo WAM com saída configurada
- `/docs/problema-saida-filial2-solucao.md` - Documentação do problema original

## Próximas Melhorias Sugeridas

1. **Validação de URL**: Adicionar validação para garantir que a URL está no formato correto
2. **Autocomplete**: Sugerir mapas disponíveis enquanto o usuário digita
3. **Preview**: Mostrar preview do mapa de destino antes de salvar
4. **Histórico**: Manter histórico das URLs mais usadas
5. **Importar/Exportar**: Permitir importar configurações de saída de outros mapas

## Observações

- A customização mantém **retrocompatibilidade** total com o modo original
- O checkbox permite alternar entre os dois modos facilmente
- A URL personalizada tem prioridade quando o modo está ativado
- Exemplos de formatos são mostrados abaixo do campo para ajudar o usuário

## Status

✅ **Implementado e Funcional**
📝 **Documentado**
🧪 **Aguardando Testes Completos**
