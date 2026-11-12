import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import TopBar from '../../src/components/TopBar';
import { LinhaMenu } from '../../src/components/admin/Comuns';
import { useCores } from '../../src/store/themeStore';
import { Spacing } from '../../src/theme/typography';

/** Menu de gestão: períodos, semestres, estrutura académica, utilizadores e auditoria. */
export default function GestaoAcademica() {
  const router = useRouter();
  const cores = useCores();
  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <TopBar titulo="Gestão" />
      <ScrollView contentContainerStyle={styles.c}>
        <LinhaMenu icone="timer-outline" titulo="Períodos de avaliação" descricao="Abrir, fechar e definir o âmbito" onPress={() => router.push('/academico/periodos')} />
        <LinhaMenu icone="calendar-outline" titulo="Semestres" descricao="Definir o semestre corrente" onPress={() => router.push('/academico/semestres')} />
        <LinhaMenu icone="school-outline" titulo="Cursos, cadeiras e docentes" descricao="Estrutura académica e convites a docentes" onPress={() => router.push('/academico/estrutura')} />
        <LinhaMenu icone="people-circle-outline" titulo="Utilizadores" descricao="Pesquisar e suspender contas" onPress={() => router.push('/academico/utilizadores')} />
        <LinhaMenu icone="list-outline" titulo="Auditoria" descricao="Registo de acções administrativas" onPress={() => router.push('/academico/auditoria')} />
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({ c: { padding: Spacing.base, gap: Spacing.sm } });
