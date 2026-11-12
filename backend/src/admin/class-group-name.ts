export type Regime = 'LABORAL' | 'POS_LABORAL';

/** Nome da turma: <curso><ano>Lab<semestre><L|P>. Ex.: Info4Lab2L = Informática, 4.º ano, 2.º semestre, laboral. */
export const classGroupName = (courseCode: string, courseYear: number, semesterNumber: number, regime: Regime) =>
  `${courseCode}${courseYear}Lab${semesterNumber}${regime === 'LABORAL' ? 'L' : 'P'}`;
