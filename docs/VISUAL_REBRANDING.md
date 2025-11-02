# Visual Rebranding: WorkAdventure → WorkCodeForge

**Data**: 2025-11-01
**Status**: Concluído

## Resumo

Este documento descreve as alterações realizadas para rebrandizar os elementos visuais críticos do projeto de "WorkAdventure" para "WorkCodeForge". O foco foi em elementos que o usuário final vê diretamente na interface.

## Escopo

**Incluído** (Elementos Visuais Críticos):
- Logos e imagens de branding
- Títulos de páginas HTML
- Texto visível em componentes Svelte
- Configuração do título do game Phaser

**Não Incluído** (Mantido para fase futura):
- Documentação técnica (.md files)
- Comentários de código
- Identificadores técnicos e nomes de variáveis
- Referências em configurações internas

## Alterações Realizadas

### 1. Logos Placeholder (SVG)

Criados logos placeholder em formato SVG com gradiente azul e texto "Powered by WorkCodeForge":

**Arquivos Criados:**
- `play/public/static/images/Powered_By_WorkCodeForge_Big.svg` (400x100px)
- `play/public/static/images/Powered_By_WorkCodeForge_Small.svg` (200x50px)

**Características:**
- Gradiente linear: `#1e3a8a` → `#3b82f6`
- Fonte: Arial, sans-serif
- Formato SVG (escalável, leve)

### 2. Títulos HTML

**Arquivo**: `desktop/local-app/index.html`
- **Linha 7**: `<title>WorkAdventure Desktop</title>` → `<title>WorkCodeForge Desktop</title>`

**Arquivo**: `map-storage/index.html`
- **Linha 7**: `<title>WorkAdventure MapStorage</title>` → `<title>WorkCodeForge MapStorage</title>`

### 3. Componentes Svelte

#### 3.1 App.svelte
**Arquivo**: `play/src/front/Components/App.svelte`
- **Linha 118**: Título do Phaser game config
  - Antes: `title: "WorkAdventure"`
  - Depois: `title: "WorkCodeForge"`

#### 3.2 LimitRoomModal.svelte
**Arquivo**: `play/src/front/Components/Modal/LimitRoomModal.svelte`
- **Linhas 18-19**: Mensagem de modal
  - Antes: `"...to continue to use WorkAdventure, you must..."`
  - Depois: `"...to continue to use WorkCodeForge, you must..."`

#### 3.3 LoginScene.svelte
**Arquivo**: `play/src/front/Components/Login/LoginScene.svelte`

**Alteração 1** (Linha 7-9): Import do logo
- Antes: `import poweredByWorkAdventureImg from "../images/Powered_By_WorkAdventure_Big.png"`
- Depois: `const poweredByWorkAdventureImg = "/static/images/Powered_By_WorkCodeForge_Big.svg"`
- **Nota**: Mudado de PNG para SVG e de import relativo para URL absoluta (padrão Vite para arquivos em public/)

**Alteração 2** (Linha 158): Alt text da imagem
- Antes: `alt="Powered by WorkAdventure"`
- Depois: `alt="Powered by WorkCodeForge"`

## Validação

### TypeScript Type Check
✅ **Passou**: `npm run typecheck` executado no workspace `play/` sem erros

### Build Verification
- Nenhum erro de compilação
- Imports resolvidos corretamente
- SVG assets acessíveis via `/static/images/`

## Impacto Visual

### Usuário Final Verá:
1. **Aba do navegador**: Título "WorkCodeForge" em vez de "WorkAdventure"
2. **Tela de login**: Logo "Powered by WorkCodeForge" na parte inferior
3. **Modais**: Referências textuais a "WorkCodeForge"
4. **Título do jogo Phaser**: "WorkCodeForge" (visível em ferramentas de desenvolvedor)

## Próximos Passos (Futuro)

Se necessário para branding completo:
- Atualizar documentação em português (README.md, DOCUMENTACAO_AUTENTICACAO.md)
- Criar logos finais em alta qualidade para substituir placeholders SVG
- Considerar PNG/WebP otimizados para melhor compatibilidade
- Atualizar favicon e meta tags OpenGraph

## Arquivos Modificados

Total: **7 arquivos**

1. `play/public/static/images/Powered_By_WorkCodeForge_Big.svg` (novo)
2. `play/public/static/images/Powered_By_WorkCodeForge_Small.svg` (novo)
3. `desktop/local-app/index.html`
4. `map-storage/index.html`
5. `play/src/front/Components/App.svelte`
6. `play/src/front/Components/Modal/LimitRoomModal.svelte`
7. `play/src/front/Components/Login/LoginScene.svelte`

## Notas Técnicas

- **SVG vs PNG**: Optado por SVG para placeholders devido à escalabilidade e facilidade de criação sem ferramentas externas
- **Public Assets**: Arquivos em `public/` são servidos diretamente pelo Vite em `/static/`
- **Retrocompatibilidade**: Nenhuma quebra de funcionalidade; apenas mudanças cosméticas
- **SEO**: Títulos HTML atualizados melhoram branding em abas e histórico do navegador

---

**Documentado por**: Claude Code
**Commit associado**: (será adicionado após commit)
