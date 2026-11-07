import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Substitua pela URL da sua API (ex: IP local da máquina para desenvolvimento mobile)
const API_BASE_URL = 'http://10.21.75.119:8081'; 

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar o token JWT em rotas protegidas
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('user_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

