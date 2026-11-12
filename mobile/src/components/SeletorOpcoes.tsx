import { ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from './ui';
import { useCores } from '../store/themeStore';
import { Typography } from '../theme/typography';

export interface Opcao { id: string; rotulo: string }

interface Props {
  visivel: boolean;
  titulo: string;
  opcoes: Opcao[];
  valor?: string;
  /** Texto da linha que remove a selecção (omitir para campos obrigatórios). */
  rotuloLimpar?: string;
  onEscolher: (id: string | undefined) => void;
  onFechar: () => void;
}

/** Folha inferior com lista de opções de escolha única. */
export function SeletorOpcoes({ visivel, titulo, opcoes, valor, rotuloLimpar, onEscolher, onFechar }: Props) {
  const cores = useCores();
  const linha = (id: string | undefined, rotulo: string) => {
    const ativa = id === valor;
    return (
      <TouchableOpacity
        key={id ?? 'limpar'}
        style={[styles.linha, { borderBottomColor: cores.bordaSubtil }]}
        onPress={() => { onEscolher(id); onFechar(); }}
        accessibilityRole="button"
        accessibilityState={{ selected: ativa }}
      >
        <Text style={[Typography.body, { color: ativa ? cores.principalTexto : cores.textoPrincipal, flex: 1 }]}>{rotulo}</Text>
        {ativa && <Ionicons name="checkmark" size={20} color={cores.principalTexto} />}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visivel} onClose={onFechar} variant="bottom-sheet" titulo={titulo}>
      <ScrollView style={styles.lista}>
        <View>
          {rotuloLimpar && linha(undefined, rotuloLimpar)}
          {opcoes.map(o => linha(o.id, o.rotulo))}
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  lista: { maxHeight: 360 },
  linha: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
});
