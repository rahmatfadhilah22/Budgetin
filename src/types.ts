export type Currency = 'USD' | 'IDR';

export type PeriodType = 'monthly' | 'weekly';

export type ViewType = 'dashboard' | 'transactions' | 'categories' | 'recurring' | 'settings';

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  budget: number;
  icon: string; // Material symbol icon name e.g. 'shopping_cart', 'home', 'directions_car'
  color?: string;
}

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  categoryId?: string;
  date: string; // ISO or human string e.g. "Today", "Yesterday", "2026-08-23"
  type: 'expense' | 'income';
  isDraft?: boolean;
  isRecurring?: boolean;
  note?: string;
  createdAt: number;
}

export interface RecurringTemplate {
  id: string;
  name: string;
  categoryId: string;
  defaultAmount: number;
  dueDay: number; // Day of month e.g. 1, 15, 28
  frequency: 'monthly' | 'weekly' | 'yearly';
  icon: string;
  lastPaidDate?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  currency: Currency;
  period: PeriodType;
  cycleStartDay: number;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface BudgetNotification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'reminder';
  date: string;
  actionUrl?: ViewType;
  read: boolean;
}
