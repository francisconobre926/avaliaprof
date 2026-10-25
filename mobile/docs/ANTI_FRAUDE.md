# ANTI-FRAUDE — GoHome

**Versão:** 1.0
**Data:** Outubro 2026
**Classificação:** Interno — Equipa LGT

Este documento identifica os principais vectores de fraude em marketplaces de classificados em Moçambique e descreve as mitigações da GoHome.

---

## PRINCÍPIO ZERO

> **A GoHome nunca intermedia pagamentos entre procurador e anunciante no acto de arrendamento, compra ou reserva do bem anunciado.**
>
> O procurador tem obrigatoriamente de ver o imóvel/veículo/espaço antes de qualquer transferência de valor. A plataforma só cobra pela **ligação** (desbloqueio de contacto), nunca pelo **negócio**.

Este princípio por si só elimina ~80% dos esquemas de fraude observados em plataformas concorrentes.

---

## 10 VULNERABILIDADES IDENTIFICADAS E MITIGAÇÕES

### V1 — Anúncio falso (imóvel inexistente)

**Risco:** Anunciante publica fotos retiradas da Internet de um imóvel que não existe ou que não é dele, só para receber dinheiro de desbloqueios.

**Mitigação:**
- Detector de imagens duplicadas (comparação com fotos já publicadas na app + hash perceptual)
- Rating público do anunciante (procuradores avaliam após visita)
- Botão "Reportar anúncio falso" visível em todos os anúncios
- Depois de 3 reportes confirmados → anúncio removido + anunciante suspenso
- Opcional: carregar "foto da chave" como prova simbólica de posse (sem documento oficial)

### V2 — Imóvel já arrendado (anunciante não actualiza)

**Risco:** Anunciante fecha negócio mas mantém o anúncio activo para continuar a receber desbloqueios.

**Mitigação:**
- Botão "Já estava arrendado?" dentro do anúncio desbloqueado
- Procurador reporta → anunciante tem 48h para confirmar
- Confirmação → procurador recebe 25 MT crédito interno (nunca dinheiro)
- Após 3 reportes confirmados de "já arrendado", o anúncio expira automaticamente

### V3 — Falsas visitas (anunciante cobra para mostrar)

**Risco:** Anunciante ou "testa-de-ferro" cobra ao procurador para "poder ver o imóvel".

**Mitigação:**
- Aviso explícito no ecrã de desbloqueio: *"Nenhum valor adicional deve ser pedido para visitar. Se te pedirem, reporta."*
- Secção dedicada em FAQ: "Pagamentos permitidos vs proibidos"
- Reportar botão: "Pediu-me dinheiro para visitar"
- Confirmação → anunciante é suspenso imediatamente, pendente de investigação

### V4 — Phishing / contactos falsificados

**Risco:** Terceiros copiam dados de anúncios populares e publicam versões clonadas com contactos próprios.

**Mitigação:**
- Validação do número por WhatsApp (código de 6 dígitos) antes de poder publicar
- Rate-limit: máximo 3 anúncios novos por utilizador por dia
- Detector de títulos+descrições duplicadas (fuzzy match)
- Rating e historial visíveis ao procurador antes do desbloqueio

### V5 — Reembolso cruzado (lavagem com utilizador fake)

**Risco:** Burlão cria conta fake como "procurador", desbloqueia o seu próprio anúncio, exige reembolso em dinheiro.

**Mitigação:**
- **A GoHome nunca reembolsa em dinheiro — só crédito interno não transferível.**
- Crédito só pode ser usado para desbloquear outros contactos
- Detecção de padrões: mesma identidade de dispositivo, mesmo IP, mesmo número M-Pesa a desbloquear anúncios do mesmo utilizador → bloqueio automático
- Limite diário de reportes de "já arrendado" por procurador (máx 3)

### V6 — Partilha abusiva de contactos

**Risco:** Procurador desbloqueia 1 contacto e partilha com 10 amigos via WhatsApp, matando a monetização.

**Mitigação:**
- Marca de água visível no contacto desbloqueado (watermark com o nome do procurador que desbloqueou)
- Rastreabilidade: se o anunciante for contactado por alguém que não desbloqueou, pode reportar
- Educação: "O contacto é só para ti. Se partilhares, o anunciante pode reportar."
- Incentivo: sistema de referência (10% de volta) para quem partilha o **link do anúncio** em vez do contacto

### V7 — Esquemas de arrendamento internacional ("investidor estrangeiro")

**Risco:** Burlão diz que vive no estrangeiro, pede caução via transferência bancária internacional sem o procurador poder ver o imóvel.

**Mitigação:**
- Aviso explícito no desbloqueio: *"Nunca pagues caução/arrendamento antes de visitar o imóvel pessoalmente. Qualquer anunciante que te peça isso é fraude."*
- Detector de palavras-chave em descrições: "diaspora", "estrangeiro", "transferência internacional", "Western Union" → flag para moderação manual
- Página de FAQ dedicada a este esquema (traduzida para PT-MZ e EN)

### V8 — Preço irrealmente baixo (isca)

**Risco:** Anúncio com preço 50% abaixo do mercado para capturar desbloqueios massivos. Quando o procurador liga, o imóvel "já foi" mas há "outro parecido" por 3x o preço.

**Mitigação:**
- Alerta no anúncio quando o preço está mais de 40% abaixo da mediana da zona + categoria
- Procurador vê badge: "Preço significativamente abaixo do mercado — confirma antes de desbloquear"
- Métrica de conversão (desbloqueios vs visitas confirmadas) por anunciante — queda anormal activa review

### V9 — Impersonação de anunciante real

**Risco:** Burlão cria conta usando nome e foto de uma imobiliária conhecida e publica anúncios falsos.

**Mitigação:**
- Verificação opcional para imobiliárias e profissionais (badge "Oficial")
- Procurador vê sempre: data de criação da conta + número de anúncios publicados + rating
- Página de denúncia para empresas verem contas que usam o seu nome

### V10 — Chat/mensagens com conteúdo malicioso ou fora da app

**Risco:** Burlão usa o chat da app para enviar links de phishing ou direccionar o procurador para pagamentos fora.

**Mitigação:**
- Detector de regex no chat: links suspeitos, pedidos de M-Pesa fora do contexto, menções a transferências bancárias
- Bloqueio automático de links a websites não aprovados
- Avisos pop-up: "Esta mensagem contém um link externo. Não partilhes dados pessoais."
- Botão "Reportar mensagem" em cada bolha de chat

---

## MATRIZ DE RISCO

| Vector | Probabilidade | Impacto | Prioridade |
|--------|---------------|---------|------------|
| V1 — Anúncio falso | Alta | Alto | 🔴 Crítica |
| V2 — Já arrendado não actualizado | Alta | Médio | 🟠 Alta |
| V3 — Cobrança de visita | Média | Alto | 🟠 Alta |
| V4 — Clonagem de anúncios | Média | Médio | 🟡 Média |
| V5 — Reembolso cruzado | Baixa | Alto | 🟠 Alta |
| V6 — Partilha abusiva | Alta | Baixo | 🟡 Média |
| V7 — Esquemas internacionais | Baixa | Muito Alto | 🟠 Alta |
| V8 — Preço isca | Média | Médio | 🟡 Média |
| V9 — Impersonação | Baixa | Alto | 🟡 Média |
| V10 — Chat malicioso | Média | Médio | 🟡 Média |

---

## MECANISMOS GERAIS DE DEFESA

### A. Validação na origem

- Número de telefone validado via WhatsApp (código 6 dígitos)
- Limite de anúncios por utilizador novo nos primeiros 7 dias
- Rate limit em desbloqueios por conta (máx 20/dia) e por IP

### B. Reputação

- Rating público após cada visita confirmada
- Historial de contas visível (data de criação, anúncios publicados, rating médio)
- Badge "Verificado" para quem opta por verificação adicional

### C. Moderação

- Fila de moderação automática (ML + heurísticas)
- Equipa humana para casos reportados
- SLA de resposta: 48h para reportes normais, 24h para fraude confirmada

### D. Educação do utilizador

- FAQ sobre esquemas comuns (traduzida PT-MZ e EN)
- Avisos contextuais no momento do desbloqueio
- Notificações push após desbloqueio com dicas de segurança

### E. Políticas financeiras

- **Nunca** reembolso em dinheiro — só crédito interno
- **Nunca** intermediação de pagamentos de arrendamento/compra
- Pagamentos à GoHome apenas por M-Pesa, eMola ou crédito interno (rastreáveis)

---

## RESPOSTA A INCIDENTES

### Nível 1 — Reporte isolado
→ Guardar em fila de moderação. Investigar em 48h.

### Nível 2 — 3+ reportes contra mesmo utilizador
→ Suspender conta imediatamente. Investigar em 24h. Notificar utilizador.

### Nível 3 — Fraude confirmada
→ Banir conta permanentemente. Devolver crédito aos procuradores lesados. Notificar via WhatsApp. Em casos graves, cooperar com autoridades (PRM, INATIC).

### Nível 4 — Ataque sistémico (múltiplas contas coordenadas)
→ Bloqueio por IP/dispositivo. Suspensão de novos registos da região. Comunicado público. Investigação forense.

---

**Documento mantido por:** Fernando Camunga (Fundador LGT)
**Equipa anti-fraude:** [a definir]
**Última revisão:** 2026-10-24