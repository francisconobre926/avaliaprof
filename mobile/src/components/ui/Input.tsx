/**
 * Input — Campo de entrada profissional GoHome
 *
 * Tipos: text | password | phone | number | email | textarea
 * Suporta: label, icon left/right, error state, hint, counter, prefix (+258)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCores } from '../../store/themeStore';

import { Fonte } from '../../theme/fonts';
export type InputType = 'text' | 'password' | 'phone' | 'number' | 'email' | 'textarea';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  type?: InputType;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  iconLeft?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  onIconRightPress?: () => void;
  error?: string;
  hint?: string;
  prefix?: string;              // ex: "+258"
  maxLength?: number;
  showCounter?: boolean;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  value,
  onChangeText,
  placeholder,
  iconLeft,
  iconRight,
  onIconRightPress,
  error,
  hint,
  prefix,
  maxLength,
  showCounter = false,
  disabled = false,
  containerStyle,
  ...rest
}) => {
  const cores = useCores();
  const [focado, setFocado] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const temErro = !!error;
  const borderColor = temErro
    ? cores.erro
    : focado
    ? cores.principal
    : cores.bordaSubtil;

  const keyboardType =
    type === 'phone' ? 'phone-pad' :
    type === 'number' ? 'numeric' :
    type === 'email' ? 'email-address' : 'default';

  const secureEntry = type === 'password' && !mostrarPassword;
  const multiline = type === 'textarea';

  const iconRightComputed: keyof typeof Ionicons.glyphMap | undefined = (() => {
    if (type === 'password') return mostrarPassword ? 'eye-off-outline' : 'eye-outline';
    return iconRight;
  })();

  const handleIconRightPress = () => {
    if (type === 'password') return setMostrarPassword(!mostrarPassword);
    onIconRightPress?.();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: cores.textoSecundario }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: disabled ? cores.fundoSuave : cores.fundoElevado,
            borderColor,
            minHeight: multiline ? 100 : 52,
          },
        ]}
      >
        {iconLeft && (
          <Ionicons
            name={iconLeft}
            size={20}
            color={focado ? cores.principal : cores.textoTerciario}
          />
        )}

        {prefix && (
          <Text style={[styles.prefix, { color: cores.textoSecundario }]}>
            {prefix}
          </Text>
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={cores.textoTerciario}
          keyboardType={keyboardType}
          secureTextEntry={secureEntry}
          multiline={multiline}
          maxLength={maxLength}
          editable={!disabled}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          style={[
            styles.input,
            {
              color: cores.textoPrincipal,
              textAlignVertical: multiline ? 'top' : 'center',
              paddingTop: multiline ? 12 : 0,
            },
          ]}
          {...rest}
        />

        {iconRightComputed && (
          <TouchableOpacity onPress={handleIconRightPress} hitSlop={10}>
            <Ionicons
              name={iconRightComputed}
              size={20}
              color={focado ? cores.principal : cores.textoTerciario}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.rodape}>
        <View style={{ flex: 1 }}>
          {temErro ? (
            <Text style={[styles.erro, { color: cores.erro }]}>{error}</Text>
          ) : hint ? (
            <Text style={[styles.hint, { color: cores.textoTerciario }]}>{hint}</Text>
          ) : null}
        </View>
        {showCounter && maxLength && (
          <Text style={[styles.contador, { color: cores.textoTerciario }]}>
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 4 },
  label: { fontSize: 13, fontFamily: Fonte.corpoSemi, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, fontFamily: Fonte.corpoMedio, paddingVertical: 0 },
  prefix: { fontSize: 15, fontFamily: Fonte.corpoSemi },
  rodape: { flexDirection: 'row', marginTop: 6, paddingHorizontal: 4 },
  erro: { fontSize: 12, fontFamily: Fonte.corpoSemi },
  hint: { fontFamily: Fonte.corpo, fontSize: 12 },
  contador: { fontFamily: Fonte.corpo, fontSize: 12 },
});

export default Input;