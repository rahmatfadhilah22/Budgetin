import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  Category,
  Transaction,
  RecurringTemplate,
  Settings,
  BudgetSnapshot,
  PeriodType,
  ViewType,
} from '../types';
import { api, ApiError } from '../api';
import { getCycle, shiftCycle, formatRange, type Cycle } from '../cycle';

export type AuthStatus = 'checking' | 'anonymous' | 'authenticated';

interface BudgetContextType {
  // Auth & boot
  authStatus: AuthStatus;
  bootError: string | null;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  retry: () => void;

  // View state
  currentView: ViewType;
  navigateView: (view: ViewType) => void;
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  privacyMode: boolean;
  setPrivacyMode: React.Dispatch<React.SetStateAction<boolean>>;

  // Data
  categories: Category[];
  transactions: Transaction[];
  recurring: RecurringTemplate[];
  settings: Settings;

  // Currency & formatting
  formatCurrency: (amount: number) => string;
  period: PeriodType;
  setPeriod: (p: PeriodType) => void;
  cycleDateRange: string;

  // Active budget cycle
  activeCycle: Cycle;
  cycleTransactions: Transaction[];
  prevCycle: () => void;
  nextCycle: () => void;
  resetCycle: () => void;

  // Computed metrics
  totalIncome: number;
  totalExpenses: number;
  remainingBalance: number;
  drafts: Transaction[];
  draftCount: number;
  unpaidRecurring: RecurringTemplate[];

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  completeDraft: (id: string, categoryId: string, note?: string) => Promise<void>;

  addCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  addRecurring: (rec: Omit<RecurringTemplate, 'id'>) => Promise<void>;
  updateRecurring: (id: string, rec: Partial<RecurringTemplate>) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  logRecurringPayment: (id: string) => Promise<void>;

  updateSettings: (updates: Partial<Settings>) => Promise<void>;

  // Data management (client-side from current snapshot)
  exportCSV: () => void;
  exportJSON: () => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

const EMPTY_SNAPSHOT: BudgetSnapshot = {
  categories: [],
  transactions: [],
  recurring: [],
  settings: { name: '', email: '', cycleStartDay: 1, period: 'monthly', notificationsEnabled: true },
};

const TODAY_LABEL = new Date().toISOString().slice(0, 10);

const VIEWS: ViewType[] = ['dashboard', 'transactions', 'categories', 'recurring', 'settings'];

function viewFromHash(): ViewType {
  const hash = window.location.hash.replace(/^#\/?/, '') as ViewType;
  return VIEWS.includes(hash) ? hash : 'dashboard';
}

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');
  const [bootError, setBootError] = useState<string | null>(null);
  const [data, setData] = useState<BudgetSnapshot>(EMPTY_SNAPSHOT);
  const [currentView, setCurrentView] = useState<ViewType>(viewFromHash);
  const [cycleOffset, setCycleOffset] = useState(0);

  // Hash-based routing: refresh / back-forward keeps the same view.
  useEffect(() => {
    const onHash = () => setCurrentView(viewFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigateView = useCallback((view: ViewType) => {
    setCurrentView(view);
    if (window.location.hash !== `#/${view}`) {
      window.location.hash = `/${view}`;
    }
  }, []);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);

  const loadData = useCallback(async () => {
    const snapshot = await api<BudgetSnapshot>('/api/data');
    setData(snapshot);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api('/api/session');
        if (cancelled) return;
        await loadData();
        if (cancelled) return;
        setAuthStatus('authenticated');
      } catch {
        if (!cancelled) setAuthStatus('anonymous');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const retry = useCallback(async () => {
    setBootError(null);
    setAuthStatus('checking');
    try {
      await loadData();
      setAuthStatus('authenticated');
    } catch (error) {
      setBootError(error instanceof ApiError ? error.message : 'Could not load data');
    }
  }, [loadData]);

  const login = useCallback(async (password: string) => {
    await api<{ authenticated: boolean }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    await loadData();
    setAuthStatus('authenticated');
  }, [loadData]);

  const logout = useCallback(async () => {
    try {
      await api<void>('/api/logout', { method: 'POST' });
    } finally {
      setData(EMPTY_SNAPSHOT);
      setAuthStatus('anonymous');
      setCurrentView('dashboard');
    }
  }, []);

  // Derived metrics
  const drafts = useMemo(() => data.transactions.filter((t) => t.isDraft), [data.transactions]);
  const draftCount = drafts.length;
  const completedTransactions = useMemo(
    () => data.transactions.filter((t) => !t.isDraft),
    [data.transactions]
  );

  const period = data.settings.period;
  const cycleStartDay = data.settings.cycleStartDay;

  // Active cycle: anchored on today, shifted by ◀ ▶ (offset).
  const activeCycle = useMemo(() => {
    const base = getCycle(period, cycleStartDay, TODAY_LABEL);
    return shiftCycle(period, cycleStartDay, base, cycleOffset);
  }, [period, cycleStartDay, cycleOffset]);

  // Reset the cycle offset whenever the period changes (Monthly <-> Weekly).
  useEffect(() => {
    setCycleOffset(0);
  }, [period]);

  const cycleTransactions = useMemo(
    () =>
      completedTransactions.filter(
        (t) => t.date >= activeCycle.start && t.date <= activeCycle.end
      ),
    [completedTransactions, activeCycle]
  );

  const cycleDateRange = formatRange(activeCycle.start, activeCycle.end);

  const prevCycle = useCallback(() => setCycleOffset((o) => o - 1), []);
  const nextCycle = useCallback(() => setCycleOffset((o) => o + 1), []);
  const resetCycle = useCallback(() => setCycleOffset(0), []);

  const totalIncome = useMemo(
    () => cycleTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    [cycleTransactions]
  );
  const totalExpenses = useMemo(
    () => cycleTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    [cycleTransactions]
  );
  const remainingBalance = totalIncome - totalExpenses;
  const unpaidRecurring = useMemo(
    () => data.recurring.filter((r) => !r.lastPaidDate),
    [data.recurring]
  );

  // Optimistic so the UI flips instantly; rolls back if the server rejects.
  const setPeriod = useCallback(async (p: PeriodType) => {
    const prev = data.settings;
    setData((state) => ({ ...state, settings: { ...state.settings, period: p } }));
    try {
      await api<Settings>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ ...prev, period: p }),
      });
    } catch (err) {
      setData((state) => ({ ...state, settings: { ...state.settings, period: prev.period } }));
      throw err;
    }
  }, [data.settings]);

  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    const next = { ...data.settings, ...updates };
    await api<Settings>('/api/settings', { method: 'PUT', body: JSON.stringify(next) });
    setData((prev) => ({ ...prev, settings: next }));
  }, [data.settings]);

  const formatCurrency = useCallback(
    (amount: number) =>
      privacyMode
        ? '••••••'
        : new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
          }).format(amount).replace('IDR', 'Rp'),
    [privacyMode]
  );

  // Mutations — update local state only from the server-confirmed entity.
  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const created = await api<Transaction>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(tx),
    });
    setData((prev) => ({ ...prev, transactions: [created, ...prev.transactions] }));
  }, []);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    const current = data.transactions.find((t) => t.id === id);
    if (!current) throw new ApiError(404, 'Transaction not found');
    const updated = await api<Transaction>(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...current, ...updates }),
    });
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === id ? updated : t)),
    }));
  }, [data.transactions]);

  const deleteTransaction = useCallback(async (id: string) => {
    await api<void>(`/api/transactions/${id}`, { method: 'DELETE' });
    setData((prev) => ({ ...prev, transactions: prev.transactions.filter((t) => t.id !== id) }));
  }, []);

  const completeDraft = useCallback(async (id: string, categoryId: string, note?: string) => {
    const current = data.transactions.find((t) => t.id === id);
    if (!current) throw new ApiError(404, 'Transaction not found');
    await updateTransaction(id, {
      categoryId,
      isDraft: false,
      note: note !== undefined ? note : current.note,
    });
  }, [data.transactions, updateTransaction]);

  const addCategory = useCallback(async (cat: Omit<Category, 'id'>) => {
    const created = await api<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(cat),
    });
    setData((prev) => ({ ...prev, categories: [...prev.categories, created] }));
  }, []);

  const updateCategory = useCallback(async (id: string, cat: Partial<Category>) => {
    const current = data.categories.find((c) => c.id === id);
    if (!current) throw new ApiError(404, 'Category not found');
    const updated = await api<Category>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...current, ...cat }),
    });
    setData((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? updated : c)),
    }));
  }, [data.categories]);

  const deleteCategory = useCallback(async (id: string) => {
    await api<void>(`/api/categories/${id}`, { method: 'DELETE' });
    setData((prev) => ({ ...prev, categories: prev.categories.filter((c) => c.id !== id) }));
  }, []);

  const addRecurring = useCallback(async (rec: Omit<RecurringTemplate, 'id'>) => {
    const created = await api<RecurringTemplate>('/api/recurring', {
      method: 'POST',
      body: JSON.stringify(rec),
    });
    setData((prev) => ({ ...prev, recurring: [...prev.recurring, created] }));
  }, []);

  const updateRecurring = useCallback(async (id: string, rec: Partial<RecurringTemplate>) => {
    const current = data.recurring.find((r) => r.id === id);
    if (!current) throw new ApiError(404, 'Recurring template not found');
    const updated = await api<RecurringTemplate>(`/api/recurring/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...current, ...rec }),
    });
    setData((prev) => ({
      ...prev,
      recurring: prev.recurring.map((r) => (r.id === id ? updated : r)),
    }));
  }, [data.recurring]);

  const deleteRecurring = useCallback(async (id: string) => {
    await api<void>(`/api/recurring/${id}`, { method: 'DELETE' });
    setData((prev) => ({ ...prev, recurring: prev.recurring.filter((r) => r.id !== id) }));
  }, []);

  const logRecurringPayment = useCallback(async (id: string) => {
    const result = await api<{ transaction: Transaction; recurring: RecurringTemplate }>(
      `/api/recurring/${id}/log`,
      { method: 'POST' }
    );
    setData((prev) => ({
      ...prev,
      transactions: [result.transaction, ...prev.transactions],
      recurring: prev.recurring.map((r) => (r.id === id ? result.recurring : r)),
    }));
  }, []);

  // Client-side export from the current snapshot (backup helpers only).
  const exportCSV = useCallback(() => {
    const headers = ['ID', 'Date', 'Merchant', 'Type', 'Amount', 'Category', 'IsDraft', 'IsRecurring', 'Note'];
    const rows = data.transactions.map((t) => {
      const cat = data.categories.find((c) => c.id === t.categoryId)?.name || 'Uncategorized';
      return [
        `"${t.id}"`, `"${t.date}"`, `"${t.merchant.replace(/"/g, '""')}"`, `"${t.type}"`, t.amount,
        `"${cat}"`, t.isDraft ? 'Yes' : 'No', t.isRecurring ? 'Yes' : 'No',
        `"${(t.note || '').replace(/"/g, '""')}"`,
      ].join(',');
    });
    downloadText([headers.join(','), ...rows].join('\n'), `budget_transactions_${TODAY_LABEL}.csv`, 'text/csv');
  }, [data]);

  const exportJSON = useCallback(() => {
    downloadText(
      JSON.stringify(
        { version: '1.0', exportedAt: new Date().toISOString(), settings: data.settings, categories: data.categories, transactions: data.transactions, recurring: data.recurring },
        null,
        2
      ),
      `budget_backup_${TODAY_LABEL}.json`,
      'application/json'
    );
  }, [data]);

  return (
    <BudgetContext.Provider
      value={{
        authStatus,
        bootError,
        login,
        logout,
        retry,
        currentView,
        navigateView,
        quickAddOpen,
        setQuickAddOpen,
        privacyMode,
        setPrivacyMode,
        categories: data.categories,
        transactions: data.transactions,
        recurring: data.recurring,
        settings: data.settings,
        formatCurrency,
        period,
        setPeriod,
        cycleDateRange,
        activeCycle,
        cycleTransactions,
        prevCycle,
        nextCycle,
        resetCycle,
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
        updateSettings,
        exportCSV,
        exportJSON,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};
