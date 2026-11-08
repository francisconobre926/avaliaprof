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
import { Ionicons } from '@expo/vector-icons';
import { DefinicaoCampo, OpcaoCampo, CampoPersonalizado } from '../data/campos-categoria/tipos';
import { MODO_CONSTRUCTOR_PERSONALIZADO } from '../data/campos-categoria/outros';
import { Colors } from '../theme/colors';
import { Typography, Spacing, Radius } from '../theme/typography';

import { Fonte } from '../theme/fonts';
import Icone from './Icone';
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
          <Icone
            name={campo.icone as any}
            size={18}
            color={erro ? Colors.erro : Colors.textoSecundario}
            style={styles.inputIcone}
          />
        )}
        <TextInput
          style={styles.inputCampo}
          placeholder={campo.dica || ''}
          placeholderTextColor={Colors.textoTerciario}
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
          placeholderTextColor={Colors.textoTerciario}
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
          <Text style={styles.contadorTexto}>
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
          <Icone
            name={campo.icone as any}
            size={18}
            color={erro ? Colors.erro : Colors.textoSecundario}
            style={styles.inputIcone}
          />
        )}
        <TextInput
          style={styles.inputCampo}
          placeholder={campo.dica || '0'}
          placeholderTextColor={Colors.textoTerciario}
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
                <Icone
                  name={opcao.icone as any}
                  size={14}
                  color={activo ? Colors.branco : Colors.carvao}
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
                <Ionicons name="checkmark" size={13} color={Colors.branco} />
              )}
              {opcao.icone && !activo && (
                <Icone
                  name={opcao.icone as any}
                  size={14}
                  color={Colors.carvao}
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
            !opcaoSelec && { color: Colors.textoTerciario },
          ]}>
            {opcaoSelec?.label || campo.dica || 'Escolhe uma opção'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={Colors.textoSecundario} />
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
                    <Text style={[styles.selectOpcaoTexto, activo && { color: Colors.azulTexto, fontFamily: Fonte.corpoSemi }]}>
                      {opcao.label}
                    </Text>
                    {activo && <Ionicons name="checkmark" size={20} color={Colors.azul} />}
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
      <View style={[styles.switchIcone, valor && { backgroundColor: Colors.carvao }]}>
        <Icone
          name={(campo.icone || 'check') as any}
          size={18}
          color={valor ? Colors.branco : Colors.carvao}
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
        trackColor={{ false: Colors.borda, true: Colors.carvao }}
        thumbColor={Colors.branco}
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
          <Ionicons name="remove" size={20} color={num <= min ? Colors.borda : Colors.carvao} />
        </TouchableOpacity>
        <View style={styles.contadorValor}>
          {campo.icone && (
            <Icone
              name={campo.icone as any}
              size={16}
              color={Colors.carvao}
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
          <Ionicons name="add" size={20} color={num >= max ? Colors.borda : Colors.carvao} />
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
          <Icone name="tag-plus" size={32} color={Colors.textoSecundario} />
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
                <Ionicons name="close" size={16} color={Colors.erro} />
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
          <Ionicons name="add-circle" size={20} color={Colors.azul} />
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
                  placeholderTextColor={Colors.textoTerciario}
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
                  placeholderTextColor={Colors.textoTerciario}
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
      <Ionicons name="warning" size={13} color={Colors.erro} />
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
    color: Colors.carvao,
    fontFamily: Fonte.corpoSemi,
    fontSize: 14,
  },
  obrigatorio: {
    color: Colors.erro,
    fontFamily: Fonte.corpoSemi,
  },
  contadorBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.azul,
    paddingHorizontal: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contadorBadgeTexto: {
    color: Colors.branco,
    fontSize: 12,
    fontFamily: Fonte.corpoSemi,
  },

  // Inputs
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.branco,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: Colors.borda,
    overflow: 'hidden',
  },
  inputErro: {
    borderColor: Colors.erro,
    borderWidth: 2,
    backgroundColor: Colors.erroFundo,
  },
  inputIcone: {
    marginLeft: 14,
  },
  inputCampo: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...Typography.body,
    color: Colors.carvao,
    fontSize: 15,
  },
  sufixo: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: Colors.fundoSuave,
    borderLeftWidth: 1,
    borderLeftColor: Colors.borda,
  },
  sufixoTexto: {
    ...Typography.bodyBold,
    color: Colors.textoSecundario,
    fontSize: 13,
  },

  // Textarea
  textareaWrapper: {
    backgroundColor: Colors.branco,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: Colors.borda,
    minHeight: 110,
  },
  textareaCampo: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...Typography.body,
    color: Colors.carvao,
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
  contadorTexto: {
    ...Typography.caption,
    color: Colors.textoTerciario,
    fontSize: 12,
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
    backgroundColor: Colors.fundoSuave,
    borderWidth: 1,
    borderColor: Colors.borda,
    gap: 5,
  },
  chipActivo: {
    backgroundColor: Colors.carvao,
    borderColor: Colors.carvao,
  },
  chipTexto: {
    ...Typography.bodyBold,
    color: Colors.carvao,
    fontSize: 13,
  },
  chipTextoActivo: {
    color: Colors.branco,
  },

  // Select
  selectTexto: {
    ...Typography.body,
    color: Colors.carvao,
    paddingHorizontal: 14,
    fontSize: 15,
  },

  // Switch
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.branco,
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borda,
    gap: 12,
  },
  switchContainerActivo: {
    borderColor: Colors.azulSuave,
    backgroundColor: Colors.gelo,
  },
  switchIcone: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.azulSuave,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchLabel: {
    ...Typography.bodyBold,
    color: Colors.carvao,
    fontFamily: Fonte.corpoSemi,
    fontSize: 14,
  },
  switchDica: {
    ...Typography.caption,
    color: Colors.textoSecundario,
    marginTop: 2,
    fontSize: 12,
  },

  // Contador
  contador: {
    flexDirection: 'row',
    backgroundColor: Colors.branco,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borda,
    overflow: 'hidden',
  },
  contadorBotao: {
    width: 48,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.fundoSuave,
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
    color: Colors.carvao,
    fontFamily: Fonte.tituloSemi,
    fontSize: 20,
  },
  contadorSufixo: {
    ...Typography.caption,
    color: Colors.textoSecundario,
    fontSize: 12,
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
    color: Colors.erro,
    fontSize: 12,
    fontFamily: Fonte.corpoSemi,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.branco,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borda,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  modalTitulo: {
    ...Typography.h3,
    color: Colors.carvao,
    fontFamily: Fonte.corpoSemi,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  modalLabel: {
    ...Typography.bodyBold,
    color: Colors.carvao,
    marginBottom: 7,
    fontFamily: Fonte.corpoSemi,
    fontSize: 13,
    marginTop: 4,
  },
  modalInputWrapper: {
    backgroundColor: Colors.fundoSuave,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: Colors.borda,
    marginBottom: 14,
  },
  modalInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...Typography.body,
    color: Colors.carvao,
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
    backgroundColor: Colors.fundoSuave,
    alignItems: 'center',
  },
  modalBotaoCancelarTexto: {
    color: Colors.carvao,
    fontSize: 14,
    fontFamily: Fonte.corpoSemi,
  },
  modalBotaoConfirmar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.azul,
    alignItems: 'center',
  },
  modalBotaoDesabilitado: {
    opacity: 0.4,
  },
  modalBotaoConfirmarTexto: {
    color: Colors.branco,
    fontSize: 14,
    fontFamily: Fonte.corpoSemi,
  },

  // Opções do Select
  selectOpcao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fundoSuave,
  },
  selectOpcaoActiva: {
    backgroundColor: Colors.azulSuave,
  },
  selectOpcaoTexto: {
    ...Typography.body,
    color: Colors.carvao,
    fontSize: 15,
  },

  // Constructor
  vazioBox: {
    backgroundColor: Colors.fundoSuave,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borda,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  vazioTitulo: {
    ...Typography.bodyBold,
    color: Colors.carvao,
    fontFamily: Fonte.corpoSemi,
    fontSize: 14,
  },
  vazioTexto: {
    ...Typography.caption,
    color: Colors.textoSecundario,
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
    backgroundColor: Colors.branco,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borda,
    gap: 10,
  },
  itemCampoNome: {
    ...Typography.caption,
    color: Colors.textoSecundario,
    fontSize: 12,
    marginBottom: 2,
    fontFamily: Fonte.corpoSemi,
  },
  itemCampoValor: {
    ...Typography.bodyBold,
    color: Colors.carvao,
    fontFamily: Fonte.corpoSemi,
    fontSize: 14,
  },
  itemCampoRemover: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.erroFundo,
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
    backgroundColor: Colors.azulSuave,
    borderWidth: 1.5,
    borderColor: Colors.azul,
    borderStyle: 'dashed',
    gap: 7,
  },
  adicionarBotaoTexto: {
    ...Typography.button,
    color: Colors.azulTexto,
    fontFamily: Fonte.corpoSemi,
    fontSize: 13,
    flex: 1,
    textAlign: 'center',
  },
  adicionarBotaoContador: {
    ...Typography.caption,
    color: Colors.textoSecundario,
    fontSize: 12,
  },
});