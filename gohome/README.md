# GoHome

> Encontra o teu espaço.

**GoHome** é uma plataforma mobile-first (Android como prioridade) que conecta pessoas que procuram imóveis ou espaços com pessoas e organizações que têm algo para anunciar em Moçambique.

Produto da **[Let's Go Tech (LGT)](https://letsgotech.co.mz)**.

---

## 📖 Documentação

A especificação completa do produto está em [`docs/DDR_GoHome_1_1.docx`](docs/DDR_GoHome_1_1.docx).

Este DDR (Documento de Requisitos) é a **fonte única de verdade** para:
- Regras de negócio
- Fluxos de utilizador
- Modelo de monetização
- Sistema de design
- Estratégia de lançamento

Qualquer alteração ao produto deve ser reflectida numa nova versão do DDR.

---

## 🎯 Visão do produto

Plataforma nacional onde:
- **Anunciantes** (donos, agentes, imobiliárias) publicam imóveis pagando taxa de publicação (30 dias).
- **Procuradores** navegam gratuitamente e pagam 50 MT para desbloquear informação completa de um anúncio (contactos, GPS exacto, descrição completa, chat interno).
- **GoHome** funciona como intermediário — não é parte no negócio imobiliário.

### Modelo de negócio

| Fonte | Como funciona |
|---|---|
| Publicação | Anunciante paga conforme faixa de preço do imóvel |
| Desbloqueio | Procurador paga 50 MT por anúncio desbloqueado |
| Pesquisa | Grátis |
| Chat interno | Grátis (activado após desbloqueio) |

**Promoção de lançamento:** 50% de desconto em tudo durante os primeiros 3 meses em cada cidade.

---

## 🗺️ Estratégia de lançamento

1. **Fase 1 — Beira** (3 meses) — Foco em estudantes de UZ e institutos técnicos
2. **Fase 2 — Maputo** (mês 4-6) — UEM, UP-Maputo, ISCTEM
3. **Fase 3 — Nacional** (mês 7+) — Nampula, Tete, Nacala, etc.

---

## 🏗️ Estrutura do repositório

```
gohome/
├── docs/           # DDR e documentação do produto
├── design/         # Mockups, protótipos, assets visuais
├── mobile/         # App Android (Kotlin/Compose ou React Native)
├── backend/        # API (Node.js/TypeScript)
├── admin/          # Painel administrativo web
└── .github/        # Templates de issues e PRs
```

---

## 🎨 Identidade visual

**Tagline:** Encontra o teu espaço

**Paleta oficial:**
- Azul GoHome: `#2196F3`
- Verde GoHome: `#7CB342`
- Azul-escuro: `#1A2A44`

**Tipografia:** Poppins (alternativa: Inter)

Detalhes completos na Secção 2A e 55A do DDR.

---

## 🛠️ Stack tecnológica

- **Mobile:** React Native + Expo (Android prioritário, iOS na fase seguinte)
- **Backend:** Node.js + TypeScript + NestJS
- **Base de dados:** A definir
- **Cache/filas:** A definir
- **Storage:** S3-compatible
- **Chat tempo real:** WebSocket (Socket.io)
- **Mapas:** Google Maps SDK
- **Push:** Firebase Cloud Messaging
- **Pagamentos:** M-Pesa

---

## 🚀 Como começar

> ⚠️ Projecto em fase inicial. Ainda não há código para correr.

Próximos passos:
1. Prototipagem UI/UX no Claude Design (baseado nas Secções 27A e 55A do DDR)
2. Setup do backend inicial
3. Setup do projecto Android
4. Integração M-Pesa

---

## 👥 Equipa LGT

- **Fernando Camunga** — Fundador, Product & Development
- (Outros membros a adicionar)

---

## 📄 Licença

Proprietária — Let's Go Tech (LGT). Todos os direitos reservados.

---

## 🔒 Confidencialidade

Este repositório é **privado**. Todo o conteúdo (código, documentação, decisões de negócio, preços) é confidencial e pertence à Let's Go Tech.
