# Identidade visual — AvaliaProf

Fonte única dos valores: `src/theme/colors.ts` (objeto `Paleta`) e `src/store/themeStore.ts` (modos claro/escuro).
Verificação de acessibilidade: `npm run contraste` (falha se algum par ficar abaixo de WCAG AA).

## Paleta

| Token | Hex | Papel | Uso |
|---|---|---|---|
| Canvas (`gelo`) | `#FBFBF8` | Fundo | Fundo da app |
| Mist (`fundoSuave`, `borda`) | `#DBE3E9` | Superfície | Cartões, bordas, inputs, chips |
| Cornflower (`azul`) | `#6AA6DA` | Primária | Botões, destaques, selecção; texto sobre ele é **preto** |
| Pear (`verdeSuave`, `avisoFundo`) | `#E1E5AC` | Acento | Badges, tags, alertas leves |
| Black (`carvao`) | `#000000` | Texto | Texto e títulos |

Derivados para acessibilidade: `azulTexto #245E92` (texto/ícones/foco azuis sobre claro, 6,5:1),
`verdeTexto #4A5510` e `aviso #6B5A00` (texto sobre Pear, ≥ 5:1), `textoSecundario #4A5560`,
`textoTerciario #58626C`, `bordaForte #6B7A87` (contorno de campos, ≥ 3:1), `erro #B3261E`.

Regras: Cornflower nunca leva texto branco (2,6:1) nem serve de texto/ícone sobre Canvas (2,5:1) —
usa-se `principalTexto` (= `azulTexto` no claro, Cornflower no escuro). Estados nunca dependem só da cor.

## Modo escuro
Fundo `#14171A`, elevado `#1C2024`, suave `#262B30`, texto `#F2F4F5`/`#A3ADB6`/`#9AA5AE`,
borda `#333A41`; Cornflower e Pear mantêm-se como acento e estado positivo/aviso.

## Tipografia
Sora (títulos, ≥ 15 px) + Manrope (texto e interface). Ver `src/theme/typography.ts`.
