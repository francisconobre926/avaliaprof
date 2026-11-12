#!/usr/bin/env node
/**
 * Verifica o contraste WCAG AA dos pares texto/fundo da identidade visual.
 * Lê os valores diretamente de src/theme/colors.ts e src/store/themeStore.ts,
 * por isso falha sempre que uma alteração à paleta quebre a acessibilidade.
 *
 *   node scripts/verificar-contraste.mjs
 */
import { readFileSync } from 'node:fs';

const colors = readFileSync(new URL('../src/theme/colors.ts', import.meta.url), 'utf8');
const tema = readFileSync(new URL('../src/store/themeStore.ts', import.meta.url), 'utf8');

const paleta = {};
for (const m of colors.matchAll(/^\s{2}(\w+):\s*'(#[0-9A-Fa-f]{6})'/gm)) paleta[m[1]] = m[2];

function bloco(nome) {
  const ini = tema.indexOf(`export const ${nome}`);
  const fim = tema.indexOf('};', ini);
  const out = {};
  for (const m of tema.slice(ini, fim).matchAll(/^\s{2}(\w+):\s*(?:'(#[0-9A-Fa-f]{6})'|Paleta\.(\w+))/gm)) {
    out[m[1]] = m[2] || paleta[m[3]];
  }
  return out;
}
const claro = bloco('PALETA_CLARO');
const escuro = bloco('PALETA_ESCURO');

const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const razao = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const T = 4.5; // texto normal
const U = 3.0; // texto grande / componentes de UI
const pares = [
  // [descrição, frente, fundo, mínimo]
  ['claro · texto principal / fundo', claro.textoPrincipal, claro.fundo, T],
  ['claro · texto principal / card', claro.textoPrincipal, claro.fundoElevado, T],
  ['claro · secundário / fundo', claro.textoSecundario, claro.fundo, T],
  ['claro · secundário / fundoSuave', claro.textoSecundario, claro.fundoSuave, T],
  ['claro · terciário / fundo', claro.textoTerciario, claro.fundo, T],
  ['claro · terciário / fundoSuave', claro.textoTerciario, claro.fundoSuave, T],
  ['claro · azulTexto / fundo', paleta.azulTexto, claro.fundo, T],
  ['claro · azulTexto / azulSuave', paleta.azulTexto, paleta.azulSuave, T],
  ['claro · botão primário (preto / cornflower)', paleta.carvao, paleta.azul, T],
  ['claro · chip/avatar (preto / mist)', paleta.carvao, paleta.fundoSuave, T],
  ['claro · sucesso (texto) / fundo', claro.sucesso, claro.fundo, T],
  ['claro · sucesso / verdeSuave', claro.sucesso, paleta.verdeSuave, T],
  ['claro · botão sucesso (branco / sucesso)', '#FFFFFF', claro.sucesso, T],
  ['claro · erro / erroFundo', claro.erro, paleta.erroFundo, T],
  ['claro · erro / fundo', claro.erro, claro.fundo, T],
  ['claro · aviso / avisoFundo', claro.aviso, paleta.avisoFundo, T],
  ['claro · aviso / fundo', claro.aviso, claro.fundo, T],
  ['claro · contorno de campo / fundo (UI)', claro.bordaMedia, claro.fundo, U],
  ['claro · azulTexto (ícone/foco) / fundo (UI)', paleta.azulTexto, claro.fundo, U],
  ['claro · verde oficial (ícone) / card (UI)', paleta.verde, claro.fundoElevado, U],
  ['escuro · texto principal / fundo', escuro.textoPrincipal, escuro.fundo, T],
  ['escuro · texto principal / card', escuro.textoPrincipal, escuro.fundoElevado, T],
  ['escuro · secundário / fundoSuave', escuro.textoSecundario, escuro.fundoSuave, T],
  ['escuro · terciário / fundoSuave', escuro.textoTerciario, escuro.fundoSuave, T],
  ['escuro · azulClaro / card', paleta.azulClaro, escuro.fundoElevado, T],
  ['escuro · sucesso / card', escuro.sucesso, escuro.fundoElevado, T],
  ['escuro · erro / card', escuro.erro, escuro.fundoElevado, T],
  ['escuro · aviso / card', escuro.aviso, escuro.fundoElevado, T],
  ['escuro · contorno de campo / card (UI)', escuro.bordaMedia, escuro.fundoElevado, U],
];

let falhas = 0;
for (const [nome, a, b, min] of pares) {
  if (!a || !b) { console.log(`?    ${nome}  (valor em falta)`); falhas++; continue; }
  const r = razao(a, b);
  const ok = r >= min;
  if (!ok) falhas++;
  console.log(`${ok ? 'OK  ' : 'FALHA'} ${r.toFixed(2).padStart(5)}  (≥ ${min})  ${nome}`);
}
console.log(falhas ? `\n${falhas} par(es) abaixo do mínimo WCAG AA.` : '\nTodos os pares cumprem WCAG AA.');
process.exit(falhas ? 1 : 0);
