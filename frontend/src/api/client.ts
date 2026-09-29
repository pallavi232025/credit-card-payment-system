/**
 * Centralized Axios API client with JWT interceptors.
 */
import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const PAYMENT_API_BASE_URL = import.meta.env.VITE_PAYMENT_API_BASE_URL || 'http://localhost:8001/api';

/** Django API client */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/** FastAPI payment client */
export const paymentClient = axios.create({
  baseURL: PAYMENT_API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to attach JWT
const attachToken = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

apiClient.interceptors.request.use(attachToken);
paymentClient.interceptors.request.use(attachToken);

// Response interceptor for 401 handling
const handleAuthError = (error: AxiosError) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

apiClient.interceptors.response.use((r) => r, handleAuthError);
paymentClient.interceptors.response.use((r) => r, handleAuthError);
