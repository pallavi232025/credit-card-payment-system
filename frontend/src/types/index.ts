/**
 * TypeScript types for the Credit Card Payment System.
 */

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'USER' | 'ADMIN';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  card_count?: number;
  transaction_count?: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  user: User;
  access: string;
  refresh: string;
}

export interface Card {
  id: number;
  card_holder_name: string;
  masked_card_number: string;
  last_four_digits: string;
  card_type: 'CREDIT' | 'DEBIT';
  card_brand: 'VISA' | 'MASTERCARD' | 'AMEX' | 'OTHER';
  expiry_month: number;
  expiry_year: number;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

export interface Transaction {
  id: number;
  transaction_reference: string;
  amount: string;
  currency: string;
  description: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  failure_reason: string;
  card_last_four: string | null;
  card_brand: string | null;
  user_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors: Array<{ field: string; message: string }>;
}

export interface DashboardStats {
  card_count: number;
  total_transactions: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  total_success_amount: string;
  recent_transactions: Transaction[];
}

export interface AdminDashboardStats {
  total_users: number;
  total_cards: number;
  total_transactions: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  total_success_amount: string;
  today_transactions: number;
  today_success_amount: string;
}

export interface DailySummary {
  date: string;
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  pending_transactions: number;
  successful_amount: string;
  failed_amount: string;
}

export interface AdminLog {
  id: number;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  ip_address: string;
  created_at: string;
}

export interface PaymentRequest {
  card_id: number;
  amount: number;
  currency: string;
  description: string;
}

export interface PaymentResponse {
  transaction_id: number;
  transaction_reference: string;
  status: string;
  amount: string;
  currency: string;
  message: string;
  description: string;
  failure_reason: string;
}
