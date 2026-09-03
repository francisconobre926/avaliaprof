# Documentação — GoHome

## 📄 Documentos principais

### DDR (Documento de Requisitos)

- [`DDR_GoHome_1_1.docx`](DDR_GoHome_1_1.docx) — **Versão actual** (v1.1)

Este é o documento central do projecto. Contém:
- Visão e objectivos
- Identidade visual (paleta, tipografia, logo)
- Fluxos de utilizador (procurador e anunciante)
- Modelo de monetização e tabelas de preços
- Regras de negócio (chat, desbloqueio, avaliações, promoções)
- Arquitectura recomendada
- Modelo de dados
- Fluxos UI/UX para prototipagem
- Sistema de design detalhado
- Critérios de aceitação do MVP

**Antes de escrever código ou desenhar telas, ler o DDR.**

---

## 📋 Registo de decisões

Decisões importantes de produto que forem sendo tomadas ficam em [`decisions/`](decisions/).

Formato sugerido: `YYYY-MM-DD-titulo-curto.md`

Exemplo:
```
2026-09-03-sem-reembolso.md
2026-09-03-chat-apos-pagamento.md
```

---

## 🔄 Versionamento do DDR

| Versão | Data | Alterações principais |
|--------|------|----------------------|
| 1.0 | Set 2026 | Versão inicial com 60 secções |
| 1.1 | Set 2026 | Adicionado chat interno, promoção 50%, sistema de design, fluxos UI/UX, política de não-reembolso |

Sempre que houver alteração significativa de regras, criar nova versão do DDR (v1.2, v1.3, ...) — nunca sobrescrever a anterior.
