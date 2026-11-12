# Fase 1 — Análise, arquitectura e plano de implementação

Plataforma de avaliação de professores universitários (Android + iOS, base de código única).

---

## 1. Análise do projecto existente

O repositório `gohome` é um protótipo de **marketplace de imóveis** (Moçambique). Não contém nada do domínio "avaliação de professores", mas a **infraestrutura técnica é reaproveitável**.

### 1.1 Mobile (`mobile/`)
| Item | Estado |
|---|---|
| Expo ~57, React Native 0.86, React 19, Expo Router, TypeScript strict | Reutilizar |
| Zustand (stores), i18next (pt/en), tema claro/escuro (`src/theme`), componentes UI (`src/components/ui`) | Reutilizar |
| Camada `service/` com fallback local → API (`api.ts`, `config.ts`, `fallback.ts`, `recurso.ts`) | Reutilizar como base; **substituir fallback por SQLite + fila de sincronização** |
| Auth (login, registo, recuperar senha, foto) | Reutilizar telas; adaptar campos (nº estudante, curso) |
| `expo-secure-store`, `expo-image-picker`, `expo-image` | Já instalados |
| Mapas, carteira, pagamentos, chat, referência, OCR, calendário de reservas, `rn-emoji-keyboard`, `expo-location`, gradientes | **Fora do âmbito** — a remover (ver §6) |
| Dados mock (`src/data/*-mock.ts`) | **Contraria a regra "sem dados fictícios"** — a remover |
| Faltam: `expo-sqlite`, `expo-camera`, `expo-notifications`, `@react-native-community/netinfo` | A instalar |
| 41 erros `tsc` pré-existentes (tipos de `StatusBar`, `TextInput` refs, `ColorValue`) | Corrigir na Fase 2; não são regressões |

### 1.2 Backend (`backend/`)
NestJS 12 + Prisma 6 + PostgreSQL, JWT/Passport, throttler, class-validator, Swagger, audit log, módulos de notificações. 146 ficheiros em `src/`.

Módulos reaproveitáveis tal como estão: `auth`, `users`, `prisma`, `audit`, `notifications`, `reports` (denúncias), `analytics`, `common` (guards, decorators). Módulos de marketplace (`listings`, `unlocks`, `pricing`, `publications`, `promotions`, `referrals`, `chats`, `search-requests`, `verifications`, `payments`, `media` de vídeo) serão removidos ou reescritos.

### 1.3 Risco identificado
Existe trabalho local não relacionado com a nova direcção; a base foi tratada com um commit de snapshot (`94d0560`) antes de qualquer alteração.

---

## 2. Decisões de arquitectura (a validar)

| Tema | Decisão | Justificação |
|---|---|---|
| Navegação | **Expo Router** (já existente) com grupos `(auth)`, `(estudante)`, `(admin)` | Rotas protegidas por layout; deep link do QR Code vem de graça |
| Estado global | **Zustand** apenas para sessão, tema, conectividade e UI | Já presente; evita Redux/React Query em duplicado |
| Cache de dados | **SQLite é a fonte de verdade local**; ecrãs lêem de repositórios | Funcionamento offline real, sem segunda cache |
| Persistência local | `expo-sqlite` (dados), `expo-secure-store` (tokens), AsyncStorage só para preferências | Segurança dos tokens |
| Formulários | `react-hook-form` + `zod` (esquemas partilháveis com o backend) | Validação consistente e tipada |
| Gráficos | `react-native-svg` (já instalado), componentes próprios | Evita nova biblioteca de gráficos |
| HTTP | `axios` (já presente) com interceptors (token, refresh, `Idempotency-Key`) | Reuso |
| Conectividade | `@react-native-community/netinfo` | Requisito |
| QR / notificações / foto | `expo-camera`, `expo-notifications`, `expo-image-picker` | Requisito |
| Backend | Manter NestJS + Prisma + PostgreSQL | Já maduro, com segurança e Swagger |

### 2.1 Camadas (mobile)
```
app/            Rotas e ecrãs finos (só UI)
src/components/ Componentes reutilizáveis (ui/ + domínio)
src/features/   Um módulo por domínio: auth, professores, avaliacoes, estatisticas, admin, scanner
                  cada um: hooks/, schemas/ (zod), types.ts
src/data/
  db/           Abertura SQLite, migrações, esquema
  repositories/ Acesso SQLite (professores, disciplinas, avaliacoes, outbox)
  api/          Clientes REST tipados
  sync/         Motor de sincronização (outbox, pull, resolução de conflitos)
src/store/      Zustand: sessão, tema, rede
src/theme/      Tokens, tipografia (escala definida), cores claro/escuro
```
Regra: ecrãs → hooks da feature → repositório (SQLite) ← motor de sync ← API. Os ecrãs nunca chamam a API directamente.

### 2.2 Estrutura de pastas alvo
```
gohome/                (será renomeado no final da Fase 2 para avaliacao-professores)
├── backend/           NestJS + Prisma
├── mobile/            Expo
└── docs/
```

---

## 3. Modelo de dados (backend, Prisma)

Entidades novas: `Student` (extensão de `User`: nº estudante, curso), `Course` (curso), `Department`, `Teacher`, `Subject` (cadeira), `TeacherSubject` (professor↔cadeira), `Semester`, `EvaluationPeriod` (aberto/fechado por semestre), `Evaluation`, `EvaluationScore` (5 critérios) ou 5 colunas, `Comment`, `CommentReport`.

Papéis: `Role { STUDENT, ADMIN }` (substitui PROCURADOR/ANUNCIANTE).

Restrições-chave:
- `@@unique([studentId, teacherId, subjectId, semesterId])` em `Evaluation`.
- `clientId` (UUID gerado no dispositivo) `@unique` em `Evaluation` → idempotência da sincronização.
- `version` (inteiro) + `updatedAt` → detecção de conflitos.
- Médias calculadas no servidor (agregações SQL) sobre avaliações válidas; cache de agregados actualizado em transacção.

### 3.1 Anonimato (no backend)
- `studentId` nunca é serializado nas respostas públicas: DTOs de saída próprios (`PublicEvaluationDto`) sem qualquer identificador do autor.
- O próprio estudante obtém as suas avaliações por `GET /me/evaluations`.
- Comentários denunciados mostram ao admin o texto e o contexto, **não** a identidade do autor (apenas desanonimização auditada, se for exigida por regra institucional — decisão pendente).
- `clientId` não é exposto publicamente.

---

## 4. API REST (resumo)

| Área | Endpoints principais | Acesso |
|---|---|---|
| Auth | `POST /auth/register|login|logout|refresh|forgot|reset` | público |
| Perfil | `GET/PATCH /me`, `POST /me/photo` | estudante |
| Catálogo | `GET /teachers` (pesquisa, filtros, paginação), `GET /teachers/:id`, `GET /subjects` | autenticado |
| Avaliações | `POST/PATCH/DELETE /evaluations`, `GET /me/evaluations` | estudante |
| Comentários | `GET /teachers/:id/comments`, `POST /comments/:id/report` | autenticado |
| Estatísticas | `GET /stats/ranking`, `/stats/teachers/:id/criteria`, `/stats/teachers/:id/evolution` | autenticado |
| Sync | `GET /sync/pull?since=`, `POST /sync/push` (lote com `clientId`) | estudante |
| Admin | CRUD `/admin/teachers|subjects|assignments|periods`, `GET /admin/reports`, `PATCH /admin/comments/:id`, `GET /admin/stats` | `ADMIN` (RBAC por guard) |

Validação com `class-validator`; segredos apenas em `.env` (já ignorado pelo git).

---

## 5. Fluxos críticos

### 5.1 Avaliação offline e sincronização
1. Estudante submete → grava em `evaluations` (SQLite) com `syncState = pending` e entrada na `outbox` (operação `create|update|delete`, `clientId`, payload, tentativas).
2. NetInfo detecta ligação → motor de sync processa a outbox por ordem, marcando `syncing`.
3. `POST /sync/push` é idempotente por `clientId`; resposta por item: `applied | duplicate | conflict | rejected(motivo)`.
4. Só após `applied/duplicate` o estado passa a `synced`; falha → `error` com motivo, com *backoff* e reenvio manual.
5. Ao arrancar, itens `syncing` órfãos (app encerrada) regressam a `pending` — resistência a falhas.
6. `pull` incremental (`since` por tabela) actualiza professores, cadeiras, períodos e agregados.

**Conflitos:** edição local vs. servidor comparada por `version`; se divergir, o servidor ganha nos dados e o utilizador vê o estado "conflito" com opção de reaplicar a sua versão. Período fechado ⇒ `rejected: PERIOD_CLOSED`, mostrado ao estudante (a avaliação offline não é considerada válida).

### 5.2 Autenticação
Tokens em SecureStore, refresh automático, gate nos layouts `(estudante)` e `(admin)` (RBAC também no servidor).

### 5.3 QR Code
Formato `esquema://professor/<id>[?disciplina=<id>]` → Expo Router abre perfil ou formulário. Permissão da câmara com estado "negada" tratado (explicação + atalho para definições).

---

## 6. Renomeações efectuadas nesta fase (ficheiros e rotas)

Apenas **caminhos de ficheiros, rotas e imports**; os identificadores internos e o conteúdo (ainda de imóveis) serão reescritos nas fases seguintes. Verificação: `tsc` mantém os mesmos 41 erros pré-existentes.

| Antes | Depois |
|---|---|
| `app/(procurador)/` | `app/(estudante)/` |
| `app/(anunciante)/` | `app/(admin)/` |
| `(estudante)/pesquisar.tsx` | `(estudante)/professores.tsx` |
| `(estudante)/reservas.tsx` | `(estudante)/avaliacoes.tsx` |
| `(admin)/anuncios.tsx` | `(admin)/professores.tsx` |
| `(admin)/publicar.tsx` | `(admin)/gerir-professor.tsx` |
| `app/anuncio/` | `app/professor/` |
| `app/anuncio-detalhes/` | `app/professor-detalhes/` |
| `app/imovel/` | `app/disciplina/` |
| `app/reservar/` | `app/avaliar/` |
| `src/components/CardAnuncio.tsx` | `CardProfessor.tsx` |
| `src/components/CardImovel.tsx` | `CardDisciplina.tsx` |
| `service/anunciosService.ts` | `service/professoresService.ts` |
| `service/reservasService.ts` | `service/avaliacoesService.ts` |
| `src/store/anunciosLocal.tsx` | `src/store/professoresLocal.tsx` |
| `src/store/reservasStore.ts` | `src/store/avaliacoesStore.ts` |
| `src/utils/reservas.ts` | `src/utils/avaliacoes.ts` |

### 6.1 Ficheiros sem equivalente no novo domínio (remover na Fase 2)
`app/carteira.tsx`, `pagamento/`, `pagamento-publicacao.tsx`, `confirmacao-publicacao.tsx`, `referencia.tsx`, `chat/`, `mapa.tsx`, `denunciar/` (reaproveitar para denúncia de comentários), `(estudante)/mensagens.tsx`, `service/{carteira,referencia,conversas}Service.ts`, `store/{walletStore,referralStore}.ts`, `src/data/*-mock.ts`, `src/data/campos-categoria/`, `utils/{detectarContactos,verificarImagensOCR}.ts`, `components/{CalendarioReserva,FaixaPrecoSlider,ModalVerificacaoOCR,CampoDinamico}.tsx`, módulos de marketplace no backend.

---

## 7. Plano de implementação

| Fase | Entrega | Critério de conclusão |
|---|---|---|
| 2 | Limpeza do marketplace, correcção dos 41 erros `tsc`, tokens de tema/tipografia, componentes base, navegação (4 tabs + stacks), esqueleto dos ecrãs | App abre em Android/iOS sem erros, tema claro/escuro |
| 3 | Backend: `Role`, Student/Teacher/Subject/Course/Department; auth com campos novos; mobile: registo/login/perfil/foto; catálogo com pesquisa, filtros e paginação | Login real e listagem vinda da API |
| 4 | Avaliações: modelo, 5 critérios, comentário, unicidade, edição/remoção, médias no servidor, anonimização por DTO | Testes de regras 1–6 e 11 |
| 5 | SQLite, repositórios, outbox, NetInfo, motor de sync, idempotência, conflitos, indicadores de estado | Cenários: offline→online, app morta a meio, duplicado, período fechado |
| 6 | Rankings por curso, gráficos SVG, evolução por semestre; RBAC admin, CRUD, moderação, períodos | Estatísticas só com dados reais |
| 7 | QR Code, notificações locais fim de semestre, câmara/galeria, gestão de permissões | Fluxos com permissão negada |
| 8 | Testes (unitários, e2e, sync), perfil de desempenho em Android de gama baixa, acessibilidade | Checklist de regras de negócio 1–12 |

Dependências a adicionar: `expo-sqlite`, `expo-camera`, `expo-notifications`, `@react-native-community/netinfo`, `react-hook-form`, `zod`, `@hookform/resolvers`. A remover: `react-native-maps`, `expo-location`, `rn-emoji-keyboard`, `expo-linear-gradient`, `expo-blur` (se não usados).

---

## 8. Limitações e questões em aberto

1. **Identidade vs. moderação:** o admin pode ou não desanonimizar autores de comentários abusivos? Por defeito: não.
2. **Semestres:** formato (`2026/1`?) e quem os cria (admin).
3. **Verificação de estudante:** validação do nº de estudante contra lista da universidade ou apenas email institucional?
4. **Notificações locais** não chegam a quem não abrir a app; suficiente para o requisito (lembrete de fim de semestre), sem push remoto.
5. **Expo Go vs. development build:** `expo-camera`/`expo-notifications` funcionam em Expo Go, mas teste fiel de notificações exige *development build*.
6. **Docs do Expo 57:** `mobile/AGENTS.md` exige consultar a documentação versionada antes de escrever código; será feito em cada fase.
7. **Nome do projecto/pacote:** `gohome` / `gohome-prototipo` / scheme `gohome` serão renomeados na Fase 2 (afecta `app.json`, deep links, `package.json`).

---

## 9. Próxima fase
**Fase 2:** aprovar este plano → limpeza, sistema visual, navegação e esqueleto de ecrãs.
