import { classGroupName } from './class-group-name';

describe('classGroupName', () => {
  it('Informática, 4.º ano, 2.º semestre, laboral', () => expect(classGroupName('Info', 4, 2, 'LABORAL')).toBe('Info4Lab2L'));
  it('pós-laboral termina em P', () => expect(classGroupName('Info', 1, 2, 'POS_LABORAL')).toBe('Info1Lab2P'));
  it('usa a abreviatura do curso e o semestre', () => expect(classGroupName('Dir', 3, 1, 'LABORAL')).toBe('Dir3Lab1L'));
  it('regimes diferentes dão nomes diferentes', () => expect(classGroupName('Gest', 2, 2, 'LABORAL')).not.toBe(classGroupName('Gest', 2, 2, 'POS_LABORAL')));
});
