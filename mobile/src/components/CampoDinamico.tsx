/**
 * CampoDinamico — Renderiza qualquer tipo de campo
 * baseado na DefinicaoCampo passada.
 *
 * Tipos suportados:
 * - texto / textarea / numero
 * - chip / chip_multi / select
 * - switch / contador
 * - CONSTRUCTOR_PERSONALIZADO (campos nome+valor para "outra")
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { DefinicaoCampo, OpcaoCampo, CampoPersonalizado } from '../data/campos-categoria/tipos';
import { MODO_CONSTRUCTOR_PERSONALIZADO } from '../data/campos-categoria/outros';
import { Colors } from '../theme/colors';
import { Typography, Spacing, Radius } from '../theme/typography';

interface Props {
  campo: DefinicaoCampo;
  valor: any;
  onChange: (novoValor: any) => void;
  erro?: string;
}

export default function CampoDinamico({ campo, valor, onChange, erro }: Props) {
  // ============ Constructor personalizado (categoria "outra") ============
  if (campo.id === MODO_CONSTRUCTOR_PERSONALIZADO) {
    return (
      <ConstructorCamposPersonalizados
        valor={valor || []}
        onChange={onChange}
      />
    );
  }

  // ============ Renderiza por tipo ============
  switch (campo.tipo) {
    case 'texto':
      return <CampoTexto campo={campo} valor={valor} onChange={onChange} erro={erro} />;

    case 'textarea':
      return <CampoTextarea campo={campo} valor={valor} onChange={onChange} erro={erro} />;

    case 'numero':
      return <CampoNumero campo={campo} valor={valor} onChange={onChange} erro={erro} />;

    case 'chip':
      return <CampoChip campo={campo} valor={valor} onChange={onChange} erro={erro} />;

    case 'chip_multi':
      return <CampoChipMulti campo={campo} valor={valor || []} onChange={onChange} erro={erro} />;

    case 'select':
      return <CampoSelect campo={campo} valor={valor} onChange={onChange} erro={erro} />;

    case 'switch':
      return <CampoSwitch campo={campo} valor={!!valor} onChange={onChange} />;

    case 'contador':
      return <CampoContador campo={campo} valor={valor ?? campo.valorInicial ?? 0} onChange={onChange} />;

    default:
      return null;
  }
}

// ============================================================
// CAMPO: TEXTO
// ============================================================
function CampoTexto({ campo, valor, onChange, erro }: {
  campo: DefinicaoCampo;
  valor: any;
  onChange: (v: any) => void;
  erro?: string;
}) {
  return (
    <View style={styles.wrapper}>
      <Label campo={campo} />
      <View style={[styles.inputWrapper, erro && styles.inputErro]}>
        {campo.icone && (
          <MaterialCommunityIcons
            name={campo.icone as any}
            size={18}
            color={erro ? '#D32F2F' : '#637894'}
            style={styles.inputIcone}
          />
        )}
        <TextInput
          style={styles.inputCampo}
          placeholder={campo.dica || ''}
          placeholderTextColor="#9BA8BC"
          value={valor?.toString() || ''}
          onChangeText={onChange}
          maxLength={campo.maxLength}
          autoCapitalize="sentences"
        />
      </View>
      {erro && <ErroInline texto={erro} />}
    </View>
  );
}

// ============================================================
// CAMPO: TEXTAREA
// ============================================================
function CampoTextarea({ campo, valor, onChange, erro }: {
  campo: DefinicaoCampo;
  valor: any;
  onChange: (v: any) => void;
  erro?: string;
}) {
  const texto = valor?.toString() || '';
  return (
    <View style={styles.wrapper}>
      <Label campo={campo} />
      <View style={[styles.textareaWrapper, erro && styles.inputErro]}>
        <TextInput
          style={styles.textareaCampo}
          placeholder={campo.dica || ''}
          placeholderTextColor="#9BA8BC"
          value={texto}
          onChangeText={onChange}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          maxLength={campo.maxLength}
        />
      </View>
      <View style={styles.rodape}>
        {erro ? <ErroInline texto={erro} /> : <View style={{ flex: 1 }} />}
        {campo.maxLength && (
          <Text style={styles.contador}>
            {`${texto.length}/${campo.maxLength}`}
          </Text>
        )}
      </View>
    </View>
  );
}

// ============================================================
// CAMPO: NÚMERO
// ============================================================
function CampoNumero({ campo, valor, onChange, erro }: {
  campo: DefinicaoCampo;
  valor: any;
  onChange: (v: any) => void;
  erro?: string;
}) {
  return (
    <View style={styles.wrapper}>
      <Label campo={campo} />
      <View style={[styles.inputWrapper, erro && styles.inputErro]}>
        {campo.icone && (
          <MaterialCommunityIcons
            name={campo.icone as any}
            size={18}
            color={erro ? '#D32F2F' : '#637894'}
            style={styles.inputIcone}
          />
        )}
        <TextInput
          style={styles.inputCampo}
          placeholder={campo.dica || '0'}
          placeholderTextColor="#9BA8BC"
          value={valor?.toString() || ''}
          onChangeText={(txt) => {
            // Permite dígitos (e vírgula/ponto se decimal)
            let limpo = campo.permiteDecimais
              ? txt.replace(/[^0-9.,]/g, '').replace(',', '.')
              : txt.replace(/[^0-9]/g, '');

            if (limpo === '') {
              onChange('');
              return;
            }

            const num = parseFloat(limpo);
            if (!isNaN(num)) {
              if (campo.min !== undefined && num < campo.min) return;
              if (campo.max !== undefined && num > campo.max) return;
              onChange(limpo);
            }
          }}
          keyboardType={campo.permiteDecimais ? 'decimal-pad' : 'numeric'}
        />
        {campo.sufixo && (
          <View style={styles.sufixo}>
            <Text style={styles.sufixoTexto}>{campo.sufixo}</Text>
          </View>
        )}
      </View>
      {erro && <ErroInline texto={erro} />}
    </View>
  );
}

// ============================================================
// CAMPO: CHIP (escolha única)
// ============================================================
function CampoChip({ campo, valor, onChange, erro }: {
  campo: DefinicaoCampo;
  valor: any;
  onChange: (v: any) => void;
  erro?: string;
}) {
  return (
    <View style={styles.wrapper}>
      <Label campo={campo} />
      <View style={styles.chipsContainer}>
        {campo.opcoes?.map((opcao) => {
          const activo = valor === opcao.valor;
          return (
            <TouchableOpacity
              key={opcao.valor}
              style={[styles.chip, activo && styles.chipActivo]}
              onPress={() => onChange(activo ? '' : opcao.valor)}
              activeOpacity={0.8}
            >
              {opcao.icone && (
                <MaterialCommunityIcons
                  name={opcao.icone as any}
                  size={14}
                  color={activo ? '#FFFFFF' : '#0B2E59'}
                />
              )}
              <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>
                {opcao.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {erro && <ErroInline texto={erro} />}
    </View>
  );
}

// ============================================================
// CAMPO: CHIP MULTI (múltipla escolha)
// ============================================================
function CampoChipMulti({ campo, valor, onChange, erro }: {
  campo: DefinicaoCampo;
  valor: string[];
  onChange: (v: string[]) => void;
  erro?: string;
}) {
  const toggle = (valorOpcao: string) => {
    if (valor.includes(valorOpcao)) {
      onChange(valor.filter(v => v !== valorOpcao));
    } else {
      onChange([...valor, valorOpcao]);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelLinha}>
        <Label campo={campo} semMargem />
        {valor.length > 0 && (
          <View style={styles.contadorBadge}>
            <Text style={styles.contadorBadgeTexto}>{valor.length}</Text>
          </View>
        )}
      </View>
      <View style={styles.chipsContainer}>
        {campo.opcoes?.map((opcao) => {
          const activo = valor.includes(opcao.valor);
          return (
            <TouchableOpacity
              key={opcao.valor}
              style={[styles.chip, activo && styles.chipActivo]}
              onPress={() => toggle(opcao.valor)}
              activeOpacity={0.8}
            >
              {activo && (
                <Ionicons name="checkmark" size={13} color="#FFFFFF" />
              )}
              {opcao.icone && !activo && (
                <MaterialCommunityIcons
                  name={opcao.icone as any}
                  size={14}
                  color="#0B2E59"
                />
              )}
              <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>
                {opcao.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {erro && <ErroInline texto={erro} />}
    </View>
  );
}

// ============================================================
// CAMPO: SELECT (dropdown modal)
// ============================================================
function CampoSelect({ campo, valor, onChange, erro }: {
  campo: DefinicaoCampo;
  valor: any;
  onChange: (v: any) => void;
  erro?: string;
}) {
  const [modalVisivel, setModalVisivel] = useState(false);
  const opcaoSelec = campo.opcoes?.find(o => o.valor === valor);

  return (
    <View style={styles.wrapper}>
      <Label campo={campo} />
      <TouchableOpacity
        style={[styles.inputWrapper, { paddingVertical: 2 }, erro && styles.inputErro]}
        onPress={() => setModalVisivel(true)}
        activeOpacity={0.85}
      >
        <View style={{ flex: 1, paddingVertical: 12 }}>
          <Text style={[
            styles.selectTexto,
            !opcaoSelec && { color: '#9BA8BC' },
          ]}>
            {opcaoSelec?.label || campo.dica || 'Escolhe uma opção'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color="#637894" />
      </TouchableOpacity>
      {erro && <ErroInline texto={erro} />}

      <Modal
        visible={modalVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisivel(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>{campo.label}</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {campo.opcoes?.map((opcao) => {
                const activo = valor === opcao.valor;
                return (
                  <TouchableOpacity
                    key={opcao.valor}
                    style={[styles.selectOpcao, activo && styles.selectOpcaoActiva]}
                    onPress={() => {
                      onChange(opcao.valor);
                      setModalVisivel(false);
                    }}
                  >
                    <Text style={[styles.selectOpcaoTexto, activo && { color: '#FF7900', fontWeight: '800' }]}>
                      {opcao.label}
                    </Text>
                    {activo && <Ionicons name="checkmark" size={20} color="#FF7900" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// CAMPO: SWITCH
// ============================================================
function CampoSwitch({ campo, valor, onChange }: {
  campo: DefinicaoCampo;
  valor: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={[styles.switchContainer, valor && styles.switchContainerActivo]}>
      <View style={[styles.switchIcone, valor && { backgroundColor: '#0B2E59' }]}>
        <MaterialCommunityIcons
          name={(campo.icone || 'check') as any}
          size={18}
          color={valor ? '#FFFFFF' : '#0B2E59'}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.switchLabel}>{campo.label}</Text>
        {campo.dica && (
          <Text style={styles.switchDica}>{campo.dica}</Text>
        )}
      </View>
      <Switch
        value={valor}
        onValueChange={onChange}
        trackColor={{ false: '#DCE6F1', true: '#0B2E59' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

// ============================================================
// CAMPO: CONTADOR (+/-)
// ============================================================
function CampoContador({ campo, valor, onChange }: {
  campo: DefinicaoCampo;
  valor: number;
  onChange: (v: number) => void;
}) {
  const min = campo.min ?? 0;
  const max = campo.max ?? 99;
  const num = parseInt(String(valor)) || 0;

  const decrementar = () => {
    if (num > min) onChange(num - 1);
  };
  const incrementar = () => {
    if (num < max) onChange(num + 1);
  };

  return (
    <View style={styles.wrapper}>
      <Label campo={campo} />
      <View style={styles.contador}>
        <TouchableOpacity
          style={[styles.contadorBotao, num <= min && styles.contadorBotaoDesabilitado]}
          onPress={decrementar}
          disabled={num <= min}
        >
          <Ionicons name="remove" size={20} color={num <= min ? '#C8D5E5' : '#0B2E59'} />
        </TouchableOpacity>
        <View style={styles.contadorValor}>
          {campo.icone && (
            <MaterialCommunityIcons
              name={campo.icone as any}
              size={16}
              color="#0B2E59"
            />
          )}
          <Text style={styles.contadorValorTexto}>{num}</Text>
          {campo.sufixo && (
            <Text style={styles.contadorSufixo}>{campo.sufixo}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.contadorBotao, num >= max && styles.contadorBotaoDesabilitado]}
          onPress={incrementar}
          disabled={num >= max}
        >
          <Ionicons name="add" size={20} color={num >= max ? '#C8D5E5' : '#0B2E59'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================
// CONSTRUCTOR DE CAMPOS PERSONALIZADOS (categoria "outra")
// ============================================================
function ConstructorCamposPersonalizados({ valor, onChange }: {
  valor: CampoPersonalizado[];
  onChange: (v: CampoPersonalizado[]) => void;
}) {
  const [modalVisivel, setModalVisivel] = useState(false);
  const [nomeNovo, setNomeNovo] = useState('');
  const [valorNovo, setValorNovo] = useState('');

  const adicionar = () => {
    if (!nomeNovo.trim() || !valorNovo.trim()) return;
    if (valor.length >= 10) return;
    const novo: CampoPersonalizado = {
      id: `cp_${Date.now()}`,
      nome: nomeNovo.trim(),
      valor: valorNovo.trim(),
    };
    onChange([...valor, novo]);
    setNomeNovo('');
    setValorNovo('');
    setModalVisivel(false);
  };

  const remover = (id: string) => {
    onChange(valor.filter(c => c.id !== id));
  };

  return (
    <View style={styles.wrapper}>
      {valor.length === 0 ? (
        <View style={styles.vazioBox}>
          <MaterialCommunityIcons name="tag-plus" size={32} color="#637894" />
          <Text style={styles.vazioTitulo}>Sem características ainda</Text>
          <Text style={styles.vazioTexto}>
            Adiciona as características que fizerem sentido para o teu anúncio
          </Text>
        </View>
      ) : (
        <View style={styles.listaCampos}>
          {valor.map((item) => (
            <View key={item.id} style={styles.itemCampo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemCampoNome}>{item.nome}</Text>
                <Text style={styles.itemCampoValor}>{item.valor}</Text>
              </View>
              <TouchableOpacity
                style={styles.itemCampoRemover}
                onPress={() => remover(item.id)}
              >
                <Ionicons name="close" size={16} color="#D32F2F" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {valor.length < 10 && (
        <TouchableOpacity
          style={styles.adicionarBotao}
          onPress={() => setModalVisivel(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={20} color="#FF7900" />
          <Text style={styles.adicionarBotaoTexto}>
            {valor.length === 0 ? 'Adicionar primeira característica' : 'Adicionar característica'}
          </Text>
          <Text style={styles.adicionarBotaoContador}>{`${valor.length}/10`}</Text>
        </TouchableOpacity>
      )}

      {/* Modal para adicionar */}
      <Modal
        visible={modalVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisivel(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>Nova característica</Text>

            <View style={{ paddingHorizontal: 20 }}>
              <Text style={styles.modalLabel}>Nome da característica</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ex: Peso, Cor, Material"
                  placeholderTextColor="#9BA8BC"
                  value={nomeNovo}
                  onChangeText={setNomeNovo}
                  maxLength={40}
                  autoCapitalize="sentences"
                  autoFocus
                />
              </View>

              <Text style={styles.modalLabel}>Valor</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ex: 5 kg, Vermelho, Alumínio"
                  placeholderTextColor="#9BA8BC"
                  value={valorNovo}
                  onChangeText={setValorNovo}
                  maxLength={80}
                  autoCapitalize="sentences"
                />
              </View>

              <View style={styles.modalBotoes}>
                <TouchableOpacity
                  style={styles.modalBotaoCancelar}
                  onPress={() => {
                    setNomeNovo('');
                    setValorNovo('');
                    setModalVisivel(false);
                  }}
                >
                  <Text style={styles.modalBotaoCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBotaoConfirmar,
                    (!nomeNovo.trim() || !valorNovo.trim()) && styles.modalBotaoDesabilitado,
                  ]}
                  onPress={adicionar}
                  disabled={!nomeNovo.trim() || !valorNovo.trim()}
                >
                  <Text style={styles.modalBotaoConfirmarTexto}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function Label({ campo, semMargem }: { campo: DefinicaoCampo; semMargem?: boolean }) {
  return (
    <View style={[styles.labelContainer, !semMargem && { marginBottom: 8 }]}>
      <Text style={styles.label}>
        {campo.label}
        {campo.obrigatorio && <Text style={styles.obrigatorio}> *</Text>}
      </Text>
    </View>
  );
}

function ErroInline({ texto }: { texto: string }) {
  return (
    <View style={styles.erroContainer}>
      <Ionicons name="warning" size={13} color="#D32F2F" />
      <Text style={styles.erroTexto}>{texto}</Text>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 7,
  },
  label: {
    ...Typography.bodyBold,
    color: '#173455',
    fontWeight: '800',
    fontSize: 14,
  },
  obrigatorio: {
    color: '#D32F2F',
    fontWeight: '800',
  },
  contadorBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF7900',
    paddingHorizontal: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contadorBadgeTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // Inputs
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#DCE6F1',
    overflow: 'hidden',
  },
  inputErro: {
    borderColor: '#D32F2F',
    borderWidth: 2,
    backgroundColor: '#FFF5F5',
  },
  inputIcone: {
    marginLeft: 14,
  },
  inputCampo: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...Typography.body,
    color: '#0B2E59',
    fontSize: 15,
  },
  sufixo: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#F1F5FA',
    borderLeftWidth: 1,
    borderLeftColor: '#DCE6F1',
  },
  sufixoTexto: {
    ...Typography.bodyBold,
    color: '#506985',
    fontSize: 13,
  },

  // Textarea
  textareaWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#DCE6F1',
    minHeight: 110,
  },
  textareaCampo: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...Typography.body,
    color: '#0B2E59',
    fontSize: 15,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  contador: {
    ...Typography.caption,
    color: '#7D8FA7',
    fontSize: 11,
  },

  // Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#F0F5FA',
    borderWidth: 1,
    borderColor: '#DCE6F1',
    gap: 5,
  },
  chipActivo: {
    backgroundColor: '#0B2E59',
    borderColor: '#0B2E59',
  },
  chipTexto: {
    ...Typography.bodyBold,
    color: '#0B2E59',
    fontSize: 13,
  },
  chipTextoActivo: {
    color: '#FFFFFF',
  },

  // Select
  selectTexto: {
    ...Typography.body,
    color: '#0B2E59',
    paddingHorizontal: 14,
    fontSize: 15,
  },

  // Switch
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E8F2',
    gap: 12,
  },
  switchContainerActivo: {
    borderColor: '#B7D0EB',
    backgroundColor: '#F4F8FD',
  },
  switchIcone: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EAF1FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchLabel: {
    ...Typography.bodyBold,
    color: '#173455',
    fontWeight: '800',
    fontSize: 14,
  },
  switchDica: {
    ...Typography.caption,
    color: '#71849C',
    marginTop: 2,
    fontSize: 11,
  },

  // Contador
  contador: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE6F1',
    overflow: 'hidden',
  },
  contadorBotao: {
    width: 48,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5FA',
  },
  contadorBotaoDesabilitado: {
    opacity: 0.5,
  },
  contadorValor: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  contadorValorTexto: {
    ...Typography.h3,
    color: '#0B2E59',
    fontWeight: '800',
    fontSize: 20,
  },
  contadorSufixo: {
    ...Typography.caption,
    color: '#637894',
    fontSize: 11,
  },

  // Erro
  erroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    flex: 1,
  },
  erroTexto: {
    ...Typography.caption,
    color: '#D32F2F',
    fontSize: 11,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DCE6F1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  modalTitulo: {
    ...Typography.h3,
    color: '#0B2E59',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  modalLabel: {
    ...Typography.bodyBold,
    color: '#173455',
    marginBottom: 7,
    fontWeight: '800',
    fontSize: 13,
    marginTop: 4,
  },
  modalInputWrapper: {
    backgroundColor: '#F8F9FB',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#DCE6F1',
    marginBottom: 14,
  },
  modalInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...Typography.body,
    color: '#0B2E59',
    fontSize: 15,
  },
  modalBotoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalBotaoCancelar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F0F2F6',
    alignItems: 'center',
  },
  modalBotaoCancelarTexto: {
    color: '#0B2E59',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBotaoConfirmar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FF7900',
    alignItems: 'center',
  },
  modalBotaoDesabilitado: {
    opacity: 0.4,
  },
  modalBotaoConfirmarTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // Opções do Select
  selectOpcao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F6',
  },
  selectOpcaoActiva: {
    backgroundColor: '#FFF4E6',
  },
  selectOpcaoTexto: {
    ...Typography.body,
    color: '#0B2E59',
    fontSize: 15,
  },

  // Constructor
  vazioBox: {
    backgroundColor: '#F8F9FB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0E8F2',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  vazioTitulo: {
    ...Typography.bodyBold,
    color: '#0B2E59',
    fontWeight: '800',
    fontSize: 14,
  },
  vazioTexto: {
    ...Typography.caption,
    color: '#637894',
    textAlign: 'center',
    fontSize: 12,
    maxWidth: 240,
    lineHeight: 17,
  },
  listaCampos: {
    gap: 8,
    marginBottom: 12,
  },
  itemCampo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E8F2',
    gap: 10,
  },
  itemCampoNome: {
    ...Typography.caption,
    color: '#637894',
    fontSize: 11,
    marginBottom: 2,
    fontWeight: '700',
  },
  itemCampoValor: {
    ...Typography.bodyBold,
    color: '#0B2E59',
    fontWeight: '800',
    fontSize: 14,
  },
  itemCampoRemover: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adicionarBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#FFF8F1',
    borderWidth: 1.5,
    borderColor: '#FF7900',
    borderStyle: 'dashed',
    gap: 7,
  },
  adicionarBotaoTexto: {
    ...Typography.button,
    color: '#D95E00',
    fontWeight: '800',
    fontSize: 13,
    flex: 1,
    textAlign: 'center',
  },
  adicionarBotaoContador: {
    ...Typography.caption,
    color: '#71849C',
    fontSize: 11,
  },
});