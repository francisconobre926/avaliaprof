# MODELO DE NEGÓCIO — GoHome

**Versão:** 1.0
**Data:** Outubro 2026
**Empresa:** Let's Go Tech, Lda. (LGT)
**Mercado:** Moçambique
**Produto:** Aplicação móvel de classificados nacionais (imóveis, veículos, espaços, alojamento, equipamento, terrenos)

---

## 1. VISÃO E PROPOSTA DE VALOR

### 1.1. Visão

Tornar a GoHome a plataforma de referência em Moçambique para encontrar e anunciar imóveis, veículos, espaços e serviços relacionados, com um modelo seguro, transparente e acessível ao mercado moçambicano.

### 1.2. Proposta de valor

**Para procuradores:**
- Acesso a milhares de anúncios verificados em todo o país
- Pagamento mínimo apenas quando o anúncio interessa (modelo pay-per-contact)
- Visualização gratuita de fotos, descrição, localização aproximada e características
- Sistema anti-fraude com reporte de "já arrendado/vendido"
- Interface em Português Moçambicano e Inglês

**Para anunciantes:**
- Publicação simples e orientada por categoria
- Alcance nacional desde o primeiro anúncio
- Modelo transparente de visibilidade
- Reputação construída ao longo do tempo (ratings, avaliações)
- Zero intermediação em pagamentos imobiliários

---

## 2. REGRAS FUNDAMENTAIS DO NEGÓCIO

> Estas regras são **invioláveis**. Qualquer feature, campanha ou alteração deve respeitá-las.

### 2.1. ❌ NUNCA pagamentos de arrendamento/compra dentro da app

A GoHome **não processa** pagamentos relacionados com arrendamento, compra, reserva ou aluguer dos imóveis/veículos/espaços anunciados.

**Razão:** Garantir que o procurador vê o imóvel pessoalmente **antes** de qualquer transferência de dinheiro ao anunciante. Isto elimina o maior vector de fraude em classificados: pagar antecipadamente por um imóvel inexistente ou já ocupado.

**Pagamentos permitidos dentro da app:**
- Desbloqueio de contactos de um anúncio (25 MT com promoção, 50 MT normal)
- Publicação de anúncios pelos anunciantes
- Pacotes de destaque/visibilidade para anunciantes
- Recarga de crédito interno (opcional)

**Pagamentos proibidos:**
- Caução/entrada de arrendamento
- Preço do imóvel/veículo/espaço
- Reservas comerciais directas ao anunciante
- Qualquer valor com destino ao anunciante do imóvel

### 2.2. ❌ NUNCA reembolso em dinheiro físico

Quando um procurador tem direito a compensação (ex: imóvel já estava arrendado, anúncio falso confirmado pela moderação), **a compensação é SEMPRE em crédito interno**, nunca em transferência M-Pesa / eMola / bancária de volta.

**Como funciona:**
- Crédito interno é expresso em MT (ex: 25 MT de crédito)
- Só pode ser usado para desbloquear novos contactos de outros anúncios
- Não é levantável, não é transferível, não expira
- Visível na secção "Carteira" do perfil do utilizador

**Razão:**
1. Elimina a possibilidade de burla cruzada ("usuário fingido" + "anunciante cúmplice")
2. Mantém o valor dentro do ecosistema GoHome
3. Incentiva o procurador a continuar a usar a plataforma
4. Simplifica contabilidade e compliance

### 2.3. ✅ Verificação por WhatsApp — NÃO SMS

A verificação de identidade de utilizadores é feita por envio de código via **WhatsApp**, não SMS.

**Razões:**
- Custo zero (API WhatsApp Business gratuita até 1 000 conversas/mês)
- SMS em Moçambique tem custo elevado (~2-5 MT por mensagem)
- Taxa de entrega SMS é inferior ao WhatsApp em zonas rurais
- WhatsApp já é o canal #1 de comunicação em Moçambique
- Permite envio de ligação directa ao suporte

**Processo:**
1. Utilizador insere o número de telefone
2. GoHome envia código de 6 dígitos via WhatsApp Business API
3. Utilizador insere o código para validar
4. Validade do código: 10 minutos
5. 3 tentativas falhadas → bloqueio de 30 minutos

### 2.4. ❌ NÃO pedir BI nem NUIT

A GoHome **não exige** apresentação de Bilhete de Identidade (BI), NUIT, Passaporte ou Carta de Condução para criar conta ou publicar anúncios.

**Razões:**
- Barreira enorme de adopção em Moçambique (muitos utilizadores ainda não têm BI com fotografia)
- Risco legal e de privacidade de guardar documentos de identificação sem base legal clara
- Experiência de outros marketplaces (OLX, Jumia): pedir BI reduz publicações em >70%

**O que a GoHome usa como "verificação":**
- Número de telefone validado por WhatsApp
- Historial de anúncios + ratings de outros utilizadores
- Reportes da comunidade
- Opcional: carregar foto da chave do imóvel (prova simbólica de posse)

### 2.5. ✅ Documento sempre opcional

Qualquer campo de documento, foto de BI ou verificação adicional é **sempre opcional**. Nunca bloqueia a publicação ou uso da plataforma.

Anunciantes que optem por verificar-se ganham um badge de "Verificado" visível para procuradores, mas não é obrigatório para operar.

---

## 3. FLUXOS PRINCIPAIS

### 3.1. Fluxo Procurador (quem procura imóvel/veículo)

1. **Download e onboarding** — escolhe língua, cria conta via WhatsApp
2. **Pesquisa gratuita** — vê catálogo, filtra por categoria, zona, preço, características
3. **Vê anúncio** — fotos, descrição, bairro, cidade, características, preço, data
4. **Decide contactar** — clica em "Desbloquear contacto" → 25 MT (promoção -50%) ou 50 MT
5. **Paga via M-Pesa / eMola / crédito interno**
6. **Recebe contacto desbloqueado** — telefone 1, WhatsApp, morada completa
7. **Marca visita** com o anunciante (fora da app)
8. **Visita o imóvel presencialmente**
9. **Negoceia e paga directamente** ao anunciante (fora da app)
10. **(Opcional)** Avalia o anunciante na app após conclusão

### 3.2. Fluxo Anunciante (quem publica)

1. **Download e onboarding** — escolhe língua, cria conta via WhatsApp, selecciona papel "Anunciante"
2. **Publica anúncio** — escolhe categoria → preenche formulário dinâmico → carrega fotos → paga publicação
3. **Recebe pedidos de contacto** — procuradores que desbloquearam o anúncio
4. **Responde via WhatsApp ou chamada**
5. **Marca visitas**
6. **Fecha negócio directamente** (fora da app)
7. **Marca anúncio como "Já arrendado / Já vendido"** → ganha 25 MT crédito (se fechou via GoHome)
8. **(Opcional)** Avalia procuradores com quem interagiu

---

## 4. ESTRUTURA DE PREÇOS

### 4.1. Para procuradores

| Acção | Preço normal | Preço promoção -50% |
|-------|--------------|---------------------|
| Desbloquear contacto de 1 anúncio | 50 MT | **25 MT** |
| Chat com anunciante | Grátis (após desbloqueio) | — |
| Visualização de anúncios | Grátis | — |
| Favoritos | Grátis | — |
| Partilhar anúncio | Grátis | — |

### 4.2. Para anunciantes

| Serviço | Preço |
|---------|-------|
| Publicar anúncio simples | 100 MT (promoção lançamento) · 200 MT normal |
| Destaque "Topo da lista" (7 dias) | 150 MT |
| Destaque "Super anúncio" (fotos grandes + badge) | 250 MT |
| Renovação de anúncio expirado | 50 MT |
| Avaliações recebidas | Grátis |

### 4.3. Sistema de referência (10%)

Quando um utilizador partilha o link do seu perfil / anúncio / app e um novo utilizador se regista por esse link e **faz o primeiro pagamento**:

- O utilizador que partilhou recebe **10% do valor pago** em crédito interno
- Exemplo: novo utilizador paga 25 MT para desbloquear um contacto → quem partilhou recebe 2,5 MT em crédito
- O crédito pode ser usado para desbloquear novos contactos
- Não há limite de referências

### 4.4. Compensação por "já arrendado" (25 MT)

Se o procurador desbloqueia um contacto e, ao ligar, descobre que o imóvel **já estava arrendado/vendido**, pode reportar:

- A app notifica o anunciante
- O anunciante confirma dentro de 48h
- Se confirmar: procurador recebe **25 MT de crédito interno** + o anúncio é marcado como "fechado"
- Se não responder em 48h: moderação decide (crédito atribuído em caso de dúvida razoável)
- Se o anunciante rejeita e for provado falso: anunciante perde crédito e recebe penalização

**Importante:** o crédito atribuído **só é recuperado quando o fecho aconteceu via GoHome** (ou seja, o anunciante usou o nosso contacto). Se o imóvel foi fechado por outro canal antes do desbloqueio, não há compensação directa — apenas o anúncio é retirado.

---

## 5. FONTES DE RECEITA

| # | Fonte | Peso estimado (ano 1) |
|---|-------|------------------------|
| 1 | Desbloqueio de contactos (procuradores) | 65% |
| 2 | Publicação de anúncios (anunciantes) | 20% |
| 3 | Destaques/visibilidade (anunciantes premium) | 10% |
| 4 | Parcerias/anunciantes institucionais (imobiliárias) | 5% |

---

## 6. CUSTOS OPERACIONAIS PRINCIPAIS

- Infraestrutura cloud (servidor backend, base de dados, storage de imagens)
- WhatsApp Business API (acima do tier gratuito)
- Integração M-Pesa + eMola (taxa por transacção ~2%)
- Equipa de moderação (manual + automática)
- Marketing digital (Facebook Ads, Google Ads para Moçambique)
- Suporte ao cliente (WhatsApp Business)

---

## 7. KPIs CRÍTICOS

- **DAU/MAU** — utilizadores activos diários/mensais
- **Taxa de conversão** — procurador que desbloqueia / procurador que vê anúncio
- **Taxa de reporte** — "já arrendado" por 100 desbloqueios (meta: < 10%)
- **NPS** — pontuação de satisfação dos utilizadores
- **CAC** — custo de aquisição por utilizador pagante
- **LTV** — valor médio por utilizador ao longo da vida da conta
- **Churn mensal** — % de utilizadores que deixam de usar a app

---

## 8. CRESCIMENTO ESPERADO

**Ano 1 (2026-2027):** foco em Beira + Maputo + Nampula · 10 000 utilizadores · 2 000 anúncios activos
**Ano 2:** expansão para todas as capitais provinciais · 50 000 utilizadores
**Ano 3:** cobertura rural + lançamento de GoHome Business (plataforma para imobiliárias) · 200 000 utilizadores

---

**Documento mantido por:** Fernando Camunga (Fundador LGT) — fernilson258@gmail.com
**Última revisão:** 2026-10-24