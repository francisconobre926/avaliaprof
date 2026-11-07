import { View, Text, TextInput, TouchableOpacity, Modal, Pressable, FlatList, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { Colors, Radius, Spacing, Typography, Sombras } from '../../../src/theme/colors';
import { Colors, Sombras } from '../../../src/theme/colors';
import { Radius, Spacing, Typography } from '../../../src/theme/typography';
import { Fonte } from '../../../src/theme/fonts';
import Icone from '../../../src/components/Icone';

export function SeccaoHeader({ icone, titulo, cor, numero }: any) {
  return (
    <View style={styles.seccaoHeader}>
      <View style={[styles.seccaoNumero, { backgroundColor: cor }]}>
        <Text style={styles.seccaoNumeroTexto}>{numero}</Text>
      </View>
      <View style={[styles.seccaoIconeContainer, { backgroundColor: `${cor}15` }]}>
        <Ionicons name={icone} size={18} color={cor} />
      </View>
      <Text style={styles.seccaoTitulo}>{titulo}</Text>
      <View style={styles.seccaoLinha} />
    </View>
  );
}

export function CampoInput({ label, icone, placeholder, value, onChangeText, focado, onFocus, onBlur, corPrincipal, keyboardType, autoCapitalize }: any) {
  return (
    <View style={styles.campoContainer}>
      <Text style={styles.campoLabel}>{label}</Text>
      <View style={[styles.inputWrapper, focado && { borderColor: corPrincipal, borderWidth: 2 }]}>
        <Ionicons name={icone} size={20} color={Colors.textoSecundario} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textoTerciario}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'sentences'}
        />
      </View>
    </View>
  );
}

export function ModalSelector({ visivel, titulo, subtitulo, opcoes, valorSeleccionado, onSeleccionar, onFechar, corPrincipal, icone }: any) {
  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onFechar} />
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={[styles.modalIconeContainer, { backgroundColor: `${corPrincipal}15` }]}>
              <Icone name={icone} size={24} color={corPrincipal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitulo}>{titulo}</Text>
              <Text style={styles.modalSubtitulo}>{subtitulo}</Text>
            </View>
            <TouchableOpacity onPress={onFechar} style={styles.modalFechar}>
              <Ionicons name="close" size={20} color={Colors.textoSecundario} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={opcoes}
            keyExtractor={(item) => item.value}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const seleccionado = valorSeleccionado === item.value;
              return (
                <TouchableOpacity
                  style={[styles.modalOpcao, seleccionado && { backgroundColor: `${corPrincipal}10`, borderColor: corPrincipal }]}
                  onPress={() => onSeleccionar(item.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalOpcaoInfo}>
                    <Text style={[styles.modalOpcaoTitulo, seleccionado && { color: corPrincipal, fontFamily: Fonte.corpoSemi }]}>
                      {item.label}
                    </Text>
                    {item.descricao && <Text style={styles.modalOpcaoDescricao}>{item.descricao}</Text>}
                  </View>
                  {seleccionado && (
                    <View style={[styles.modalOpcaoCheck, { backgroundColor: corPrincipal }]}>
                      <Ionicons name="checkmark" size={14} color={Colors.branco} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={{ paddingBottom: Spacing.xl }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  seccaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  seccaoNumero: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Sombras.sm,
  },
  seccaoNumeroTexto: {
    color: Colors.branco,
    fontFamily: Fonte.corpoSemi,
    fontSize: 12,
  },
  seccaoIconeContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seccaoTitulo: {
    ...Typography.h4,
    color: Colors.textoPrincipal,
  },
  seccaoLinha: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.bordaSubtil,
    marginLeft: Spacing.sm,
  },
  campoContainer: { gap: Spacing.xs },
  campoLabel: {
    ...Typography.bodyBold,
    color: Colors.textoPrincipal,
    fontSize: 13,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.fundoInput,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.md : 2,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 52,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textoPrincipal,
    padding: 0,
    paddingVertical: Platform.OS === 'android' ? Spacing.md : 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.branco,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    padding: Spacing.lg,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.bordaMedia,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  modalIconeContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitulo: {
    ...Typography.h3,
    color: Colors.textoPrincipal,
  },
  modalSubtitulo: {
    ...Typography.caption,
    color: Colors.textoSecundario,
    marginTop: 2,
  },
  modalFechar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.fundoSuave,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOpcao: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: Colors.fundoSuave,
  },
  modalOpcaoInfo: { flex: 1 },
  modalOpcaoTitulo: {
    ...Typography.body,
    color: Colors.textoPrincipal,
    fontFamily: Fonte.corpoSemi,
  },
  modalOpcaoDescricao: {
    ...Typography.caption,
    color: Colors.textoSecundario,
    marginTop: 2,
  },
  modalOpcaoCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});