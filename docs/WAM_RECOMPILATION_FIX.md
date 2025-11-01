# Correção: Recompilação Forçada de Arquivos WAM

## Problema Resolvido

Quando um arquivo `.tmj` era re-enviado para o map-storage, o arquivo `.wam` correspondente **não era recompilado**, mantendo metadados antigos. Isso causava que mudanças de nome, descrição e configurações dos mapas não fossem refletidas na aplicação.

### Causa
No arquivo `map-storage/src/Upload/UploadController.ts`, a função `createWAMFileIfMissing()` tinha uma verificação:

```typescript
if (!(await this.fileSystem.exist(wamPath))) {
    // Apenas criava WAM se ele NÃO existisse
}
```

## Solução Implementada

### 1. Renomeação da Função
- **Antes**: `createWAMFileIfMissing()`
- **Depois**: `createOrUpdateWAMFile()`

### 2. Remoção da Verificação de Existência
A função agora **sempre recompila** o arquivo `.wam` quando um `.tmj` é enviado, sem verificar se o `.wam` já existe.

### 3. Atualização da Lógica de Upload
**Linhas 214-220** do `UploadController.ts`:

```typescript
if (path.extname(key) === ".tmj") {
    if (!wamFilesNames.includes(path.parse(zipEntry.path).name)) {
        promises.push(this.createOrUpdateWAMFile(key, zipEntry, zipDirectory));
    } else {
        // Sempre recompila WAM mesmo se já existe (para atualizar metadados)
        promises.push(this.createOrUpdateWAMFile(key, zipEntry, zipDirectory));
    }
}
```

## Comportamento Após a Correção

### Primeiro Upload
```
Upload: filial1.zip (filial1.tmj + assets)
    ↓
Map Storage processa
    ↓
✅ Cria: filial1.tmj
✅ Cria: filial1.wam (com metadados)
✅ Cria: __cache.json (com lista de mapas)
```

### Segundo Upload (com atualizações)
```
Upload: filial1.zip (filial1.tmj ATUALIZADO + assets)
    ↓
Map Storage processa
    ↓
✅ Atualiza: filial1.tmj
✅ RECOMPILA: filial1.wam (com novos metadados) ← ANTES NÃO ACONTECIA
✅ Regenera: __cache.json (com dados atualizados)
```

## Impacto

### ✅ Benefícios
1. **Metadados Sempre Atualizados**: Nome, descrição, imagem do mapa são sempre sincronizados
2. **Propriedades Refletidas**: Mudanças em salas Jitsi, URLs, etc. aparecem imediatamente
3. **Cache Consistente**: O `__cache.json` sempre reflete o estado atual
4. **Sem Necessidade de Deleção Manual**: Não precisa mais deletar `.wam` antes de re-enviar

### ⚠️ Performance
- Mapa recompilado **sempre** que `.tmj` é enviado
- Em mapas grandes, pode levar alguns segundos a mais
- **Solução**: Ideal para desenvolvimento; em produção, considerar cache mais inteligente

## Arquivos Modificados

- `map-storage/src/Upload/UploadController.ts`
  - Linhas 214-220: Atualização da lógica de chamada
  - Linhas 493-510: Renomeação e modificação da função

## Como Usar

### Fluxo Simplificado Agora:

1. **Modifique seu `.tmj` localmente**
   ```
   /maps/mapas/filial1.tmj ← Edite no Tiled
   ```

2. **Crie um ZIP com o arquivo e assets**
   ```
   filial1.zip
   ├── map.tmj (seu filial1.tmj renomeado)
   ├── tileset*.png
   ├── assets/
   └── ...
   ```

3. **Faça upload via interface**
   ```
   http://map-storage.workadventure.localhost/ui/
   ```

4. **Pronto!** ✅
   - `.wam` é recompilado automaticamente
   - Cache é atualizado
   - Aplicação mostra dados novos

**Nenhuma necessidade de deletar arquivos antigos!**

## Testes Recomendados

1. ✅ Upload inicial de filial1.tmj
2. ✅ Modificar name/description do TMJ
3. ✅ Re-enviar ZIP
4. ✅ Verificar se mudanças aparecem na UI
5. ✅ Testar com múltiplos mapas

## Referências

- Arquivo modificado: `map-storage/src/Upload/UploadController.ts`
- Classe: `UploadController`
- Função anterior: `createWAMFileIfMissing()` (linha 490)
- Função nova: `createOrUpdateWAMFile()` (linha 493)

---

**Data**: 2025-10-27
**Versão**: 1.0
**Status**: ✅ Implementado e Testado
