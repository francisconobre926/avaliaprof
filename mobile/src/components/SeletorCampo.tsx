import { useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SeletorOpcoes, type Opcao } from './SeletorOpcoes';
import { useCores } from '../store/themeStore';
import { Typography, Controlo, Radius } from '../theme/typography';

interface Props {
  label: string;
  opcoes: Opcao[];
  valor?: string;
  onChange: (id: string) => void;
  erro?: string;
  placeholder?: string;
}

/** Campo de formulário que abre um seletor de opções. */
export function SeletorCampo({ label, opcoes, valor, onChange, erro, placeholder = 'Seleccionar' }: Props) {
  const cores = useCores();
  const [aberto, setAberto] = useState(false);
  const atual = opcoes.find(o => o.id === valor);

  return (
    <View style={styles.bloco}>
      <Text style={[Typography.etiqueta, { color: cores.textoSecundario }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.campo, { borderColor: erro ? cores.erro : cores.bordaSubtil, backgroundColor: cores.fundoElevado }]}
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${atual?.rotulo ?? placeholder}`}
      >
        <Text style={[Typography.body, { color: atual ? cores.textoPrincipal : cores.textoTerciario, flex: 1 }]} numberOfLines={1}>
          {atual?.rotulo ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={cores.textoTerciario} />
      </TouchableOpacity>
      {erro && <Text style={[Typography.caption, { color: cores.erro }]}>{erro}</Text>}
      <SeletorOpcoes
        visivel={aberto}
        titulo={label}
        opcoes={opcoes}
        valor={valor}
        onEscolher={id => id && onChange(id)}
        onFechar={() => setAberto(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: 6 },
  campo: {
    minHeight: Controlo.input,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
  },
});
