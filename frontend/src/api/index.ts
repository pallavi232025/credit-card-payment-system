/**
 * API service functions for all endpoints.
 */
import { apiClient, paymentClient } from './client';
import type {
  ApiResponse, User, Card, Transaction, Pagination,
  DashboardStats, AdminDashboardStats, DailySummary, AdminLog,
  PaymentRequest, PaymentResponse, LoginResponse,
} from '../types';

// ===== Auth =====
export const authAPI = {
  register: (data: { email: string; first_name: string; last_name: string; password: string; confirm_password: string }) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/register/', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login/', data),

  logout: (refresh: string) =>
    apiClient.post<ApiResponse>('/auth/logout/', { refresh }),

  getProfile: () =>
    apiClient.get<ApiResponse<User>>('/auth/profile/'),

  getDashboard: () =>
    apiClient.get<ApiResponse<DashboardStats>>('/auth/dashboard/'),

  refreshToken: (refresh: string) =>
    apiClient.post<{ access: string }>('/auth/token/refresh/', { refresh }),
};

// ===== Cards =====
export const cardAPI = {
  list: () =>
    apiClient.get<ApiResponse<Card[]>>('/cards/'),

  add: (data: { card_number: string; card_holder_name: string; expiry_month: number; expiry_year: number; card_type: string }) =>
    apiClient.post<ApiResponse<Card>>('/cards/', data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse>(`/cards/${id}/`),
};

// ===== Transactions =====
export const transactionAPI = {
  list: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<{ transactions: Transaction[]; pagination: Pagination }>>('/transactions/', { params }),

  detail: (id: number) =>
    apiClient.get<ApiResponse<Transaction>>(`/transactions/${id}/`),
};

// ===== Payments (FastAPI) =====
export const paymentAPI = {
  process: (data: PaymentRequest, idempotencyKey?: string) =>
    paymentClient.post<ApiResponse<PaymentResponse>>('/payments/', data, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
    }),
};

// ===== Admin =====
export const adminAPI = {
  getDashboard: () =>
    apiClient.get<ApiResponse<AdminDashboardStats>>('/admin/dashboard/'),

  getUsers: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<{ users: User[]; pagination: Pagination }>>('/admin/users/', { params }),

  getUserDetail: (id: number) =>
    apiClient.get<ApiResponse<User>>(`/admin/users/${id}/`),

  updateUser: (id: number, data: { is_active: boolean }) =>
    apiClient.patch<ApiResponse<User>>(`/admin/users/${id}/`, data),

  getCards: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<{ cards: Card[]; pagination: Pagination }>>('/admin/cards/', { params }),

  getTransactions: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<{ transactions: Transaction[]; pagination: Pagination }>>('/admin/transactions/', { params }),

  getDailySummary: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<{ daily_summary: DailySummary[] }>>('/admin/reports/daily-summary/', { params }),

  exportCSV: (params?: Record<string, string>) =>
    apiClient.get('/admin/transactions/export/', { params, responseType: 'blob' }),

  getLogs: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<{ logs: AdminLog[]; pagination: Pagination }>>('/admin/logs/', { params }),
};
