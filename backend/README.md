# GoHome 1.1 — Backend

API REST + WebSocket do GoHome ("Encontra o teu espaço"), em NestJS, TypeScript e PostgreSQL.
Serve a app móvel (React Native + Expo) e o painel administrativo (Next.js).

> As regras de negócio estão no DDR v1.1. Se este README contradisser o DDR, vale o DDR.

## Requisitos

- Node.js 20 ou superior
- PostgreSQL (e o cliente `pg_dump`, para os backups)
- `ffmpeg` (inclui o `ffprobe`): usado para validar a duração máxima do vídeo dos anúncios
- Uma conta Cloudflare R2 (armazenamento de fotos e vídeos) e um projecto Firebase (push)

## Primeiros passos

```bash
cd backend
npm install
cp .env.example .env        # depois preenche os valores (ver abaixo)
npx prisma migrate deploy   # cria as tabelas
npx prisma generate
npm run start:dev
```

O servidor arranca em `http://localhost:3000`. Se faltar o `JWT_SECRET` ou o
`LOCATION_SECRET`, **recusa-se a arrancar**, de propósito.

## Variáveis de ambiente

O ficheiro `.env.example` lista todas, com comentários. As obrigatórias:

| Variável | Para quê | Como gerar |
|---|---|---|
| `DATABASE_URL` | Ligação ao PostgreSQL | A password não pode ter `@ : / ? #` |
| `JWT_SECRET` | Assina os tokens de sessão | `openssl rand -hex 32` |
| `LOCATION_SECRET` | Decide o deslocamento da localização aproximada | `openssl rand -hex 32` |

Opcionais ou por funcionalidade: `CORS_ORIGINS` (painel de admin), `SWAGGER_ENABLED`,
`R2_*` (upload de ficheiros) e `FIREBASE_CREDENTIALS_PATH` (push). Sem as credenciais do
Firebase o push fica desactivado, mas o resto funciona.

**Nunca** faças commit do `.env`, das chaves do R2 nem do ficheiro de credenciais do Firebase.

## Dados iniciais

```bash
# Preço geral de publicação (valor de exemplo, ajustável)
npx ts-node prisma/seed-pricing.ts

# Promover uma conta já registada a admin
npx ts-node prisma/seed-admin.ts email@exemplo.com
```

Os admins têm de concluir o 2FA (TOTP) para usar as rotas `/admin/*`.

## Documentação da API

- **Swagger interactivo:** `http://localhost:3000/docs` (só fora de produção, ou com
  `SWAGGER_ENABLED=true`). Carrega em *Authorize* e cola o token do login.
- **Contrato legível:** [`docs/api-contract.md`](../docs/api-contract.md): regras, limites e privacidade.
- **Especificação OpenAPI:** `http://localhost:3000/docs-json`.

## Estrutura

```
src/
├── main.ts, app.module.ts
├── config/        leitura dos segredos e variáveis (env.ts)
├── common/        guards, decorators, enums e utilitários partilhados
├── prisma/        acesso à base de dados
├── auth/ users/ categories/ listings/ media/ favorites/
├── unlocks/ payments/ chats/ notifications/
├── pricing/ publications/ promotions/ referrals/
├── search-requests/ reports/ reviews/ verifications/
├── analytics/ audit/
prisma/            schema, migrations e scripts de seed
```

Cada módulo segue controller (recebe e valida), service (regras de negócio) e DTOs.

## Pagamentos

Os pagamentos usam um **gateway simulado** (`MockPaymentGateway`). O M-Pesa real entra
implementando a interface `PaymentGateway` e trocando o provider nos módulos
`unlocks` e `publications`.

## Segurança, em resumo

- Segredos obrigatórios e `helmet` activo.
- CORS restrito às origens da lista `CORS_ORIGINS`.
- Limite de pedidos: 100 por minuto por IP; 5 por minuto no login, registo, 2FA e pagamentos.
- Email e telefone dos anunciantes só depois do desbloqueio; a localização exacta só para
  quem desbloqueou e para o dono.
- Preços e descontos são sempre calculados no servidor.

## Backups

```bash
# Backup manual (guarda em ~/gohome-backups)
../infrastructure/scripts/backup-db.sh

# Prova que o backup mais recente restaura, numa base temporária
../infrastructure/scripts/restore-test.sh
```

O agendamento diário (02:30) está em `infrastructure/systemd/`.

## Convenções

- Commits no formato Conventional Commits: `feat(listings): ...`, `fix(auth): ...`.
- Trabalho em `feature/*` ou `fix/*`, com PR para `develop`. Nunca `push --force` em `main` ou `develop`.
- Depois de cada `prisma migrate`, corre `npx prisma generate` e reinicia o servidor de TypeScript do editor.
- Não uses `prisma format` antes de uma migration: pode inventar relações.