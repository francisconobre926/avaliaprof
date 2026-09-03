# Backend — GoHome API

API do GoHome.

## 🛠️ Stack

- **Runtime:** Node.js 20+
- **Linguagem:** TypeScript
- **Framework:** NestJS (com base em Express)
- **Base de dados:** A definir
- **ORM:** A definir (opções: Prisma, TypeORM, Drizzle)
- **Cache/filas:** A definir
- **Storage:** S3-compatible (AWS S3, Cloudflare R2, MinIO)
- **Chat tempo real:** Socket.io
- **Autenticação:** JWT + refresh tokens
- **Validação:** class-validator / Zod
- **Documentação API:** OpenAPI/Swagger

## 📋 Módulos previstos

Ver Secção 44 do DDR:

- Auth API
- Users/Profile API
- Listings API
- Search API
- Media upload API
- Favorites API
- Search Requests API
- Notifications API
- Payments API (M-Pesa)
- Unlock API
- Chat API (WebSocket + REST)
- Reservations API
- Reports/Moderation API
- Verification API
- Reviews API
- Referrals API
- Promotions API
- Admin API
- Analytics API

## 🔐 Segurança

Ver Secção 37 do DDR. Pontos críticos:
- HTTPS obrigatório
- Rate limiting em endpoints sensíveis
- Todas as operações financeiras server-side
- Nunca confiar em valores enviados pelo cliente

## 🚀 Setup (a definir)

> Instruções detalhadas serão adicionadas quando o projecto for iniciado.

## 📖 Referências

- [DDR completo](../docs/DDR_GoHome_1_1.docx)
- Modelo de dados: Secção 42
- Fluxo de pagamentos: Secção 45
- API módulos: Secção 44