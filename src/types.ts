export type PeriodType = 'monthly' | 'weekly';

export type ViewType = 'dashboard' | 'transactions' | 'categories' | 'recurring' | 'settings';

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  /** Integer amount in IDR rupiah. */
  budget: number;
  icon: string; // Material symbol icon name e.g. 'shopping_cart', 'home'
}

export interface Transaction {
  id: string;
  merchant: string;
  /** Integer amount in IDR rupiah. */
  amount: number;
  categoryId?: string;
  /** ISO date YYYY-MM-DD. */
  date: string;
  type: 'expense' | 'income';
  isDraft?: boolean;
  isRecurring?: boolean;
  note?: string;
  createdAt: number;
  /** Set when the transaction was created by logging a recurring template. */
  templateId?: string;
}

export interface RecurringTemplate {
  id: string;
  name: string;
  categoryId: string;
  /** Integer amount in IDR rupiah. */
  defaultAmount: number;
  dueDay: number;
  frequency: 'monthly' | 'weekly' | 'yearly';
  icon: string;
  lastPaidDate?: string;
}

export interface Settings {
  name: string;
  email: string;
  cycleStartDay: number;
  period: PeriodType;
  notificationsEnabled: boolean;
}

export interface BudgetSnapshot {
  categories: Category[];
  transactions: Transaction[];
  recurring: RecurringTemplate[];
  settings: Settings;
}
