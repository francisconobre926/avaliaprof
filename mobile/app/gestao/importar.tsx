import { useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../src/components/TopBar';
import { Badge, Button } from '../../src/components/ui';
import { useCores } from '../../src/store/themeStore';
import { Colors } from '../../src/theme/colors';
import { Typography, Spacing, Radius } from '../../src/theme/typography';

type Formato = 'CSV' | 'Excel' | 'XML';
const FORMATOS: Record<string, Formato> = { csv: 'CSV', xlsx: 'Excel', xls: 'Excel', xml: 'XML' };
const COLUNAS = ['Nome completo', 'Número de estudante', 'Email', 'Curso', 'Ano curricular', 'Turma', 'Semestre', 'Estado da matrícula'];

const tamanho = (b?: number) => (b == null ? '—' : b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

/**
 * PREPARAÇÃO VISUAL da importação de estudantes. Nesta fase o ficheiro só é seleccionado para
 * mostrar as suas informações básicas: não é lido, processado, enviado nem guardado, e não se
 * regista nenhum estudante. A importação real fica para uma fase posterior.
 */
export default function ImportarEstudantes() {
  const router = useRouter();
  const cores = useCores();
  const [ficheiro, setFicheiro] = useState<{ nome: string; tamanho?: number; formato?: Formato }>();
  const [aviso, setAviso] = useState<string>();

  const escolher = async () => {
    setAviso(undefined);
    const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: false, multiple: false });
    if (r.canceled) return;
    const f = r.assets[0];
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    const formato = FORMATOS[ext];
    if (!formato) {
      setFicheiro(undefined);
      setAviso(`Formato não suportado (.${ext || '?'}). Usa um ficheiro CSV, Excel (.xlsx, .xls) ou XML.`);
      return;
    }
    setFicheiro({ nome: f.name, tamanho: f.size, formato });
  };

  const caixa = { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil };

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="Importar estudantes" onVoltar={() => router.back()} />
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={[styles.aviso, { backgroundColor: Colors.avisoFundo }]} accessibilityRole="alert">
          <Ionicons name="time-outline" size={20} color={Colors.aviso} />
          <Text style={[Typography.bodySmall, { color: Colors.aviso, flex: 1 }]}>
            A importação de ficheiros estará disponível numa fase posterior. Por agora o ficheiro não é lido nem enviado e nenhum estudante é registado. Para cadastrar, usa o formulário individual.
          </Text>
        </View>

        <Text style={[Typography.tituloSecao, { color: cores.textoPrincipal }]}>Ficheiro</Text>
        <View style={[styles.cartao, caixa]}>
          {ficheiro ? (
            <>
              <View style={styles.linha}>
                <Ionicons name="document-text-outline" size={22} color={cores.textoSecundario} />
                <Text style={[Typography.tituloCard, { color: cores.textoPrincipal, flex: 1 }]} numberOfLines={2}>{ficheiro.nome}</Text>
              </View>
              <View style={styles.linha}>
                <Badge label={`Formato ${ficheiro.formato}`} cor="azul" />
                <Badge label={tamanho(ficheiro.tamanho)} cor="cinza" />
              </View>
            </>
          ) : (
            <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>Formatos aceites: CSV, Excel (.xlsx, .xls) e XML.</Text>
          )}
          {aviso && <Text style={[Typography.bodySmall, { color: cores.erro }]} accessibilityRole="alert">{aviso}</Text>}
          <Button label={ficheiro ? 'Escolher outro ficheiro' : 'Escolher ficheiro'} variant="outline" size="sm" icon="folder-open-outline" onPress={escolher} />
        </View>

        <Text style={[Typography.tituloSecao, { color: cores.textoPrincipal }]}>Pré-visualização</Text>
        <View style={[styles.cartao, caixa]}>
          <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>
            A pré-visualização das linhas do ficheiro ficará disponível quando a importação for activada. O ficheiro deverá ter as colunas:
          </Text>
          <View style={styles.colunas}>
            {COLUNAS.map(c => <Badge key={c} label={c} cor="cinza" />)}
          </View>
        </View>

        <Button label="Importar" onPress={() => {}} disabled fullWidth />
        <Text style={[Typography.caption, { color: cores.textoTerciario, textAlign: 'center' }]}>Disponível numa fase posterior</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  conteudo: { padding: Spacing.base, gap: Spacing.md },
  aviso: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.lg, alignItems: 'flex-start' },
  cartao: { padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.lg, alignItems: 'flex-start' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  colunas: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
});
