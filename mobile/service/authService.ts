import { api } from './api';
import * as SecureStore from 'expo-secure-store';
import {
  RegisterDto,
  LoginDto,
  AuthResponse,
  TwoFactorSetupResponse,
  UserProfile,
  TwoFactorLoginDto,
} from '../src/types/auth.type';

class AuthService {
  /**
   * Registra um novo usuário
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', dto);
    return response.data;
  }

  /**
   * Realiza o login inicial (pode retornar token normal ou requerer 2FA)
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', dto);
    
    // Se o login for bem-sucedido diretamente (sem 2FA), já salvamos o token
    if (response.data.accessToken) {
      await this.saveToken(response.data.accessToken);
    }
    
    return response.data;
  }

  /**
   * Realiza o login utilizando o código de 2FA e o token temporário
   */
  async loginWithTwoFactor(tempToken: string, code: string): Promise<AuthResponse> {
    const payload: TwoFactorLoginDto = { tempToken, code };
    const response = await api.post<AuthResponse>('/auth/2fa/login', payload);

    if (response.data.accessToken) {
      await this.saveToken(response.data.accessToken);
    }

    return response.data;
  }

  /**
   * Inicia a configuração do 2FA (gera segredo/QR Code) - Requer Autenticação
   */
  async setupTwoFactor(): Promise<TwoFactorSetupResponse> {
    const response = await api.post<TwoFactorSetupResponse>('/auth/2fa/setup');
    return response.data;
  }

  /**
   * Habilita definitivamente o 2FA após validar o primeiro código - Requer Autenticação
   */
  async enableTwoFactor(code: string): Promise<{ message: string }> {
    const response = await api.post('/auth/2fa/enable', { code });
    return response.data;
  }

  /**
   * Obtém os dados do usuário logado atual - Requer Autenticação
   */
  async getProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>('/auth/me');
    return response.data;
  }

  /**
   * Realiza o logout limpando o armazenamento seguro
   */
  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('user_token');
  }

  /**
   * Método auxiliar privado para salvar o token
   */
  private async saveToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('user_token', token);
  }

  /**
   * Verifica se o usuário possui sessão ativa
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('user_token');
    return !!token;
  }
}

export const authService = new AuthService();