import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL, API_TIMEOUT_MS } from './config';

export const api = axios.create({
  baseURL: API_URL || undefined,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar o token JWT em rotas protegidas
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('user_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // SecureStore indisponível (ex.: web) — segue sem token.
    }
    return config;
  },
  (error) => Promise.reject(error)
);
