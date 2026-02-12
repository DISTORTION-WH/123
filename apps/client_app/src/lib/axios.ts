// apps/client_app/src/lib/axios.ts

import axios from 'axios';

// Базовый URL API Core Microservice
// Обычно это http://localhost:3000 или через nginx
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена
api.interceptors.request.use(
  (config) => {
    // В реальном проекте токен лучше хранить в cookies или local storage
    // Здесь пример получения из localStorage (клиентская сторона)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor для обработки 401 (Refresh Token logic можно добавить позже)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Логика разлогинивания или обновления токена
      if (typeof window !== 'undefined') {
        // localStorage.removeItem('accessToken');
        // window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  },
);