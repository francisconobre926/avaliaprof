import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interpretarQr } from '../src/utils/qr';
import { deIso, paraIso } from '../src/utils/datas';
import { normalizar, temErros, validarEmail, validarNome, validarNumeroEstudante, validarObrigatorio, validarSenha } from '../src/utils/validacao';

test('QR do docente', () => {
  assert.deepEqual(interpretarQr('avaliaprof://qr/professor/cmabc123def456ghi789'), { tipo: 'professor', valor: 'cmabc123def456ghi789' });
});
test('QR de sessão, com espaços e barra final', () => {
  assert.deepEqual(interpretarQr('  avaliaprof://qr/sessao/tok_en-1234567890/ \n'), { tipo: 'sessao', valor: 'tok_en-1234567890' });
});
test('QR que não é da AvaliaProf é ignorado', () => {
  for (const q of ['https://exemplo.com', 'avaliaprof://professor/abcdefghijkl', 'avaliaprof://qr/outro/abcdefghijkl', 'avaliaprof://qr/sessao/curto', 'avaliaprof://qr/sessao/abc def ghi jkl', '', 'avaliaprof://qr/professor/abcdefghijkl/../admin']) {
    assert.equal(interpretarQr(q), null, q);
  }
});
test('QR com código demasiado longo é recusado', () => {
  assert.equal(interpretarQr('avaliaprof://qr/professor/' + 'a'.repeat(41)), null);
});

test('datas: texto local para ISO e volta', () => {
  const iso = paraIso('2026-11-12 08:30');
  assert.ok(iso);
  assert.equal(deIso(iso!), '2026-11-12 08:30');
  assert.equal(deIso(paraIso('2026-11-12')!), '2026-11-12 00:00');
});
test('datas inválidas dão null', () => {
  for (const t of ['12/11/2026', '2026-13-01 10:00', '2026-02-30 10:00', 'amanhã', '']) assert.equal(paraIso(t), null, t);
});

test('validação da senha: mínimo 8, com letras e números', () => {
  assert.ok(validarSenha('abc123'));
  assert.ok(validarSenha('abcdefgh'));
  assert.ok(validarSenha('12345678'));
  assert.equal(validarSenha('senha1234'), undefined);
});
test('validação de email, nome e número de estudante', () => {
  assert.equal(validarEmail(' aluno@uni.ac.mz '), undefined);
  assert.ok(validarEmail('aluno@uni'));
  assert.ok(validarNome(' A '));
  assert.equal(validarNome('Ana Silva'), undefined);
  assert.equal(validarNumeroEstudante('20260001'), undefined);
  assert.ok(validarNumeroEstudante('abc'));
});
test('obrigatório, temErros e normalizar', () => {
  assert.equal(validarObrigatorio('  ', 'falta'), 'falta');
  assert.equal(validarObrigatorio('x', 'falta'), undefined);
  assert.equal(temErros({ a: undefined, b: undefined }), false);
  assert.equal(temErros({ a: undefined, b: 'erro' }), true);
  assert.equal(normalizar('  José ÂNGELO '), 'jose angelo');
});
