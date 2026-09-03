# Contribuir para o GoHome

Bem-vindo à equipa! Este documento explica como trabalhamos.

## 📖 Antes de começar

**Lê primeiro o DDR:** [`docs/DDR_GoHome_1_1.docx`](docs/DDR_GoHome_1_1.docx).

É a fonte única de verdade para tudo relacionado com o produto: regras de negócio, preços, fluxos, sistema de design.

## 🌿 Fluxo de trabalho com branches

Usamos **Git Flow simplificado**:

- `main` — código estável, pronto para produção
- `develop` — código em desenvolvimento activo
- `feature/nome-da-feature` — nova funcionalidade
- `fix/nome-do-bug` — correcção de bug
- `docs/o-que-mudou` — apenas documentação

### Exemplo

```bash
# Criar nova feature
git checkout develop
git pull
git checkout -b feature/chat-interno

# Trabalhar, commitar
git add .
git commit -m "feat(chat): adicionar componente de mensagens"

# Push e criar PR contra develop
git push origin feature/chat-interno
```

## 📝 Convenção de commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` nova funcionalidade
- `fix:` correcção de bug
- `docs:` alterações à documentação
- `style:` formatação, sem impacto no código
- `refactor:` refactor sem alterar funcionalidade
- `test:` adição ou correcção de testes
- `chore:` manutenção (dependências, config)

### Exemplos

```
feat(auth): adicionar login com email
fix(chat): corrigir notificação push duplicada
docs(ddr): actualizar tabela de preços para v1.2
```

## 🔍 Code Review

- Todo PR precisa de **pelo menos 1 aprovação** antes de merge
- Testar localmente antes de aprovar
- Ser respeitoso e construtivo nos comentários
- Sugerir alternativas, não apenas apontar problemas

## 🎨 Alterações de UI

- Basear-se sempre no sistema de design (Secção 55A do DDR)
- Usar as cores oficiais (`#2196F3`, `#7CB342`, `#1A2A44`)
- Usar Poppins como fonte
- Grid base 8dp

## 💾 Alterações de regras de negócio

**IMPORTANTE:** Qualquer alteração ao produto que mude regras (preços, fluxos, permissões) precisa de:

1. Ser discutida com o Fernando
2. Ser reflectida no DDR (nova versão v1.2, v1.3, etc.)
3. Só depois pode ser implementada

Não inventar regras de negócio no código.

## 🔒 Confidencialidade

- Este repositório é **privado**
- Não partilhar código, screenshots ou documentos com terceiros
- Não subir chaves API, passwords ou dados sensíveis
- Usar `.env` para configurações locais (nunca commitar)

## ❓ Dúvidas

Contactar Fernando Camunga: fernilson258@gmail.com
