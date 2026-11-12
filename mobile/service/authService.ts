/**
 * Autenticação contra a API REST (`/auth/*`, `/me`).
 * Token em SecureStore; o último perfil conhecido fica em AsyncStorage para a app
 * abrir sem rede (a sessão só termina por logout ou por 401 do servidor).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import type { Utilizador } from '../src/types';
import { api, CHAVE_REFRESH, CHAVE_TOKEN, guardarTokens } from './api';
import { API_URL } from './config';
import { traduzirErro } from './erro';

const CHAVE_PERFIL = '@avaliaprof_perfil_v1';

/** O registo livre está fechado: só activa a conta de quem a administração já cadastrou (email + número). */
export interface DadosRegisto {
  numeroEstudante: string;
  email: string;
  senha: string;
}

export interface DadosActivacaoDocente {
  email: string;
  codigo: string;
  senha: string;
}

interface UtilizadorApi {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  studentNumber: string | null;
  courseId: string | null;
  courseName: string | null;
  photoUrl: string | null;
}

/** URLs de fotografia chegam relativas (`/uploads/...`); tornam-se absolutas aqui. */
export const urlAbsoluto = (url?: string | null): string | null =>
  url ? (url.startsWith('http') ? url : `${API_URL}${url}`) : null;

const paraUtilizador = (u: UtilizadorApi): Utilizador => ({
  id: u.id,
  nome: u.name,
  email: u.email,
  papel: u.role === 'ADMIN' ? 'admin' : u.role === 'TEACHER' ? 'docente' : 'estudante',
  numeroEstudante: u.studentNumber ?? '',
  cursoId: u.courseId ?? '',
  cursoNome: u.courseName,
  foto: urlAbsoluto(u.photoUrl),
});

const guardarPerfil = (u: Utilizador) => AsyncStorage.setItem(CHAVE_PERFIL, JSON.stringify(u)).catch(() => {});

async function abrirSessao(token: string, refreshToken: string, u: UtilizadorApi): Promise<Utilizador> {
  await guardarTokens(token, refreshToken);
  const utilizador = paraUtilizador(u);
  await guardarPerfil(utilizador);
  return utilizador;
}

export const authService = {
  async registar(d: DadosRegisto): Promise<Utilizador> {
    try {
      const { data } = await api.post('/auth/register', {
        studentNumber: d.numeroEstudante,
        email: d.email,
        password: d.senha,
      });
      return await abrirSessao(data.token, data.refreshToken, data.user);
    } catch (e) {
      throw traduzirErro(e);
    }
  },

  /** Activa a conta de docente com o código de convite entregue pela administração. */
  async activarDocente(d: DadosActivacaoDocente): Promise<Utilizador> {
    try {
      const { data } = await api.post('/auth/activate-teacher', { email: d.email, code: d.codigo, password: d.senha });
      return await abrirSessao(data.token, data.refreshToken, data.user);
    } catch (e) {
      throw traduzirErro(e);
    }
  },

  async entrar(email: string, senha: string): Promise<Utilizador> {
    try {
      const { data } = await api.post('/auth/login', { email, password: senha });
      return await abrirSessao(data.token, data.refreshToken, data.user);
    } catch (e) {
      throw traduzirErro(e);
    }
  },

  /**
   * Restaura a sessão no arranque. Com rede, confirma o token no servidor; sem rede,
   * usa o último perfil guardado. Token recusado (401) ou inexistente => sem sessão.
   */
  async restaurarSessao(): Promise<Utilizador | null> {
    try {
      const token = await SecureStore.getItemAsync(CHAVE_TOKEN);
      if (!token) return null;
      try {
        const { data } = await api.get<UtilizadorApi>('/me');
        const u = paraUtilizador(data);
        await guardarPerfil(u);
        return u;
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 401) {
          await this.terminarSessao();
          return null;
        }
        const raw = await AsyncStorage.getItem(CHAVE_PERFIL);
        return raw ? (JSON.parse(raw) as Utilizador) : null;
      }
    } catch {
      return null;
    }
  },

  /** Com `avisarServidor` (logout pedido pelo utilizador) revoga também o token de renovação no servidor. */
  async terminarSessao(avisarServidor = false): Promise<void> {
    if (avisarServidor) {
      try {
        const refreshToken = await SecureStore.getItemAsync(CHAVE_REFRESH);
        await api.post('/auth/logout', { refreshToken: refreshToken ?? undefined }, { timeout: 4000 });
      } catch { /* sem rede ou sessão já inválida: o token expira sozinho */ }
    }
    try { await SecureStore.deleteItemAsync(CHAVE_TOKEN); } catch { /* nada guardado */ }
    try { await SecureStore.deleteItemAsync(CHAVE_REFRESH); } catch { /* nada guardado */ }
    try { await AsyncStorage.removeItem(CHAVE_PERFIL); } catch { /* nada guardado */ }
  },

  /** Termina a sessão aqui e em todos os outros dispositivos. */
  async terminarTodasSessoes(): Promise<void> {
    try { await api.post('/auth/logout-all'); } catch (e) { throw traduzirErro(e); }
    await this.terminarSessao();
  },

  /** Muda a senha (exige a actual). As outras sessões terminam; este dispositivo recebe tokens novos. */
  async alterarSenha(atual: string, nova: string): Promise<void> {
    try {
      const { data } = await api.post<{ token: string; refreshToken: string }>('/me/password', { currentPassword: atual, newPassword: nova });
      await guardarTokens(data.token, data.refreshToken);
    } catch (e) {
      throw traduzirErro(e);
    }
  },

  /** Passo 1. A API responde sempre igual para não revelar que emails têm conta. */
  async pedirCodigoRecuperacao(email: string): Promise<void> {
    try { await api.post('/auth/forgot', { email }); } catch (e) { throw traduzirErro(e); }
  },

  /** Passo 2: valida o código e define a nova senha. */
  async redefinirSenha(email: string, codigo: string, novaSenha: string): Promise<void> {
    try { await api.post('/auth/reset', { email, code: codigo, newPassword: novaSenha }); } catch (e) { throw traduzirErro(e); }
  },

  /** Actualiza o nome e a fotografia (envia ficheiro novo, ou remove se `foto` for null). O curso vem do cadastro. */
  async atualizarPerfil(
    alteracoes: Partial<Pick<Utilizador, 'nome' | 'foto'>>,
    fotoAtual: string | null | undefined,
  ): Promise<Utilizador> {
    try {
      let dados: UtilizadorApi | undefined;
      if (alteracoes.nome !== undefined) {
        dados = (await api.patch<UtilizadorApi>('/me', { name: alteracoes.nome })).data;
      }
      if ('foto' in alteracoes && alteracoes.foto !== fotoAtual) {
        if (alteracoes.foto == null) {
          dados = (await api.delete<UtilizadorApi>('/me/photo')).data;
        } else if (!alteracoes.foto.startsWith('http')) {
          const form = new FormData();
          const ext = /\.(png|webp)$/i.exec(alteracoes.foto)?.[1]?.toLowerCase() ?? 'jpg';
          form.append('photo', { uri: alteracoes.foto, name: `foto.${ext}`, type: `image/${ext === 'jpg' ? 'jpeg' : ext}` } as unknown as Blob);
          dados = (await api.post<UtilizadorApi>('/me/photo', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
        }
      }
      if (!dados) dados = (await api.get<UtilizadorApi>('/me')).data;
      const u = paraUtilizador(dados);
      await guardarPerfil(u);
      return u;
    } catch (e) {
      throw traduzirErro(e);
    }
  },
};
