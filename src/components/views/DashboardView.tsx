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

    // Color logic according to budget design system:
    // Functional Amber for near limit (>=80%), Green for healthy, Red for over budget
    let barColor = '#006c49'; // secondary green
    if (isOver) {
      barColor = '#ba1a1a'; // error red
    } else if (percent >= 80) {
      barColor = '#f59e0b'; // amber
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
      {/* 1. Unsaved Drafts Warning Banner (from screenshots) */}
      {draftCount > 0 && (
        <div className="bg-[#FEF3C7] border border-[#F59E0B] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-start sm:items-center space-x-3">
            <span className="material-symbols-outlined text-[#B45309] text-[22px] flex-shrink-0">
              warning
            </span>
            <div>
              <p className="text-sm font-semibold text-[#B45309]">
                You have {draftCount} unsaved drafts.
              </p>
              <p className="text-xs text-[#92400E] hidden sm:block">
                Incomplete transactions need your attention to maintain balanced budget limits.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('transactions')}
            className="text-xs font-bold text-[#92400E] hover:text-[#78350F] underline hover:no-underline px-2 py-1 cursor-pointer self-start sm:self-auto"
          >
            Review now →
          </button>
        </div>
      )}

      {/* 2. Recurring Unpaid Alert (if any pending) */}
      {unpaidRecurring.length > 0 && (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] p-4 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3">
            <span className="material-symbols-outlined text-[#D97706] text-[20px]">
              event_repeat
            </span>
            <span className="text-sm font-medium text-[#92400E]">
              {unpaidRecurring[0].name} {formatCurrency(unpaidRecurring[0].defaultAmount)} - paid yet?
            </span>
          </div>
          <button
            onClick={() => logRecurringPayment(unpaidRecurring[0].id)}
            className="bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Log it now
          </button>
        </div>
      )}

      {/* 3. Summary Cards Bento (Mobile Vertical Stack, Desktop 3-Column Grid) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Income Card */}
        <div className="bg-[#f3f4f5] p-6 rounded-2xl border border-[#c4c7c7] md:border-transparent flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-semibold text-[#444748] uppercase tracking-wider mb-2">
              Income
            </h2>
            <div className="text-3xl md:text-4xl font-bold text-black tracking-tight">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-1.5 text-[#006c49]">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="text-xs font-semibold">+5% this month</span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-[#f3f4f5] p-6 rounded-2xl border border-[#c4c7c7] md:border-transparent flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-semibold text-[#444748] uppercase tracking-wider mb-2">
              Expenses
            </h2>
            <div className="text-3xl md:text-4xl font-bold text-black tracking-tight">
              {formatCurrency(totalExpenses)}
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-1.5 text-[#444748]">
            <span className="material-symbols-outlined text-sm">horizontal_rule</span>
            <span className="text-xs font-medium">On track</span>
          </div>
        </div>

        {/* Remaining Card */}
        <div className="bg-[#f3f4f5] p-6 rounded-2xl border border-[#c4c7c7] md:border-transparent relative overflow-hidden flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-semibold text-[#006c49] uppercase tracking-wider mb-2">
              Remaining
            </h2>
            <div className="text-3xl md:text-4xl font-bold text-[#005236] tracking-tight">
              {formatCurrency(remainingBalance)}
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full h-1.5 bg-[#e1e3e4] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#006c49] rounded-full transition-all duration-500"
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
        <section className="lg:col-span-5 space-y-5 bg-white p-5 md:p-6 rounded-2xl border border-[#c4c7c7]">
          <div className="flex justify-between items-center pb-2 border-b border-[#f3f4f5]">
            <h3 className="text-lg font-bold text-black tracking-tight">Categories</h3>
            <button
              onClick={() => setCurrentView('categories')}
              className="text-xs font-semibold text-[#444748] hover:text-black transition-colors cursor-pointer"
            >
              Manage →
            </button>
          </div>

          <div className="space-y-4">
            {categorySpending.slice(0, 4).map((cat) => (
              <div key={cat.id} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="material-symbols-outlined text-[16px] text-[#444748]">
                      {cat.icon}
                    </span>
                    <span className="font-semibold text-black">{cat.name}</span>
                  </div>
                  <span className="font-medium text-[#444748]">
                    {formatCurrency(cat.spent)} / {formatCurrency(cat.budget)}
                  </span>
                </div>
                {/* 4px Progress Track */}
                <div className="w-full h-1.5 bg-[#e1e3e4] rounded-full overflow-hidden">
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
        <section className="lg:col-span-7 bg-white p-5 md:p-6 rounded-2xl border border-[#c4c7c7] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#f3f4f5]">
              <h3 className="text-lg font-bold text-black tracking-tight">Recent Activity</h3>
              <button
                onClick={() => setCurrentView('transactions')}
                className="text-xs font-semibold text-black underline hover:no-underline cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-[#f3f4f5]">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setCurrentView('transactions')}
                  className="flex items-center justify-between py-3.5 group cursor-pointer hover:bg-[#f8f9fa] transition-colors -mx-2 px-2 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-[#edeeef] flex items-center justify-center flex-shrink-0 text-black group-hover:bg-black group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[18px]">
                        {getCategoryIcon(tx.categoryId)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-black leading-snug">
                        {tx.merchant}
                      </p>
                      <div className="flex items-center space-x-1.5 text-xs text-[#747878] mt-0.5">
                        <span>{getCategoryName(tx.categoryId)}</span>
                        <span>•</span>
                        <span>{tx.date}</span>
                        {tx.isRecurring && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-[#e1e3e4] text-[#444748] rounded font-semibold">
                            Recurring
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-sm font-bold tracking-tight ${
                      tx.type === 'income' ? 'text-[#006c49]' : 'text-black'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#f3f4f5] mt-4 flex justify-end">
            <button
              onClick={() => setCurrentView('transactions')}
              className="text-xs font-medium text-[#444748] hover:text-black transition-colors flex items-center space-x-1 cursor-pointer"
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
