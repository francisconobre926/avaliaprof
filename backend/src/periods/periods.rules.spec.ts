import { coversScope, isEffectivelyOpen } from './periods.rules';

const p = (status: string, opens: string, closes: string) => ({ status, opensAt: new Date(opens), closesAt: new Date(closes) });
const now = new Date('2026-11-12T10:00:00Z');

describe('isEffectivelyOpen (regra única de período aberto)', () => {
  it('aberto: estado OPEN e hora do servidor dentro das datas', () => {
    expect(isEffectivelyOpen(p('OPEN', '2026-11-01T00:00:00Z', '2026-12-01T00:00:00Z'), now)).toBe(true);
  });
  it('fechado pelo administrador, mesmo dentro das datas', () => {
    expect(isEffectivelyOpen(p('CLOSED', '2026-11-01T00:00:00Z', '2026-12-01T00:00:00Z'), now)).toBe(false);
  });
  it('ainda não abriu', () => {
    expect(isEffectivelyOpen(p('OPEN', '2026-11-13T00:00:00Z', '2026-12-01T00:00:00Z'), now)).toBe(false);
  });
  it('já fechou', () => {
    expect(isEffectivelyOpen(p('OPEN', '2026-10-01T00:00:00Z', '2026-11-12T09:59:59Z'), now)).toBe(false);
  });
  it('os limites são inclusivos', () => {
    expect(isEffectivelyOpen(p('OPEN', '2026-11-12T10:00:00Z', '2026-11-12T10:00:00Z'), now)).toBe(true);
  });
});

describe('coversScope (âmbito do período)', () => {
  const s = (courses: string[], subjects: string[]) => ({ courses: courses.map((courseId) => ({ courseId })), courseSubjects: subjects.map((courseSubjectId) => ({ courseSubjectId })) });
  it('sem âmbito abrange todo o semestre', () => expect(coversScope(s([], []), 'c1', 'cs1')).toBe(true));
  it('abrange o curso indicado', () => expect(coversScope(s(['c1'], []), 'c1', 'cs9')).toBe(true));
  it('abrange a cadeira indicada, mesmo de outro curso da lista', () => expect(coversScope(s(['c2'], ['cs1']), 'c1', 'cs1')).toBe(true));
  it('não abrange curso nem cadeira fora do âmbito', () => expect(coversScope(s(['c2'], ['cs2']), 'c1', 'cs1')).toBe(false));
});
