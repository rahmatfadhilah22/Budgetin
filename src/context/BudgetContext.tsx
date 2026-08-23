import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Category,
  Transaction,
  RecurringTemplate,
  UserProfile,
  BudgetNotification,
  Currency,
  PeriodType,
  ViewType,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_RECURRING,
  INITIAL_USER,
  INITIAL_NOTIFICATIONS,
} from '../data/initialData';

interface BudgetContextType {
  // State
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  categories: Category[];
  transactions: Transaction[];
  recurring: RecurringTemplate[];
  user: UserProfile;
  notifications: BudgetNotification[];
  privacyMode: boolean;
  setPrivacyMode: React.Dispatch<React.SetStateAction<boolean>>;
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  reviewDraftsOpen: boolean;
  setReviewDraftsOpen: (open: boolean) => void;

  // Currency & formatting
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatCurrency: (amount: number, overrideCurrency?: Currency) => string;
  period: PeriodType;
  setPeriod: (p: PeriodType) => void;
  cycleDateRange: string;

  // Computed metrics
  totalIncome: number;
  totalExpenses: number;
  remainingBalance: number;
  drafts: Transaction[];
  draftCount: number;
  unpaidRecurring: RecurringTemplate[];

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  completeDraft: (id: string, categoryId: string, note?: string) => void;

  addCategory: (cat: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, cat: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addRecurring: (rec: Omit<RecurringTemplate, 'id'>) => RecurringTemplate;
  updateRecurring: (id: string, rec: Partial<RecurringTemplate>) => void;
  deleteRecurring: (id: string) => void;
  logRecurringPayment: (id: string) => void;

  updateUser: (updates: Partial<UserProfile>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Data management
  exportCSV: () => void;
  exportJSON: () => void;
  importJSON: (jsonString: string) => boolean;
  resetToSampleData: () => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CATEGORIES: 'budget_app_categories',
  TRANSACTIONS: 'budget_app_transactions',
  RECURRING: 'budget_app_recurring',
  USER: 'budget_app_user',
  NOTIFICATIONS: 'budget_app_notifications',
  PRIVACY: 'budget_app_privacy',
};

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [reviewDraftsOpen, setReviewDraftsOpen] = useState(false);

  // Initialize from LocalStorage or initial data
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [recurring, setRecurring] = useState<RecurringTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECURRING);
      return saved ? JSON.parse(saved) : INITIAL_RECURRING;
    } catch {
      return INITIAL_RECURRING;
    }
  });

  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  });

  const [notifications, setNotifications] = useState<BudgetNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRIVACY);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(recurring));
  }, [recurring]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRIVACY, JSON.stringify(privacyMode));
  }, [privacyMode]);

  // Currency
  const currency = user.currency;
  const setCurrency = (c: Currency) => {
    setUser((prev) => ({ ...prev, currency: c }));
  };

  const period = user.period;
  const setPeriod = (p: PeriodType) => {
    setUser((prev) => ({ ...prev, period: p }));
  };

  // Date Range calculation for active cycle (e.g. 25 Jul - 24 Aug or weekly)
  const cycleDateRange = useMemo(() => {
    if (period === 'weekly') {
      return '17 Aug - 23 Aug';
    }
    return '25 Jul - 24 Aug';
  }, [period]);

  // Format currency
  const formatCurrency = (amount: number, overrideCurrency?: Currency): string => {
    if (privacyMode) {
      return '••••••';
    }
    const curr = overrideCurrency || currency;
    if (curr === 'IDR') {
      // In IDR, typically numbers are scaled or formatted as Rp 50,000 / Rp 4,250,000
      // If amount is small (like base USD unit < 5000), let's scale to realistic Rupiah or format directly
      const idrValue = amount < 1000 ? amount * 1000 : amount;
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(idrValue).replace('IDR', 'Rp');
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Drafts & Completed Calculations
  const drafts = useMemo(() => {
    return transactions.filter((t) => t.isDraft);
  }, [transactions]);

  const draftCount = drafts.length;

  const completedTransactions = useMemo(() => {
    return transactions.filter((t) => !t.isDraft);
  }, [transactions]);

  const totalIncome = useMemo(() => {
    return completedTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [completedTransactions]);

  const totalExpenses = useMemo(() => {
    return completedTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [completedTransactions]);

  const remainingBalance = totalIncome - totalExpenses;

  // Unpaid recurring items (for top warning banner)
  const unpaidRecurring = useMemo(() => {
    return recurring.filter((r) => !r.lastPaidDate);
  }, [recurring]);

  // Transaction CRUD
  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now(),
    };
    setTransactions((prev) => [newTx, ...prev]);
    return newTx;
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const completeDraft = (id: string, categoryId: string, note?: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            categoryId,
            note: note !== undefined ? note : t.note,
            isDraft: false,
          };
        }
        return t;
      })
    );
  };

  // Category CRUD
  const addCategory = (cat: Omit<Category, 'id'>): Category => {
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setCategories((prev) => [...prev, newCat]);
    return newCat;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Recurring CRUD
  const addRecurring = (rec: Omit<RecurringTemplate, 'id'>): RecurringTemplate => {
    const newRec: RecurringTemplate = {
      ...rec,
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setRecurring((prev) => [...prev, newRec]);
    return newRec;
  };

  const updateRecurring = (id: string, updates: Partial<RecurringTemplate>) => {
    setRecurring((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const deleteRecurring = (id: string) => {
    setRecurring((prev) => prev.filter((r) => r.id !== id));
  };

  const logRecurringPayment = (id: string) => {
    const recItem = recurring.find((r) => r.id === id);
    if (!recItem) return;

    // Add transaction
    addTransaction({
      merchant: recItem.name,
      amount: recItem.defaultAmount,
      categoryId: recItem.categoryId,
      date: 'Today',
      type: 'expense',
      isRecurring: true,
      note: `Recurring payment for ${recItem.name}`,
    });

    // Mark as paid
    updateRecurring(id, {
      lastPaidDate: new Date().toISOString().split('T')[0],
    });
  };

  // User & Notifications
  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Data Export & Import
  const exportCSV = () => {
    const headers = ['ID', 'Date', 'Merchant', 'Type', 'Amount', 'Category', 'IsDraft', 'IsRecurring', 'Note'];
    const rows = transactions.map((t) => {
      const cat = categories.find((c) => c.id === t.categoryId)?.name || 'Uncategorized';
      return [
        `"${t.id}"`,
        `"${t.date}"`,
        `"${t.merchant.replace(/"/g, '""')}"`,
        `"${t.type}"`,
        t.amount,
        `"${cat}"`,
        t.isDraft ? 'Yes' : 'No',
        t.isRecurring ? 'Yes' : 'No',
        `"${(t.note || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `budget_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user,
      categories,
      transactions,
      recurring,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `budget_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.categories && Array.isArray(parsed.categories)) {
        setCategories(parsed.categories);
      }
      if (parsed.transactions && Array.isArray(parsed.transactions)) {
        setTransactions(parsed.transactions);
      }
      if (parsed.recurring && Array.isArray(parsed.recurring)) {
        setRecurring(parsed.recurring);
      }
      if (parsed.user) {
        setUser(parsed.user);
      }
      return true;
    } catch {
      return false;
    }
  };

  const resetToSampleData = () => {
    setCategories(INITIAL_CATEGORIES);
    setTransactions(INITIAL_TRANSACTIONS);
    setRecurring(INITIAL_RECURRING);
    setUser(INITIAL_USER);
    setNotifications(INITIAL_NOTIFICATIONS);
    setPrivacyMode(false);
  };

  return (
    <BudgetContext.Provider
      value={{
        currentView,
        setCurrentView,
        categories,
        transactions,
        recurring,
        user,
        notifications,
        privacyMode,
        setPrivacyMode,
        quickAddOpen,
        setQuickAddOpen,
        reviewDraftsOpen,
        setReviewDraftsOpen,
        currency,
        setCurrency,
        formatCurrency,
        period,
        setPeriod,
        cycleDateRange,
        totalIncome,
        totalExpenses,
        remainingBalance,
        drafts,
        draftCount,
        unpaidRecurring,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        completeDraft,
        addCategory,
        updateCategory,
        deleteCategory,
        addRecurring,
        updateRecurring,
        deleteRecurring,
        logRecurringPayment,
        updateUser,
        markNotificationRead,
        clearNotifications,
        exportCSV,
        exportJSON,
        importJSON,
        resetToSampleData,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};
