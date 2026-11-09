/**
 * Perfil do utilizador (dados pessoais, papel, modo convidado).
 *
 * API esperada: GET/PUT /perfil  → UsuarioPerfil   (a autenticação continua em authService)
 * O papel e o modo convidado são preferências do dispositivo e ficam só locais.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { criarRecurso } from './recurso';

const KEY_PAPEL = '@gohome_user_v2_papel';
const KEY_MODO_CONVIDADO = '@gohome_user_v2_modo_conv';

const usuario = criarRecurso<any>({ chave: '@gohome_user_v2_usuario', endpoint: '/perfil', nome: 'perfil' });

const seguro = async <T,>(f: () => Promise<T>, vazio: T): Promise<T> => { try { return await f(); } catch { return vazio; } };

export const perfilService = {
  async carregar() {
    const [u, papel, modo] = await Promise.all([
      usuario.carregar(),
      seguro(() => AsyncStorage.getItem(KEY_PAPEL), null),
      seguro(() => AsyncStorage.getItem(KEY_MODO_CONVIDADO), null),
    ]);
    return { usuario: u && typeof u === 'object' ? u : null, papel: (papel as 'procurador' | 'anunciante' | null) || null, modoConvidado: modo === 'true' };
  },
  guardarUsuario: (u: any | null) => (u ? usuario.guardar(u) : usuario.limpar()),
  guardarPapel: (papel: string | null) => seguro(() => (papel ? AsyncStorage.setItem(KEY_PAPEL, papel) : AsyncStorage.removeItem(KEY_PAPEL)), undefined),
  guardarModoConvidado: (v: boolean) => seguro(() => AsyncStorage.setItem(KEY_MODO_CONVIDADO, String(v)), undefined),
  async limpar() {
    await Promise.all([usuario.limpar(), seguro(() => AsyncStorage.multiRemove([KEY_PAPEL, KEY_MODO_CONVIDADO]), undefined)]);
  },
};
