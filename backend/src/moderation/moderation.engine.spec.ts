import { ModerationEngine, normalize } from './moderation.engine';

describe('ModerationEngine', () => {
  const m = new ModerationEngine();
  const status = (t: string, repeat = false) => m.classify(t, repeat);

  describe('críticas legítimas são publicadas', () => {
    it.each([
      'O professor explica mal a matéria.',
      'O docente deveria melhorar a metodologia.',
      'O professor não disponibiliza tempo suficiente para esclarecer dúvidas.',
      'As aulas começam sempre atrasadas e a matéria é dada demasiado depressa.',
      'Os testes não correspondem ao que foi dado nas aulas, acho injusto.',
      'Excelente professor, muito claro e disponível. Recomendo!',
      'Aulas de computação muito práticas', // "computação" não pode ser apanhada por "puta"
    ])('"%s"', (t) => expect(status(t).status).toBe('PUBLISHED'));
  });

  describe('ofensas são bloqueadas', () => {
    it.each(['O professor é um idiota', 'que merda de aulas', 'Este professor é um BURRO', 'professor id1ota', 'é um iiiidiota'])(
      '"%s"',
      (t) => expect(status(t)).toMatchObject({ status: 'BLOCKED', reason: 'OFFENSIVE' }),
    );
  });

  it('ameaças e discurso discriminatório são bloqueados', () => {
    expect(status('vou te matar se chumbar')).toMatchObject({ status: 'BLOCKED', reason: 'THREAT_OR_HATE' });
    expect(status('ele é um paneleiro')).toMatchObject({ status: 'BLOCKED', reason: 'THREAT_OR_HATE' });
  });

  describe('dados pessoais são bloqueados', () => {
    it.each([
      'falem com ele em joao@gmail.com',
      'o contacto é +258 84 123 4567',
      'ligam para 841234567',
      'vejam em www.exemplo.com',
      'o meu número é 20260001',
      'segue no @professor_x',
      'whatsapp 84 123',
    ])('"%s"', (t) => expect(status(t)).toMatchObject({ status: 'BLOCKED', reason: 'PERSONAL_DATA' }));

    it('datas e notas não são dados pessoais', () => {
      expect(status('O teste de 10-11-2026 teve nota média de 12,5 valores.').status).toBe('PUBLISHED');
    });
  });

  it('acusações graves vão para revisão', () => {
    expect(status('Dizem que o professor vende notas.')).toMatchObject({ status: 'PENDING_REVIEW', reason: 'SERIOUS_ACCUSATION' });
    expect(status('Houve assédio nas aulas práticas')).toMatchObject({ status: 'PENDING_REVIEW', reason: 'SERIOUS_ACCUSATION' });
  });

  it('juízos duros sobre a pessoa vão para revisão', () => {
    expect(status('O professor é incompetente.')).toMatchObject({ status: 'PENDING_REVIEW', reason: 'POSSIBLE_PERSONAL_ATTACK' });
  });

  describe('spam', () => {
    it('texto repetido pelo mesmo autor', () => expect(status('Boa aula, gostei muito', true)).toMatchObject({ status: 'BLOCKED', reason: 'SPAM' }));
    it.each(['aaaaaaaaaaaa', 'bom bom bom bom bom bom bom', '!!!! ????', 'ESTE PROFESSOR NUNCA EXPLICA NADA NAS AULAS TEORICAS'])(
      '"%s"',
      (t) => expect(status(t)).toMatchObject({ status: 'BLOCKED', reason: 'SPAM' }),
    );
  });

  it('limite de caracteres', () => {
    expect(status('a b '.repeat(200))).toMatchObject({ status: 'BLOCKED', reason: 'TOO_LONG' });
  });

  it('só dá mensagem ao estudante quando o comentário não é publicado', () => {
    expect(status('Gostei da aula').message).toBeUndefined();
    expect(status('idiota').message).toMatch(/ofensiva/);
  });

  it('o hash ignora maiúsculas, acentos e pontuação', () => {
    expect(m.hash('Ótima aula!!!')).toBe(m.hash('otima aula'));
    expect(normalize('M3rd@')).toBe('merd@');
  });
});
