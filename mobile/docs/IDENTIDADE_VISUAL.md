# Identidade visual GoHome

Tokens centralizados em `src/theme/` (ponto único de importação: `src/theme/index.ts`).
Nunca definir cores, famílias ou pesos manualmente num ecrã.

## Tipografia — `src/theme/fonts.ts` · `src/theme/typography.ts`

| Família | Uso | Constantes `Fonte.*` |
|---|---|---|
| **Sora** | títulos de página, cabeçalhos de secção, preços, destaques (≥ 15 px) | `titulo` 500 · `tituloSemi` 600 · `tituloBold` 700 · `tituloExtra` 800 |
| **Manrope** | texto corrido, formulários, botões, navegação, labels, cards | `corpo` 400 · `corpoMedio` 500 · `corpoSemi` 600 · `corpoBold` 700 · `corpoExtra` 800 |

Regras: texto ≤ 13 px não passa de peso 600; tamanho mínimo 12 px (maiúsculas: 11 px);
Sora com letter-spacing ≥ -0,4; usar `Typography.*` (displayXL…caption, button*, preco*) em vez de
repetir tamanho/peso; nunca `fontWeight` nem outras famílias (em RN o peso escolhe-se pela família).

## Cores — `src/theme/colors.ts` (`Paleta` / `Colors`) · `src/store/themeStore.ts` (`useCores`)

| Token | Valor | Função |
|---|---|---|
| `azul` | `#1A73E8` | identidade, botões primários (texto branco), ícones, seleção |
| `gelo` | `#F8F9FA` | fundo principal |
| `verde` | `#34A853` | preenchimentos/ícones de estado positivo |
| `carvao` | `#202124` | títulos e texto principal |
| `azulSuave` `verdeSuave` | `#E8F0FE` `#E6F4EA` | superfícies de seleção / sucesso |
| `textoSecundario` · `borda` | `#5F6368` · `#DADCE0` | texto de apoio · divisores |
| `erro` · `erroFundo` | `#B3261E` · `#FCE8E6` | erros |

Derivados só por acessibilidade: `azulTexto #1557B0` (texto/links pequenos; o azul oficial dá 4,27:1 sobre o gelo),
`verdeTexto #137333` (texto e botões de sucesso; o verde oficial dá 2,9:1), `textoTerciario #686D72`,
`bordaForte #80868B` (contorno de campos, ≥ 3:1), `aviso #9A5400` / `avisoFundo #FEF7E0` (estado de atenção).

Em componentes: `useCores()` (respeita modo claro/escuro). Para texto azul usar `cores.principalTexto`;
para texto de sucesso `cores.sucesso`. Estados nunca dependem só da cor (texto ou ícone acompanham).

## Verificação

`npm run contraste` valida os pares texto/fundo (claro e escuro) contra WCAG AA e falha se algum regredir.
