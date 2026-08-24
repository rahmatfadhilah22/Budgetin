import React from 'react';
import { useBudget } from '../../context/BudgetContext';

export const DashboardView: React.FC = () => {
  const {
    setCurrentView,
    formatCurrency,
    totalIncome,
    totalExpenses,
    remainingBalance,
    draftCount,
    transactions,
    categories,
    unpaidRecurring,
    logRecurringPayment,
  } = useBudget();

  // Calculate category spent amounts
  const categorySpending = categories.map((cat) => {
    const spent = transactions
      .filter((t) => !t.isDraft && t.type === 'expense' && t.categoryId === cat.id)
      .reduce((sum, t) => sum + t.amount, 0);

    const percent = cat.budget > 0 ? Math.min(Math.round((spent / cat.budget) * 100), 100) : 0;
    const isOver = spent > cat.budget;

    // Claude.com semantic colors: green healthy, amber near-limit, red over budget
    let barColor = '#5db872'; // success
    if (isOver) {
      barColor = '#c64545'; // error
    } else if (percent >= 80) {
      barColor = '#e8a55a'; // accent-amber
    }

    return {
      ...cat,
      spent,
      percent,
      isOver,
      barColor,
    };
  }).filter((c) => c.type === 'expense');

  // Top 5 recent completed transactions
  const recentTransactions = transactions
    .filter((t) => !t.isDraft)
    .slice(0, 5);

  // Fallback icon resolver
  const getCategoryIcon = (categoryId?: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.icon : 'receipt_long';
  };

  const getCategoryName = (categoryId?: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : 'General';
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-200">
      {/* 1. Unsaved Drafts Warning Banner */}
      {draftCount > 0 && (
        <div className="bg-warning/10 border border-warning/50 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start sm:items-center space-x-3">
            <span className="material-symbols-outlined text-[#b5790f] text-[22px] flex-shrink-0">
              warning
            </span>
            <div>
              <p className="text-sm font-semibold text-body-strong">
                You have {draftCount} unsaved drafts.
              </p>
              <p className="text-xs text-body hidden sm:block">
                Incomplete transactions need your attention to maintain balanced budget limits.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('transactions')}
            className="text-xs font-bold text-[#b5790f] hover:underline underline-offset-2 px-2 py-1 cursor-pointer self-start sm:self-auto"
          >
            Review now →
          </button>
        </div>
      )}

      {/* 2. Recurring Unpaid Alert (if any pending) */}
      {unpaidRecurring.length > 0 && (
        <div className="bg-warning/10 border border-warning/40 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="material-symbols-outlined text-[#b5790f] text-[20px]">
              event_repeat
            </span>
            <span className="text-sm font-medium text-body-strong">
              {unpaidRecurring[0].name} {formatCurrency(unpaidRecurring[0].defaultAmount)} - paid yet?
            </span>
          </div>
          <button
            onClick={() => logRecurringPayment(unpaidRecurring[0].id)}
            className="bg-ink text-canvas hover:bg-body-strong text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Log it now
          </button>
        </div>
      )}

      {/* 3. Summary Cards Bento (Mobile Vertical Stack, Desktop 3-Column Grid) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Income Card */}
        <div className="bg-surface-card p-6 rounded-2xl border border-hairline flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Income
            </h2>
            <div className="font-display text-3xl md:text-4xl font-semibold text-ink tracking-tight">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-1.5 text-success">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="text-xs font-semibold">+5% this month</span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-surface-card p-6 rounded-2xl border border-hairline flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Expenses
            </h2>
            <div className="font-display text-3xl md:text-4xl font-semibold text-ink tracking-tight">
              {formatCurrency(totalExpenses)}
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-1.5 text-muted">
            <span className="material-symbols-outlined text-sm">horizontal_rule</span>
            <span className="text-xs font-medium">On track</span>
          </div>
        </div>

        {/* Remaining Card — dark surface pacing moment */}
        <div className="bg-surface-dark text-on-dark p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              Remaining
            </h2>
            <div className="font-display text-3xl md:text-4xl font-semibold text-on-dark tracking-tight">
              {formatCurrency(remainingBalance)}
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{
                  width: `${
                    totalIncome > 0
                      ? Math.min(Math.max((remainingBalance / totalIncome) * 100, 5), 100)
                      : 50
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Two-Column Layout (Categories Progress & Recent Transactions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 pt-2">
        {/* Category Budget Section (4 cols on lg) */}
        <section className="lg:col-span-5 space-y-5 bg-surface-card p-5 md:p-6 rounded-2xl border border-hairline">
          <div className="flex justify-between items-center pb-2 border-b border-hairline-soft">
            <h3 className="font-display text-xl font-medium text-ink tracking-tight">Categories</h3>
            <button
              onClick={() => setCurrentView('categories')}
              className="text-xs font-semibold text-muted hover:text-ink transition-colors cursor-pointer"
            >
              Manage →
            </button>
          </div>

          <div className="space-y-4">
            {categorySpending.slice(0, 4).map((cat) => (
              <div key={cat.id} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="material-symbols-outlined text-[16px] text-muted">
                      {cat.icon}
                    </span>
                    <span className="font-semibold text-body-strong">{cat.name}</span>
                  </div>
                  <span className="font-medium text-muted">
                    {formatCurrency(cat.spent)} / {formatCurrency(cat.budget)}
                  </span>
                </div>
                {/* 4px Progress Track */}
                <div className="w-full h-1.5 bg-hairline rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${cat.percent}%`,
                      backgroundColor: cat.barColor,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Transactions List (7 cols on lg) */}
        <section className="lg:col-span-7 bg-surface-card p-5 md:p-6 rounded-2xl border border-hairline flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-hairline-soft">
              <h3 className="font-display text-xl font-medium text-ink tracking-tight">Recent Activity</h3>
              <button
                onClick={() => setCurrentView('transactions')}
                className="text-xs font-semibold text-ink underline underline-offset-2 hover:no-underline cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-hairline-soft">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setCurrentView('transactions')}
                  className="flex items-center justify-between py-3.5 group cursor-pointer hover:bg-canvas transition-colors -mx-2 px-2 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-surface-soft flex items-center justify-center flex-shrink-0 text-body group-hover:bg-ink group-hover:text-canvas transition-colors">
                      <span className="material-symbols-outlined text-[18px]">
                        {getCategoryIcon(tx.categoryId)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-body-strong leading-snug">
                        {tx.merchant}
                      </p>
                      <div className="flex items-center space-x-1.5 text-xs text-muted mt-0.5">
                        <span>{getCategoryName(tx.categoryId)}</span>
                        <span>•</span>
                        <span>{tx.date}</span>
                        {tx.isRecurring && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-hairline text-muted rounded font-semibold">
                            Recurring
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-sm font-bold tracking-tight ${
                      tx.type === 'income' ? 'text-success' : 'text-ink'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-hairline-soft mt-4 flex justify-end">
            <button
              onClick={() => setCurrentView('transactions')}
              className="text-xs font-medium text-muted hover:text-ink transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <span>Explore all {transactions.length} transactions</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
