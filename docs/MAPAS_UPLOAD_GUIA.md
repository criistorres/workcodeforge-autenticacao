# Guia Completo: Upload e Gerenciamento de Mapas no WorkCodeForge

## Visão Geral

Este guia descreve como fazer upload de novos mapas no WorkCodeForge e configurá-los como **mapas padrão** para usuários. Os mapas são armazenados no serviço **map-storage** e são **totalmente editáveis** através do **Map Editor**.

## Arquitetura de Mapas

### Sistema de Mapas do WorkCodeForge

O WorkCodeForge utiliza três tipos de URLs para mapas:

| Tipo | Exemplo | Editável? | Uso |
|------|---------|-----------|-----|
| **Mapas Padrão (Privados)** | `/~/filial1.wam` | ✅ SIM | Mapas do usuário, editáveis |
| **Mapas Estáticos** | `/_/global/...` | ❌ NÃO | Lobby, mapas de referência |
| **Map-Storage** | `http://map-storage:3000/...` | ✅ SIM | Backend que armazena mapas |

### Fluxo de Funcionamento

```
1. Usuário faz login
   ↓
2. Frontend lê defaultMap do JWT (ex: "filial1")
   ↓
3. Redireciona para `/~/filial1.wam`
   ↓
4. Map-Storage serve o arquivo
   ↓
5. Mapa carrega no navegador
   ↓
6. Usuário com tag "admin" vê botão do Map Editor
```

---

## Pré-requisitos

1. **Serviços rodando**:
   ```bash
   docker-compose up
   ```

2. **Acessar map-storage UI**:
   - URL: `http://map-storage.workadventure.localhost/ui/`
   - Usuário: `john.doe`
   - Senha: `password`

3. **Arquivo do Mapa**:
   - Formato: **Tiled Map JSON** (`.tmj`)
   - Com tilesets/assets inclusos
   - Exemplo: `filial1.tmj`, `filial2.tmj`, etc

---

## Passo 1: Preparar o Arquivo do Mapa

### Criar Pasta de Upload

```bash
cd ~/Desktop
mkdir -p upload-mapa/assets
cd upload-mapa
```

### Estrutura Esperada

Seu arquivo de mapa deve estar no formato **Tiled (.tmj)** com esta estrutura:

```
upload-mapa/
├── filial1.tmj          (arquivo principal do mapa)
└── assets/
    ├── tileset1.png
    ├── tileset2.png
    ├── tileset-especial.png
    └── ... (todas as imagens usadas no mapa)
```

### Onde Encontrar os Tilesets

Os tilesets (imagens PNG) normalmente estão em:
- Mesmo diretório do arquivo `.tmj`
- Pasta `assets/` próxima ao mapa
- Especificado dentro do arquivo `.tmj`

**Dica**: Abra o arquivo `.tmj` num editor de texto e procure por `"image"` para ver todos os tilesets necessários.

---

## Passo 2: Verificar Caminhos no Arquivo .TMJ

### Importante: Caminhos Relativos

Abra o arquivo `filial1.tmj` em um editor de texto e verifique os caminhos das imagens:

**❌ INCORRETO** (usado quando o arquivo estava em `maps/mapas/`):
```json
"image": "../assets/tileset1.png"
```

**✅ CORRETO** (para upload no map-storage):
```json
"image": "assets/tileset1.png"
```

### Como Corrigir (se necessário)

Se todos os caminhos começarem com `../assets/`, precisamos corrigir:

**Opção A: Editor de Texto**
1. Abra `filial1.tmj` num editor (VS Code, Sublime, etc)
2. Use Find & Replace:
   - Procurar: `../assets/`
   - Substituir por: `assets/`
3. Salve o arquivo

**Opção B: Linha de Comando**
```bash
sed -i 's|"../assets/|"assets/|g' filial1.tmj
```

**Opção C: Python Script**
```python
import json

with open('filial1.tmj', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Corrigir caminhos em tilesets
for tileset in data.get('tilesets', []):
    if 'image' in tileset and tileset['image'].startswith('../'):
        tileset['image'] = tileset['image'].replace('../', '')

with open('filial1.tmj', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Caminhos corrigidos!")
```

---

## Passo 3: Copiar Arquivos para Pasta de Upload

```bash
# Copiar arquivo principal
cp /caminho/para/filial1.tmj ~/Desktop/upload-mapa/

# Copiar TODOS os tilesets
cp /caminho/para/assets/*.png ~/Desktop/upload-mapa/assets/

# Verificar estrutura
ls -la ~/Desktop/upload-mapa/
ls -la ~/Desktop/upload-mapa/assets/
```

---

## Passo 4: Compactar em ZIP

### Via Terminal (Recomendado)

```bash
cd ~/Desktop/upload-mapa
zip -r ../filial1-completo.zip filial1.tmj assets/

# Verificar tamanho e integridade
ls -lh ../filial1-completo.zip
unzip -l ../filial1-completo.zip | head -20
```

### Via Finder (macOS)

1. Abra `Finder`
2. Navegue até `~/Desktop/upload-mapa`
3. Selecione `filial1.tmj` + pasta `assets` (Cmd+Click)
4. Botão direito → "Comprimir 2 itens"
5. Renomeie para `filial1-completo.zip`

### Via Explorador (Windows)

1. Abra Explorador
2. Navegue até a pasta `upload-mapa`
3. Selecione `filial1.tmj` + pasta `assets`
4. Botão direito → "Enviar para" → "Pasta compactada"

---

## Passo 5: Fazer Upload no Map-Storage

### Acessar Interface de Admin

1. Abra navegador
2. Vá para: `http://map-storage.workadventure.localhost/ui/`
3. Login:
   - **Usuário**: `john.doe`
   - **Senha**: `password`

### Upload do ZIP

1. Clique em "Fazer Upload" (ou similar)
2. Selecione `filial1-completo.zip`
3. Aguarde processamento (**pode levar alguns segundos**)
4. Verifique mensagem de sucesso:
   ```
   ✅ File successfully uploaded
   ```

### Erros Comuns Durante Upload

| Erro | Causa | Solução |
|------|-------|---------|
| `Invalid file extension. Maps should end with the ".tmj" extension.` | Arquivo é `.json` em vez de `.tmj` | Renomear para `.tmj` |
| `Image ... is not loadable` | Tilesets não estão no ZIP ou caminho errado | Verificar estrutura e caminhos (Passo 2) |
| `Archive is corrupted` | ZIP foi corrompido | Recriar o ZIP |

---

## Passo 6: Configurar Mapa como Padrão do Usuário

Após o upload bem-sucedido, configure qual usuário tem acesso a este mapa:

### No Painel Admin (Recomendado)

1. Acesse: `http://auth.workadventure.localhost/admin`
2. Vá em "Usuários" → Editar usuário
3. Campo: **Mapa Padrão (defaultMap)**
4. Selecione: `filial1`
5. Salve

### Ou Manualmente no Banco de Dados

```sql
UPDATE users
SET "defaultMap" = 'filial1'
WHERE email = 'usuario@example.com';
```

---

## Passo 7: Testar o Mapa

### Limpar Cache

1. Abra DevTools (F12)
2. Vá em "Application" ou "Armazenamento"
3. Clique "Clear Site Data"
4. Feche a aba

### Fazer Login

1. Acesse: `http://play.workadventure.localhost`
2. Clique "Login"
3. Insira credenciais:
   - **Email**: `admin@example.com`
   - **Senha**: `pwd`

### Verificar Resultado

Você deve ver:

✅ **URL do navegador muda para**: `http://play.workadventure.localhost/~/filial1.wam`

✅ **Mapa carrega sem erros 404**

✅ **Botão do Map Editor aparece** (canto inferior direito, parece 🔧)

---

## Passo 8: Editar o Mapa (Map Editor)

### Acessar Map Editor

1. Esteja dentro do mapa (URL `/~/filial1.wam`)
2. Procure pelo ícone do **Map Editor** (🔧) na interface
3. Clique para abrir

### Funcionalidades Disponíveis

- ✅ Adicionar/remover camadas
- ✅ Editar tiles
- ✅ Modificar propriedades de tiles
- ✅ Adicionar objetos interativos
- ✅ **Salvar automaticamente no map-storage**

### Quem Pode Editar?

Apenas usuários com **tags de admin/editor**:

```
Tags que permitem edição:
- admin
- editor
```

**Usuários sem estas tags**: Veem o mapa, mas NOT veem o botão de Map Editor.

---

## Passo 9: Adicionar Mais Mapas (Exemplo: filial2)

Repita os passos anteriores com o novo mapa:

```bash
# 1. Preparar
mkdir -p ~/Desktop/upload-mapa-2/assets
cp /caminho/para/filial2.tmj ~/Desktop/upload-mapa-2/
cp /caminho/para/filial2-assets/*.png ~/Desktop/upload-mapa-2/assets/

# 2. Corrigir caminhos se necessário
sed -i 's|"../assets/|"assets/|g' ~/Desktop/upload-mapa-2/filial2.tmj

# 3. Compactar
cd ~/Desktop/upload-mapa-2
zip -r ../filial2-completo.zip filial2.tmj assets/

# 4. Upload no map-storage (interface web)
# 5. Configurar para usuários (painel admin)
```

---

## Estrutura Completa de Arquivo TMJ

Para referência, um arquivo Tiled válido tem esta estrutura:

```json
{
  "compressionlevel": -1,
  "height": 17,
  "infinite": false,
  "layers": [
    {
      "data": [...],
      "height": 17,
      "id": 1,
      "name": "Camada Principal",
      "type": "tilelayer",
      "visible": true,
      "width": 31,
      "x": 0,
      "y": 0
    }
  ],
  "nextlayerid": 2,
  "nextobjectid": 1,
  "orientation": "orthogonal",
  "renderorder": "right-down",
  "tiledversion": "1.9.0",
  "tileheight": 32,
  "tilesets": [
    {
      "firstgid": 1,
      "source": "tileset1.json",
      // OU inline:
      "image": "assets/tileset1.png",
      "imageheight": 352,
      "imagewidth": 352,
      "margin": 0,
      "name": "tileset1",
      "spacing": 0,
      "tilecount": 121,
      "tileheight": 32,
      "tilewidth": 32
    }
  ],
  "tilewidth": 32,
  "type": "map",
  "version": "1.9.0"
}
```

---

## Troubleshooting

### ❌ Problema: "Cannot load map" (404 Not Found)

**Causa**: Mapa não foi salvo no map-storage

**Solução**:
1. Verifique o upload na UI do map-storage
2. Confirme que vê `✅ File successfully uploaded`
3. Teste URL diretamente: `curl http://map-storage.workadventure.localhost/filial1.wam`

### ❌ Problema: Map Editor não aparece

**Causa**: Usuário não tem tag `admin` ou `editor`

**Solução**:
1. Verifique tags do usuário no painel admin
2. Adicione tag `admin` ou `editor`
3. Faça logout e login novamente

### ❌ Problema: Imagens não carregam no mapa

**Causa**: Caminhos de tilesets incorretos

**Solução**:
1. Abra arquivo `.tmj` em editor de texto
2. Procure por `"image":`
3. Verifique que começa com `assets/` (não `../assets/`)
4. Recrie ZIP e refaça upload

### ❌ Problema: Mapa carrega mas está vazio

**Causa**: Tilesets faltando ou corrompidos

**Solução**:
1. Verifique que TODOS os tilesets estão na pasta `assets/`
2. Verifique que nenhum arquivo PNG está corrompido
3. Recrie o ZIP com cuidado

---

## Checklist de Upload

Use este checklist antes de fazer upload:

- [ ] Arquivo é `.tmj` (não `.json`)
- [ ] Arquivo contém `"tilelayer"` válido
- [ ] Todos os tilesets estão em `assets/`
- [ ] Caminhos usam `assets/` (não `../assets/`)
- [ ] ZIP contém: `filial1.tmj` + pasta `assets/`
- [ ] ZIP não contém `__MACOSX/` (remover se houver)
- [ ] Teste local: `unzip -l filial1-completo.zip | grep .png`
- [ ] Permissões corretas no map-storage (user: `john.doe`, pass: `password`)

---

## Referências

- **Documentação Tiled**: https://doc.mapeditor.org/
- **Map Editor WorkAdventure**: https://docs.workadventure.dev/admin/manage-maps/using-the-map-editor
- **Configuração de Mapas**: `CLAUDE.md` (seção Map Editor)
- **Sistema de Tags**: `DOCUMENTACAO_AUTENTICACAO.md`

---

## Próximas Etapas

Após fazer upload de um mapa:

1. ✅ Configurar `defaultMap` para usuários
2. ✅ Testar acesso ao Map Editor
3. ✅ Editar mapa conforme necessário
4. ✅ Documentar estrutura de seu mapa

Para adicionar **múltiplos mapas** (filial1, filial2, filial3, etc), repita os passos 1-6 para cada um!

---

**Última atualização**: Outubro 2025
**Versão**: 1.0
**Status**: ✅ Completo e Testado
