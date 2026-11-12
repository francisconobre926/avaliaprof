# AvaliaProf — Funcionalidades e regras por perfil

Documento de referência para o desenvolvimento do mobile, do backend e do painel administrativo.
Fonte das regras: definição funcional do projecto (estudante, docente, administrador).
Estado actual comparado com o código em `mobile/` e `backend/` (fim da Fase 3).

> **Convenção deste documento.** As secções 1–3 comparam o que existe com o que foi definido.
> A secção 4 lista conflitos e lacunas das próprias regras; **nada foi decidido por conta
> própria**: cada ponto tem uma recomendação e fica à espera de validação (secção 9).
> Tudo o que não vem da definição funcional está marcado como **[Proposta]** e justificado.

---

## 1. Estado actual face à definição

### 1.1 O que já está implementado (preservar)

| Módulo | Estado |
|---|---|
| Autenticação do estudante (registo, login, recuperação, sessão persistente) | Feito (API + mobile) |
| Perfil: editar nome/curso, fotografia por câmara/galeria | Feito |
| Catálogo: listar/pesquisar docentes, filtros curso/departamento/cadeira, paginação, detalhe | Feito |
| Médias reais por docente (a partir de avaliações; hoje 0 avaliações) | Feito (cálculo geral) |
| Tema claro/escuro, i18n pt/en, navegação por 4 separadores | Feito |
| RBAC: guard de papéis (`RolesGuard`) e papel lido da base de dados em cada pedido | Feito (infra), só com `STUDENT`/`ADMIN` |

### 1.2 O que existe só em esquema (sem lógica)

`Semester` (`label`, `isOpen`) e `Evaluation` (5 critérios, `clientId`, unicidade aluno+docente+cadeira+semestre, `version`) existem na base de dados, mas não há endpoints nem ecrãs.

### 1.3 O que falta, por área

| Área | Falta |
|---|---|
| **Papéis** | Papel `TEACHER`; estado de conta (pendente/activa/suspensa); ligação conta ↔ ficha de docente |
| **Estrutura académica** | Universidade, faculdade/departamento como hierarquia, ano académico, ano/semestre da cadeira, cadeira em vários cursos |
| **Inscrição do estudante** | Selecção das cadeiras frequentadas (`StudentSubject`) e consulta das suas cadeiras |
| **Períodos** | Período com datas, cursos e cadeiras abrangidos (hoje só `Semester.isOpen`) |
| **Avaliação** | Todo o fluxo: submeter, editar, apagar, listar as próprias, médias por critério, evolução, distribuição |
| **Anonimato** | DTOs públicos sem autor; regra de amostra mínima (ver C-6) |
| **Comentários** | Entidade própria com estado, moderação automática, denúncia, resposta do docente |
| **Docente** | Convite/activação, área própria, estatísticas, "Meu QR Code", respostas |
| **QR Code** | Geração (docente/admin), scanner, deep link, verificação de elegibilidade |
| **Offline** | SQLite, fila (outbox), sincronização, estados, conflitos |
| **Administração** | Todos os módulos (utilizadores, académico, períodos, moderação, denúncias, estatísticas) e auditoria |
| **Serviços** | Envio de email (recuperação de senha e convite de docente) — hoje o código vai para o log do servidor |

---

## 2. Perfis e permissões

### 2.1 Matriz (RBAC aplicado no backend)

Legenda: **S** = sim · **N** = não · **P** = apenas o próprio / apenas dentro da condição indicada.

| Funcionalidade | Estudante | Docente | Admin | Condição aplicada no servidor |
|---|---|---|---|---|
| Consultar docentes / pesquisar / filtrar | S | S | S | Autenticado e conta activa |
| Consultar cadeiras | S | S | S | Estudante vê as do seu curso (ver 3.2) |
| Avaliar docentes | S | N | N | Ver regras R-1 a R-6 |
| Editar / apagar própria avaliação | P | N | N | Período aberto para essa cadeira |
| Consultar próprias avaliações | P | N | N | Só as suas |
| Consultar médias | S | S | S | Sujeito à regra de amostra mínima (C-6) |
| Consultar comentários publicados | S | S | S | Só estado `PUBLISHED`, sem autor |
| Denunciar comentários | S | S | S | Um por utilizador e comentário |
| Responder a comentários | N | P | N | Só comentários sobre si; resposta passa pelo mesmo filtro |
| Gerar QR Code | N | P | S | Docente só o seu; admin qualquer docente |
| Gerir docentes / estudantes | N | N | S | |
| Gerir cursos / cadeiras / estrutura | N | N | S | |
| Gerir períodos de avaliação | N | N | S | |
| Moderar comentários / denúncias | N | N | S | Nunca edita texto (ver C-9) |
| Estatísticas gerais | N | N | S | Dados reais |
| Estatísticas do próprio perfil | N | P | S | Docente vê só as suas |

### 2.2 Regras de negócio consolidadas

| # | Regra | Origem |
|---|---|---|
| R-1 | Só estudantes autenticados, com conta activa, avaliam | Reg. gerais 1 |
| R-2 | Uma avaliação por estudante + docente + cadeira + semestre (garantida por restrição única na base de dados) | 1.4, 2 |
| R-3 | O estudante só avalia se tiver a cadeira seleccionada no seu perfil **e** o docente estiver associado a essa cadeira | 1.2 |
| R-4 | Só se avalia, edita ou apaga com o período aberto para essa cadeira/curso (hora do servidor) | 1.4, 3.3 |
| R-5 | Docentes e administradores nunca avaliam | Matriz |
| R-6 | A avaliação numérica é independente do comentário e da sua moderação | 1.4, Reg. gerais 11 |
| R-7 | Médias calculadas só no servidor, sobre avaliações válidas | 1.4 |
| R-8 | O autor nunca é exposto a outros utilizadores, incluindo docentes e admins | 1.5 |
| R-9 | Comentários só são públicos no estado `PUBLISHED` | 1.7 |
| R-10 | Uma denúncia nunca remove automaticamente | 3.5 |
| R-11 | O docente não altera médias, avaliações nem comentários; só responde e denuncia | 2.5 |
| R-12 | Contas de docente só são criadas ou autorizadas pelo admin; registo livre só para estudantes | 2, Reg. gerais 5 |
| R-13 | O QR Code identifica e encaminha; não substitui autenticação nem R-1 a R-4 | 1.6 |
| R-14 | Avaliações offline sincronizam sem duplicação (`clientId` idempotente) | 1.8 |
| R-15 | Conta suspensa perde acesso imediatamente (verificado em cada pedido, não só no token) | 2.1 |

---

## 3. Fluxos por perfil

### 3.1 Estudante

**Registo e primeira utilização**
1. Regista-se (nome, nº de estudante, curso, email, senha) → sessão iniciada.
2. Selecciona as cadeiras que frequentou neste semestre (só as do seu curso e período).
3. Vê o Início com professores e as suas cadeiras.

**Avaliar (caminho normal)**
1. Professores → perfil do docente → "Avaliar" → escolhe uma das **suas** cadeiras leccionadas por esse docente.
2. O servidor verifica R-1 a R-4. Se falhar, o ecrã explica o motivo (período fechado, já avaliou, cadeira não seleccionada).
3. Preenche 5 critérios (1–5) e comentário opcional → submete.
4. Resposta: avaliação guardada; comentário `PUBLISHED`, `BLOCKED` (com motivo e pedido de reformulação) ou `PENDING_REVIEW`.

**Avaliar via QR Code**
1. Abre o scanner → lê o QR do docente → perfil do docente.
2. Vê as cadeiras desse docente que **pode** avaliar; escolhe uma → formulário (passos 2–4 acima).

**Avaliar offline**
1. Sem rede, o formulário valida localmente e guarda a avaliação como `Pendente` (SQLite + outbox).
2. Com rede, sincroniza automaticamente (`A sincronizar` → `Sincronizado` ou `Erro`).
3. O servidor decide a validade na sincronização (ver C-7): pode rejeitar por período fechado ou comentário bloqueado, e a app mostra o motivo.

**Gerir as próprias avaliações**: Perfil → "As minhas avaliações" → editar ou apagar (período aberto). Editar o comentário volta a passar pela moderação.

### 3.2 Docente

1. **Activação:** recebe convite do admin → define senha → conta `Activa`. Antes disso está `Pendente`; suspensa não entra.
2. **Início:** média geral, número de avaliações, evolução por semestre, média por critério, distribuição 1–5.
3. **Comentários:** lê comentários publicados, responde publicamente (identificado como docente), ou denuncia.
4. **Meu QR Code:** ver, descarregar como imagem, partilhar, imprimir.
5. **Perfil:** edita apenas campos permitidos (fotografia e dados profissionais não administrativos).

### 3.3 Administrador

1. **Estrutura académica:** faculdades/departamentos → cursos → anos académicos → semestres → cadeiras → associação cadeira↔curso (ano/semestre) → docente↔cadeira.
2. **Utilizadores:** consulta estudantes e docentes; cria docente e envia convite; suspende/reactiva.
3. **Períodos:** cria período (datas, cursos, cadeiras), abre/encerra, consulta avaliações submetidas (sem identidade do autor).
4. **Moderação:** fila de comentários `PENDING_REVIEW`, denunciados e bloqueados; aprova, mantém oculto ou remove; tudo com histórico.
5. **Estatísticas gerais** e auditoria.

---

## 4. Conflitos, lacunas e ajustes propostos

Cada ponto indica o problema, o impacto e a recomendação. Os que precisam de decisão estão
repetidos na secção 9.

**C-1 — Docente: conta vs. ficha.** Hoje `Teacher` é uma ficha do catálogo sem conta. A definição exige conta própria, criada/autorizada pelo admin.
→ **[Proposta]** `Teacher` passa a ter `userId` opcional e único. O admin pode cadastrar a ficha sem conta (docente que ainda não aderiu) e criar a conta depois; a conta liga à ficha. Papel `TEACHER` no `Role`. Estado da conta em `User.status` (`PENDING | ACTIVE | SUSPENDED`). Um utilizador tem um único papel (docente não é também estudante; ver C-5).

**C-2 — Hierarquia académica incompleta.** A definição tem Universidade → Faculdade/Departamento → Curso → Ano académico → Semestre → Cadeira. O esquema actual tem `Department`, `Course`, `Subject` (ligada a um só curso) e `Semester` (só rótulo).
→ **[Proposta]**
- `AcademicYear` (ex.: 2026) e `Semester` passa a pertencer-lhe (1.º/2.º semestre) com datas.
- `Subject` deixa de ter `courseId` fixo; nova `CourseSubject` (curso, cadeira, ano do curso, semestre) — uma cadeira pode existir em vários cursos.
- `Faculty` acima de `Department` só se justifica se a universidade tiver várias faculdades. A definição escreve "Faculdade/Departamento": tratar como **um único nível** (`Department`) e acrescentar `Faculty` apenas se for pedido. "Universidade" é uma só: configuração, não tabela.

**C-3 — Inscrição do estudante não existe.** Sem `StudentSubject`, R-3 não é aplicável.
→ **[Proposta]** `StudentSubject (studentId, courseSubjectId, semesterId)`. O servidor só aceita cadeiras do curso do estudante e do semestre actual. A arquitectura fica pronta para importação futura do sistema da universidade (mesma tabela, outra origem).

**C-4 — Período vs. semestre.** `Semester.isOpen` não expressa datas, cursos e cadeiras abrangidos, nem "abrir/encerrar" com histórico.
→ **[Proposta]** Nova `EvaluationPeriod` (semestre, abre em, fecha em, estado, âmbito por curso e/ou cadeira). `isOpen` sai de `Semester`. Aberto = estado `OPEN` **e** hora do servidor dentro das datas. Ao ser encerrado manualmente, as edições e remoções também ficam bloqueadas (R-4).

**C-5 — «O docente não pode avaliar a si próprio» é redundante.** A matriz já proíbe docentes de avaliar (R-5), e um utilizador tem um só papel. A regra só voltaria a ser necessária se um docente pudesse ter também conta de estudante.
→ Manter R-5 e acrescentar uma validação defensiva: se no futuro existir ligação conta↔docente num estudante, a avaliação do próprio docente é recusada.

**C-6 — O anonimato pode ser quebrado por amostras pequenas.** Se uma cadeira tem 1 avaliação, a «média» e o comentário revelam o autor aos colegas e ao docente. A definição não cobre isto, mas o objectivo de «nunca expor a identidade» exige tratá-lo.
→ **[Proposta]** (a) Médias e distribuição por cadeira/semestre só são mostradas a partir de **N avaliações** (sugestão N = 5; configurável); abaixo disso aparece «Avaliações insuficientes para mostrar». (b) Comentários mostram só o semestre, nunca data e hora exactas. (c) Nenhum endpoint devolve o `studentId`, nem ao admin. A média geral continua a contar todas as avaliações; apenas a *apresentação* é limitada.

**C-7 — Período fechado vs. avaliação feita offline.** «O backend deverá impedir submissões fora do período, mesmo offline» pode significar duas coisas: (A) vale a hora a que o estudante avaliou; (B) vale a hora a que chega ao servidor. A hora do telemóvel não é fiável (pode ser alterada).
→ **Recomendação: (B)**. O servidor decide com a sua hora; se o período já fechou, rejeita com `PERIOD_CLOSED` e a app mostra «O período fechou antes de sincronizares». Para amortecer o efeito, a app avisa quando um período está a poucas horas de fechar e há avaliações pendentes. A alternativa (A) exigiria confiar no relógio do cliente.

**C-8 — Comentário bloqueado: o que acontece à avaliação?** R-6 diz que são independentes; a definição diz que um comentário ofensivo é bloqueado e o estudante reformula.
→ **[Proposta]** A avaliação numérica é gravada **sempre** que for válida. O comentário tem estado próprio (`PUBLISHED`, `BLOCKED`, `PENDING_REVIEW`, `HIDDEN`, `REMOVED`). Se bloqueado, a resposta devolve a avaliação gravada e o motivo do bloqueio; o estudante pode reenviar o comentário reformulado (edição). Offline, o bloqueio só é conhecido após sincronizar: o estado local passa a «sincronizado, comentário não publicado» com o motivo.

**C-9 — «Admin não altera o texto sem registo».** Qualquer edição de texto de terceiros é arriscada e ambígua.
→ **[Proposta]** O admin **nunca edita** o texto: só aprova, mantém oculto ou remove. Cada decisão fica em `ModerationEvent` (quem, quando, decisão, motivo), imutável. Isto cumpre a regra com menos superfície.

**C-10 — «Registar acessos administrativos sensíveis» vs. «admin sem acesso à identidade».** Se nenhum endpoint expõe o autor, não há acesso sensível a auditar sobre isso.
→ **[Proposta]** Auditar: ações de moderação, suspensões, criação de convites, abertura/fecho de períodos, alterações académicas. Desanonimização **não existe** no MVP. Se a universidade a exigir (ex.: ameaça grave), é uma decisão institucional a definir com procedimento próprio.

**C-11 — Resposta pública do docente não passa por moderação. [Decidido: fica livre por agora (D-6); rever antes de uso real.]** A definição filtra comentários dos estudantes, mas uma resposta ofensiva ou que tente identificar o autor («sei quem foste») quebra o anonimato e a confiança.
→ **[Proposta]** As respostas passam pelo **mesmo filtro** automático (insultos, dados pessoais, ameaças) e podem ser denunciadas. Uma resposta por comentário. Justificação: sem isto, o canal anónimo fica exposto a retaliação.

**C-12 — Convite de docente exige email.** Não há serviço de email (a recuperação de senha escreve o código no log do servidor).
→ **[Proposta]** Isolar o envio atrás de uma interface (`MailService`). Para o MVP: o convite gera um código de activação de uso único que o admin vê e entrega ao docente; o envio por email entra quando houver fornecedor. Não bloqueia as outras funcionalidades.

**C-13 — QR Code e deep link.** Um link com esquema próprio (`avaliaprof://`) não faz nada se a app não estiver instalada, e usar o ID interno (UUID) do docente prende o QR à base de dados.
→ **[Proposta]** QR com URL `avaliaprof://professor/<codigoPublico>`, onde `codigoPublico` é um código estável e opaco do docente (não o ID interno), gerado uma vez e nunca alterado. Quem digitalizar sem a app vê só um link inerte. Links universais (https) exigem domínio próprio: ficam como evolução. O código só identifica; a elegibilidade é sempre revalidada no servidor (R-13).

**C-14 — Painel administrativo: onde vive?** A definição fala em «painel próprio». O plano anterior previa o grupo `(admin)` na mesma app Expo.
→ Ver decisão D-1.

**C-15 — Moderação por regras configuráveis, em português.** Sem IA, depende de listas de termos e padrões.
→ **[Proposta]** Tabela `ModerationRule` (tipo, padrão, acção, activa) editável pelo admin, mais detecção fixa de emails, telefones, URLs e repetição. Listas iniciais em português (incl. variantes de Moçambique) a rever com a universidade. A distinção «crítica legítima» vs. «ataque pessoal» não é resolvível só por palavras: regra prática = bloquear termos ofensivos e ataques dirigidos à pessoa («és…», «o professor é um…»), deixar passar adjectivos sobre a prática profissional («explica mal»); em caso de dúvida → `PENDING_REVIEW`. Haverá falsos positivos e negativos; por isso a fila de revisão e a denúncia existem.

**C-16 — Perfis e navegação.** Docente e admin precisam de ecrãs diferentes do estudante.
→ Roteamento por papel após login: `(estudante)`, `(docente)`, `(admin)`. O servidor continua a ser a autoridade; esconder opções na interface não é segurança.

---

## 5. Modelo de dados proposto (alterações ao esquema actual)

| Entidade | Acção | Campos principais |
|---|---|---|
| `User` | Alterar | `role` += `TEACHER`; `status` (`PENDING/ACTIVE/SUSPENDED`); `activationCodeHash`, `activationExpires` |
| `Teacher` | Alterar | `userId?` único; `publicCode` único e opaco |
| `AcademicYear` | Novo | `label`, datas |
| `Semester` | Alterar | `academicYearId`, `number` (1/2), datas; remove `isOpen` |
| `CourseSubject` | Novo | `courseId`, `subjectId`, `courseYear`, `semesterNumber` |
| `Subject` | Alterar | deixa de ter `courseId` |
| `StudentSubject` | Novo | `studentId`, `courseSubjectId`, `semesterId` |
| `EvaluationPeriod` | Novo | `semesterId`, `opensAt`, `closesAt`, `status`, âmbito (cursos/cadeiras) |
| `Evaluation` | Alterar | passa a ligar a `courseSubjectId` e `periodId`; mantém `clientId`, unicidade e `version`; **sem** comentário |
| `Comment` | Novo | `evaluationId` (1:1, privado), `text`, `status`, `blockReason`, `publishedAt` |
| `CommentReply` | Novo | `commentId` (1:1), `teacherId`, `text`, `status` |
| `CommentReport` | Novo | `commentId`, `reporterId`, `reason`, `status` |
| `ModerationEvent` | Novo | `commentId` ou `replyId`, `actorId`, `decision`, `reason`, data (imutável) |
| `ModerationRule` | Novo | `kind`, `pattern`, `action`, `active` |
| `AuditLog` | Novo | `actorId`, `action`, `entity`, `entityId`, data |

O vínculo `Comment → Evaluation → studentId` existe só na base de dados; nenhuma resposta da API o serializa (C-6, R-8).

---

## 6. API: endpoints a acrescentar por perfil

| Perfil | Área | Endpoints (resumo) |
|---|---|---|
| Estudante | Inscrição | `GET /me/subjects`, `PUT /me/subjects` |
| Estudante | Avaliações | `POST /evaluations` (idempotente por `clientId`), `PATCH/DELETE /evaluations/:id`, `GET /me/evaluations`, `GET /teachers/:id/eligibility` |
| Todos | Leitura | `GET /teachers/:id/stats`, `GET /teachers/:id/comments`, `POST /comments/:id/report` |
| Docente | Área própria | `GET /teacher/me/stats`, `GET /teacher/me/qr`, `POST /comments/:id/reply` |
| Todos | Activação | `POST /auth/activate` (docente, com código de convite) |
| Admin | Utilizadores | CRUD `/admin/teachers`, `/admin/students`, `PATCH /admin/users/:id/status`, `POST /admin/teachers/:id/invite` |
| Admin | Académico | CRUD `/admin/{departments,courses,academic-years,semesters,subjects,course-subjects,assignments}` |
| Admin | Períodos | CRUD `/admin/periods`, `POST /admin/periods/:id/open|close` |
| Admin | Moderação | `GET /admin/moderation/queue`, `POST /admin/comments/:id/{approve,hide,remove}`, `GET /admin/reports`, `GET /admin/rules` |
| Admin | Estatísticas | `GET /admin/stats` |
| Sync | Offline | `GET /sync/pull?since=`, `POST /sync/push` |

Todas as rotas `/admin/*` usam `JwtAuthGuard` + `RolesGuard` com `@Roles(ADMIN)`; as de docente usam `@Roles(TEACHER)` e verificam que o recurso pertence ao docente autenticado.

---

## 7. Impacto no plano de implementação

A inscrição e os períodos são pré-requisito para avaliar (R-3, R-4), por isso a ordem muda. Já concluídas: Fases 1, 2, 3, 3B e 4 (denúncias de comentários passam para a Fase 6, junto da moderação).

| Fase | Conteúdo | Critério de conclusão |
|---|---|---|
| **3B** ✅ | Papel `TEACHER`, estado de conta, hierarquia académica (C-2), inscrição do estudante (C-3), períodos (C-4); mobile: «As minhas cadeiras» | Estudante selecciona as suas cadeiras; só vê as do seu curso |
| **4** ✅ | Avaliações (R-1 a R-7), comentário separado (C-8), moderação automática (C-15), médias com amostra mínima (C-6), «As minhas avaliações» | Testes das regras R-1 a R-9; anonimato verificado nas respostas |
| **5** | SQLite, outbox, NetInfo, sync, conflitos, estados; política C-7 | Offline→online, app encerrada a meio, duplicado, período fechado |
| **6** | Área do docente (estatísticas, respostas, QR, activação por convite) e painel admin (utilizadores, académico, períodos, moderação, denúncias, estatísticas, auditoria) | Matriz de permissões testada com os três papéis |
| **7** | Scanner QR, deep link, notificações locais, permissões | Fluxo QR completo com permissão negada |
| **8** | Testes, desempenho, acessibilidade | Checklist R-1 a R-15 |

Reaproveitado sem refazer: autenticação, perfil, catálogo, tema, componentes de UI, camada de serviços e infra de RBAC.

---

## 8. Dependências e limitações conhecidas

- **Email**: sem fornecedor, o convite e a recuperação de senha dependem de código visível (C-12).
- **Notificações locais** não chegam a quem não abre a app (sem push remoto) — suficiente para o lembrete de fim de semestre.
- **Expo Go vs. development build**: o scanner QR e as notificações funcionam em Expo Go, mas um teste fiel das notificações exige development build.
- **Moderação por regras** é imperfeita por natureza (C-15); precisa de revisão humana e de afinação com a universidade.
- **Importação do sistema académico** fica fora do MVP; a inscrição manual usa a mesma estrutura.
- **Sessão**: o token actual dura 7 dias sem revogação; a suspensão de conta já é efectiva em cada pedido (R-15), mas falta refresh token.

---

## 9. Decisões pendentes

| # | Pergunta | Recomendação |
|---|---|---|
| D-1 | O painel de admin é web separado ou ecrãs dentro da app Expo? | **Decidido: dentro da app** (grupo `(admin)`); um só código, mesma API |
| D-2 | Período fechado e avaliação offline: vale a hora do servidor (B) ou a hora do estudante (A)? | **Decidido: hora do servidor (B)**, ver C-7 |
| D-3 | Amostra mínima para mostrar médias por cadeira: valor de N? | **Decidido: N = 5**, configurável (C-6) |
| D-4 | Faculdade é um nível separado de Departamento? A universidade tem várias faculdades? | Um só nível (`Department`) até haver necessidade |
| D-5 | O comentário bloqueado impede a avaliação ou só o comentário? | **Decidido: só o comentário** (C-8) |
| D-6 | As respostas do docente passam pela moderação automática? | **Decidido: não, por agora** (C-11). Mantém-se a denúncia; risco de retaliação aceite para o MVP |
| D-7 | Existe desanonimização em caso de ameaça grave? | Não no MVP (C-10); exige decisão institucional |
| D-8 | Formato do nº de estudante e validação contra lista da universidade? | Manter 6–10 dígitos no cliente, validação por lista só se a universidade a fornecer |
| D-9 | Convite de docente: email real ou código entregue pelo admin no MVP? | Código no MVP (C-12) |
| D-10 | Uma cadeira pode pertencer a vários cursos? | Sim (C-2) |

D-1, D-2, D-3, D-5 e D-6 estão decididas; a Fase 3B arrancou. Restam em aberto D-4, D-7, D-8, D-9 e D-10 (aplicam-se as recomendações até haver indicação contrária).

---

## 10. Revisão: cadastro de estudantes, turmas e matrícula

Esta secção **altera** a secção 1.2 (o estudante já **não** selecciona as suas cadeiras) e acrescenta a organização
académica pedida a seguir à Fase 4. O que está aqui descrito está implementado, excepto onde se diz o contrário.

### 10.1 Hierarquia e entidades

`Curso → Ano curricular → Semestre → Turma → Estudantes`.

| Entidade | Papel |
|---|---|
| `ClassGroup` (turma) | Pertence a um curso, ano curricular e semestre **concreto** (ex.: 2026/2). Nome único dentro dessa combinação. |
| `Enrollment` (matrícula) | Estudante ↔ turma, num semestre. Estado `ACTIVE`/`INACTIVE`. Única por estudante e semestre. |
| `StudentSubject` | Cadeiras do estudante no semestre. Origem `AUTO` (derivada da turma) ou `MANUAL` (acrescentada pelo admin, ex.: cadeira em atraso). |
| `User` | `password` passou a opcional: estudante cadastrado pelo admin tem conta `PENDING` até activar. |

As cadeiras ligam-se ao curso, ano e semestre através de `CourseSubject` (já existia). As cadeiras `AUTO` de um estudante
são todas as do **curso, ano e semestre (1.º/2.º)** da sua turma; mudar de turma recalcula-as e preserva as `MANUAL`.

### 10.2 Quem faz o quê

| Acção | Admin | Docente | Estudante |
|---|---|---|---|
| Cadastrar, editar estudantes; activar/desactivar matrícula | **Sim** | Não | Não |
| Criar e apagar turmas; associar estudante a turma e cadeiras | **Sim** | Não | Não |
| Consultar as próprias cadeiras e docentes | n/a | n/a | Sim (só leitura) |

Aplicado no servidor: todas as rotas `/admin/*` exigem `JwtAuthGuard` + `@Roles(ADMIN)`.

### 10.3 Endpoints (todos `ADMIN`, excepto `/me/subjects`)

| Endpoint | Função |
|---|---|
| `GET /admin/academic-options` | Cursos (com anos curriculares existentes), semestres e turmas, para formulários |
| `GET/POST /admin/students` | Listar (pesquisa por nome/número/email; filtros curso, turma, estado; paginação) e cadastrar |
| `GET/PATCH /admin/students/:id` | Detalhe (com cadeiras) e actualização (dados pessoais e/ou turma) |
| `PATCH /admin/students/:id/enrollment` | Activar/desactivar a matrícula |
| `GET /admin/students/:id/available-subjects` | Cadeiras do curso ainda não associadas |
| `POST/DELETE /admin/students/:id/subjects[/:courseSubjectId]` | Associar/remover cadeira manualmente |
| `GET/POST /admin/class-groups`, `PATCH/DELETE /admin/class-groups/:id` | Gerir turmas (só se apaga uma turma sem estudantes) |
| `GET /admin/class-groups/:id` | Turma com a lista dos seus estudantes |
| `GET /admin/class-groups/:id/candidates` | Estudantes que se podem adicionar: **mesmo curso, matrícula activa**, noutra turma (pesquisa e paginação) |
| `POST /admin/class-groups/:id/students` | Passa um ou vários estudantes para a turma. Tudo ou nada: se algum não cumprir as regras (outro curso, matrícula inactiva ou inexistente) nenhum é movido. As cadeiras AUTO ajustam-se ao ano da nova turma |
| `GET /me/subjects` (estudante) | As suas cadeiras e docentes; vazio sem matrícula activa |

Removidos: `PUT /me/subjects` e `GET /me/subjects/available` (o estudante deixou de escolher). Não existem endpoints de importação.

### 10.3b Que docentes vê o estudante

O estudante **só vê os docentes que lhe dão aulas**: os das cadeiras da sua matrícula activa no semestre corrente. Isto substitui o
«Consultar todos os docentes disponíveis» da secção 1.3 e aplica-se no servidor a:

- a lista de docentes (pesquisa, filtros e paginação só dentro deste âmbito) e as opções dos filtros (o seu curso, as suas cadeiras, os departamentos dos seus docentes);
- o perfil de um docente, as suas estatísticas e os seus comentários (para um docente fora do âmbito a resposta é 404, para não revelar que existe);
- sem matrícula activa (inexistente ou inactiva) a lista é vazia.

Docentes e administradores continuam a ver o catálogo completo.

**Excepção deliberada (descoberta de docentes populares):** o **Início** (destaques) e as **Estatísticas** (ranking, médias por critério, evolução,
distribuição, com filtros de curso, cadeira e semestre) mostram **todos os docentes**, sem restrição de âmbito, para qualquer estudante conhecer os mais
bem avaliados. Para isso funcionar, o perfil, as estatísticas e os comentários de um docente **com avaliações suficientes (MIN_SAMPLE, por defeito 5)**
são visíveis a qualquer estudante, mesmo que não lhe dê aulas. Docentes com poucas avaliações continuam a dar 404 a quem não lhes assiste. A **lista de
professores** continua restrita aos docentes das cadeiras do estudante, e **avaliar** continua a exigir matrícula activa, a cadeira e o período aberto.
Tudo o que é agregado respeita a amostra mínima: abaixo dela mostra-se só a contagem.

### 10.4 Regras de integridade

- **Sem duplicados:** email e número de estudante únicos (409 com código `EMAIL_EXISTENTE`/`NUMERO_EXISTENTE`).
- **Consistência:** a turma tem de coincidir com o curso, ano e semestre indicados (400 `TURMA_INCONSISTENTE`); só se cria turma num ano em que o curso tem cadeiras.
- **Matrícula e avaliação:** para avaliar o estudante precisa de matrícula **activa** no semestre corrente (`NAO_MATRICULADO`, `MATRICULA_INACTIVA` → 403), além das regras R-1 a R-6.
- **Sem lista global:** o estudante só vê as cadeiras da sua matrícula; sem matrícula não vê nenhuma.

### 10.5 Activação da conta

O cadastro do admin cria uma conta `PENDING` sem senha. O estudante activa-a no ecrã de registo da app com o **mesmo email e número**: o servidor
define a senha e passa a conta a `ACTIVE`, mantendo curso e matrícula do cadastro. Email e número que existam mas não coincidam com um cadastro pendente dão 409.

### 10.6 Importação de ficheiros (preparada, não funcional)

O ecrã «Importar estudantes» (CSV, Excel, XML) só permite escolher o ficheiro e mostrar nome, formato e tamanho. **Não lê, processa, envia nem guarda
o ficheiro e não regista estudantes**; a pré-visualização mostra apenas as colunas esperadas e o botão «Importar» está desactivado. Para a fase seguinte
fica por fazer: endpoint de importação, validação linha a linha, relatório de erros e a pré-visualização real.

### 10.7 Sessões de avaliação por QR Code (**implementado**, ver 10.9)

O pedido descreve sessões criadas pelo docente e QR Codes de sessão. Isto difere da definição inicial (QR permanente por docente e períodos geridos pelo admin) e
fica para a fase do QR, depois de decididos os pontos abaixo. Proposta:

- `EvaluationSession` (docente, cadeira, turma, janela, estado, `qrToken` opaco) criada pelo docente **dentro** de um período aberto pelo admin.
- Ao ler o QR o servidor verifica, por esta ordem: sessão existe e está activa; utilizador autenticado; matrícula activa; inscrito na cadeira; ainda não participou. O QR sozinho nunca autoriza.
- **Anonimato:** a elegibilidade e o conteúdo ficam separados: `SessionParticipation (sessionId, studentId)` regista *quem* participou; a avaliação guarda a nota e o comentário
  **sem** ligação ao estudante. Tem um custo: sem essa ligação o estudante não consegue editar nem apagar a sua avaliação, nem vê-la em «As minhas avaliações».

### 10.8 Decisões pendentes desta revisão

| # | Pergunta | Recomendação |
|---|---|---|
| D-11 | Fechar o registo aberto? Hoje qualquer pessoa cria conta de estudante (sem matrícula, logo sem cadeiras). | Passar a exigir cadastro prévio pelo admin: quem não constar no cadastro não pode registar-se |
| D-12 | Sessões por QR substituem ou complementam o QR permanente do docente e os períodos? | Complementam: o período continua a delimitar, a sessão restringe a uma aula/turma |
| D-13 | Separar a avaliação do estudante (anonimato forte) ou manter a ligação para editar/apagar? | Manter a ligação protegida (hoje), que cumpre editar/apagar e as regras R-2 e R-8; separar só se a universidade exigir anonimato total |
| D-14 | Matrícula inactiva: mantém as cadeiras guardadas? | Sim (reactivar restaura), como está |

### 10.9 Decisões D-11 a D-14 (aplicadas) e fases QR / 5 / 6

| # | Decisão | Efeito |
|---|---|---|
| D-11 | Registo livre **fechado** | `POST /auth/register` só aceita `{studentNumber, email, password}` e activa uma conta já cadastrada pelo admin (`PENDING`). Sem cadastro: 403 `NAO_CADASTRADO`; conta já activa: 409 `CONTA_EXISTENTE`. Nenhuma conta é criada por esta rota. |
| D-12 | Sessões **complementam** QR permanente e períodos | O período do admin continua a delimitar; a sessão (docente, cadeira, turma opcional, janela de 5–240 min) só existe com período aberto. |
| D-13 | Mantém-se a ligação protegida avaliação↔estudante | Permite editar/apagar e «As minhas avaliações»; nenhuma resposta da API a expõe (admin e docente também não a veem). |
| D-14 | Matrícula inactiva mantém as cadeiras | Reactivar restaura. |

**QR Code.** Dois formatos: `avaliaprof://qr/professor/<publicCode>` (permanente, código opaco) e `avaliaprof://qr/sessao/<token>`.
O QR só identifica; `GET /qr/teacher/:code` e `GET /qr/session/:token` (só STUDENT) validam no servidor, por esta ordem: sessão activa e dentro da janela
(`SESSAO_ENCERRADA`/`SESSAO_EXPIRADA`) → matrícula activa → turma (`FORA_DA_TURMA`) → inscrição na cadeira (`NAO_INSCRITO`) → já avaliou / período fechado.
A avaliação em si segue as regras normais; a sessão não a substitui.

**Fase 5 (offline).** `POST /sync/evaluations` recebe até 50 operações (`create` idempotente por `clientId`, `update` com `version`, `delete`) e devolve um resultado por operação
(`OK`, `DUPLICATE`, `REJECTED`, `CONFLICT`). O período é decidido pela hora do **servidor**; uma operação rejeitada não bloqueia as restantes.

**Fase 6.** Docente (`/teacher/me/*`): estatísticas próprias (amostra mínima), comentários publicados com resposta moderada, sessões QR. Activação por convite do admin
(`POST /admin/teachers/:id/invite` devolve um código de 8 caracteres, mostrado uma vez, válido 7 dias; `POST /auth/activate-teacher`).
Admin: períodos, semestre corrente, estrutura académica, utilizadores (suspender/reactivar), moderação de comentários (sem autor), denúncias
(`POST /comments/:id/report`), estatísticas gerais e registo de auditoria. Testes: `backend/test/smoke-phase6.sh`.

### 10.10 Nome das turmas

O nome da turma é **gerado pelo servidor**: `<curso><ano>Lab<semestre><L|P>`. Exemplo: `Info4Lab2L` = Informática, 4.º ano, 2.º semestre, laboral (`P` = pós-laboral).
Cada curso tem uma abreviatura (`Course.code`: Info, Gest, Econ, Dir) e cada turma um regime (`LABORAL` ou `POS_LABORAL`); só pode existir uma turma por curso, ano, semestre e regime.
A criação recebe `{courseId, courseYear, semesterId, regime}` e a turma não se renomeia à mão.

### 10.11 Notificações dentro da app (Fase 7)

`GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/:id/read`, `POST /notifications/read-all` (qualquer utilizador autenticado; só vê as suas).
O servidor cria-as; o corpo é genérico e `data.screen` só indica o destino, nunca dados de terceiros.

| Tipo | Quem recebe | Quando |
|---|---|---|
| `COMMENT_BLOCKED` / `COMMENT_PENDING` | autor do comentário | a moderação não o publicou / enviou para revisão |
| `COMMENT_PUBLISHED` / `COMMENT_HIDDEN` / `COMMENT_REMOVED` | autor do comentário | o admin muda o estado |
| `TEACHER_REPLY` | autor do comentário | o docente responde |
| `REPORT_REVIEWED` | quem denunciou | o admin resolve ou dispensa a denúncia |
| `PERIOD_OPEN` | estudantes com matrícula activa no âmbito | o período abre (tarefa de 10 em 10 min e ao criar/alterar um período) |
| `PERIOD_CLOSING` | estudantes do âmbito com docentes por avaliar | faltam menos de 24 h para fechar |
| `TEACHER_STATS_READY` | docente | atinge a amostra mínima pela primeira vez |

O docente **não** é avisado de cada comentário novo, para não revelar *quando* alguém avaliou. Cada aviso de período sai uma só vez (`openedNotifiedAt`, `closingNotifiedAt`).
A tarefa periódica pode desligar-se com `NOTIFICATIONS_JOB=false`. Push (Expo) e email ficam para depois. Testes: `backend/test/smoke-notifications.sh`.

### 10.12 Autenticação reforçada

- **Bloqueio por conta:** 5 logins falhados seguidos bloqueiam a conta 15 minutos (429 `CONTA_BLOQUEADA`); um login certo repõe o contador. Email inexistente continua a dar 401 sem pistas.
- **Códigos com limite:** 5 códigos errados de recuperação ou de convite invalidam o código (é preciso pedir outro).
- **Sessão:** token de acesso curto (30 min, `ACCESS_TOKEN_TTL`) com a versão da conta + token de renovação rotativo (30 dias, guardado só como hash).
  `POST /auth/refresh` troca-o por um par novo; reutilizar um token já usado revoga a sessão toda (suspeita de roubo).
  `POST /auth/logout` revoga o deste dispositivo; `POST /auth/logout-all` e a mudança de senha invalidam também os tokens de acesso já emitidos (`tokenVersion`).
- **App:** guarda os dois tokens em SecureStore e renova sozinha, com uma só renovação de cada vez; sem rede mantém a sessão.
- **Auditoria:** as acções do admin sobre estudantes, matrículas e turmas passam a ficar registadas (sem dados pessoais), além das do painel.
Testes: `backend/test/smoke-auth.sh`.

### 10.13 Perfil e Fase 8

- **Perfil (três papéis):** cabeçalho com fotografia, grupos Conta / Académico ou Administração / Definições / Sessão. Terminar sessão pede confirmação (e avisa das avaliações por enviar);
  existe «Terminar em todos os dispositivos». `POST /me/password` muda a senha (exige a actual), termina as outras sessões e devolve tokens novos.
- **Campos protegidos:** `PATCH /me` já não aceita `courseId` (o curso vem do cadastro). O nome do docente é o da ficha (403 `NOME_DO_DOCENTE`); a fotografia do docente é a do perfil público.
- **Acessibilidade:** botões, chips, cartões, modais, avisos e o ecrã Aparência têm papel, rótulo e estado para leitores de ecrã; contraste WCAG AA (`npm run contraste`).
- **Desempenho:** índices para as consultas por estudante/semestre, cadeira/semestre, período, matrícula e âmbito.
- **Testes:** backend `npx jest` (moderação, regras de períodos, nome das turmas) e `test/smoke-*.sh`; mobile `npm test` (QR, datas, validação).
