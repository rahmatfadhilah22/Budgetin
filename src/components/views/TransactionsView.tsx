import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { Transaction } from '../../types';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    drafts,
    categories,
    completeDraft,
    deleteTransaction,
    formatCurrency,
    setQuickAddOpen,
  } = useBudget();

  const [activeTab, setActiveTab] = useState<'drafts' | 'all'>('drafts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'expense' | 'income'>('all');

  // Draft review card internal draft selection states
  const [draftSelections, setDraftSelections] = useState<{
    [key: string]: { categoryId?: string; note: string; error?: boolean };
  }>({});

  const getDraftState = (draft: Transaction) => {
    return (
      draftSelections[draft.id] || {
        categoryId: draft.categoryId,
        note: draft.note || '',
        error: false,
      }
    );
  };

  const handleSelectDraftCategory = (draftId: string, catId: string) => {
    setDraftSelections((prev) => ({
      ...prev,
      [draftId]: {
        ...(prev[draftId] || { note: '' }),
        categoryId: catId,
        error: false,
      },
    }));
  };

  const handleDraftNoteChange = (draftId: string, note: string) => {
    setDraftSelections((prev) => ({
      ...prev,
      [draftId]: {
        ...(prev[draftId] || {}),
        note,
      },
    }));
  };

  const handleCompleteDraft = (draft: Transaction) => {
    const current = getDraftState(draft);
    if (!current.categoryId) {
      // Mark error state
      setDraftSelections((prev) => ({
        ...prev,
        [draft.id]: {
          ...current,
          error: true,
        },
      }));
      return;
    }

    completeDraft(draft.id, current.categoryId, current.note);
  };

  // Filtered transactions for the 'all' tab
  const filteredTransactions = transactions.filter((t) => {
    if (searchQuery.trim()) {
      const matchMerchant = t.merchant.toLowerCase().includes(searchQuery.toLowerCase());
      const matchNote = t.note?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchMerchant && !matchNote) return false;
    }
    if (selectedCategoryFilter !== 'all' && t.categoryId !== selectedCategoryFilter) {
      return false;
    }
    if (selectedTypeFilter !== 'all' && t.type !== selectedTypeFilter) {
      return false;
    }
    return true;
  });

  const getCategoryIcon = (categoryId?: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.icon : 'help';
  };

  const getCategoryName = (categoryId?: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : 'Uncategorized';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-medium tracking-tight text-ink">
            {activeTab === 'drafts' ? 'Incomplete Transactions' : 'All Transactions'}
          </h1>
          <p className="text-sm text-muted mt-1">
            {activeTab === 'drafts'
              ? 'Review and categorize your recent drafts.'
              : 'Complete history of all expenses, income, and drafts.'}
          </p>
        </div>

        {/* Tab selection pills */}
        <div className="flex items-center space-x-2 bg-surface-soft p-1 rounded-xl self-start sm:self-auto border border-hairline">
          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'drafts'
                ? 'bg-surface-dark text-on-dark shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            <span>Review Drafts</span>
            {drafts.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'drafts'
                    ? 'bg-on-dark text-ink'
                    : 'bg-warning/15 text-accent-amber'
                }`}
              >
                {drafts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-surface-dark text-on-dark shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            All ({transactions.length})
          </button>
        </div>
      </div>

      {/* VIEW 1: DRAFTS REVIEW */}
      {activeTab === 'drafts' && (
        <div>
          {drafts.length === 0 ? (
            <div className="bg-surface-card border border-hairline rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-surface-soft text-body flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[28px]">check_circle</span>
              </div>
              <h3 className="font-display text-xl font-medium text-ink">All drafts reviewed!</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                No pending or incomplete transactions require attention. Your budget calculations are completely up to date.
              </p>
              <button
                onClick={() => setActiveTab('all')}
                className="mt-2 text-xs font-bold text-ink underline cursor-pointer"
              >
                View all transactions →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {drafts.map((draft) => {
                const state = getDraftState(draft);
                const hasError = state.error && !state.categoryId;

                // Suggested chips for quick categorization
                const suggestedCategories = [
                  categories.find((c) => c.id === 'food_dining') || { id: 'food_dining', name: 'Food & Dining' },
                  categories.find((c) => c.id === 'groceries') || { id: 'groceries', name: 'Groceries' },
                  categories.find((c) => c.id === 'coffee') || { id: 'coffee', name: 'Coffee' },
                  categories.find((c) => c.id === 'transport') || { id: 'transport', name: 'Transport' },
                ].filter(Boolean);

                return (
                  <div
                    key={draft.id}
                    className={`bg-surface-card border p-5 rounded-xl flex flex-col justify-between transition-all relative ${
                      hasError
                        ? 'border-error bg-error/5'
                        : 'border-hairline hover:border-ink'
                    }`}
                  >
                    {/* Top Row: Merchant + Date & Amount */}
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                              hasError ? 'bg-error/15 text-error' : 'bg-surface-soft text-body'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {state.categoryId
                                ? getCategoryIcon(state.categoryId)
                                : 'restaurant'}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-body-strong">
                              {draft.merchant}
                            </div>
                            <div className="text-xs text-muted-soft">{draft.date}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold text-ink tracking-tight">
                            {formatCurrency(draft.amount)}
                          </div>
                        </div>
                      </div>

                      {/* Select Category Section */}
                      <div className="mb-4">
                        <span
                          className={`text-xs block mb-2 font-medium ${
                            hasError ? 'text-error font-semibold flex items-center' : 'text-muted'
                          }`}
                        >
                          {hasError ? (
                            <>
                              <span className="material-symbols-outlined text-[14px] mr-1">
                                error
                              </span>
                              Please select a category
                            </>
                          ) : (
                            'Select Category'
                          )}
                        </span>

                        <div className="flex flex-wrap gap-1.5">
                          {suggestedCategories.map((sc) => {
                            const isSelected = state.categoryId === sc.id;
                            return (
                              <button
                                key={sc.id}
                                type="button"
                                onClick={() => handleSelectDraftCategory(draft.id, sc.id)}
                                className={`text-xs rounded-full px-3 py-1 font-medium transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-2 border-ink text-ink bg-canvas font-bold shadow-sm'
                                    : hasError
                                    ? 'border border-error text-body-strong bg-error/10'
                                    : 'border border-hairline text-body hover:bg-surface-soft hover:text-ink'
                                }`}
                              >
                                {sc.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Note input & Done action */}
                    <div className="mt-4 pt-3 border-t border-hairline-soft space-y-3">
                      <input
                        type="text"
                        value={state.note}
                        onChange={(e) => handleDraftNoteChange(draft.id, e.target.value)}
                        placeholder="Add a note..."
                        className="w-full bg-transparent border-0 border-b border-hairline focus:ring-0 focus:border-ink p-0 pb-1 text-sm text-ink placeholder:text-muted-soft transition-colors outline-none"
                      />

                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleCompleteDraft(draft)}
                          className={`w-full font-semibold text-xs py-2.5 rounded-lg active:scale-98 transition-all cursor-pointer shadow-sm ${
                            hasError
                              ? 'bg-error text-on-primary hover:bg-[#a63a3a]'
                              : 'bg-primary text-on-primary hover:bg-primary-active'
                          }`}
                        >
                          Done
                        </button>
                        <button
                          type="button"
                          title="Delete draft"
                          onClick={() => deleteTransaction(draft.id)}
                          className="p-2 border border-hairline hover:bg-surface-soft text-muted-soft hover:text-error rounded-lg transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ALL TRANSACTIONS HISTORY */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Controls Bar: Search & Filters */}
          <div className="bg-surface-card p-4 rounded-xl border border-hairline flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="w-full md:w-72 flex items-center bg-canvas border border-hairline rounded-lg px-3 py-2">
              <span className="material-symbols-outlined text-muted-soft text-[18px] mr-2">search</span>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none p-0 text-xs text-ink placeholder:text-muted-soft focus:ring-0 w-full outline-none"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="text-xs bg-canvas border border-hairline rounded-lg px-2.5 py-2 font-medium text-ink outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
                className="text-xs bg-canvas border border-hairline rounded-lg px-2.5 py-2 font-medium text-ink outline-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="expense">Expenses only</option>
                <option value="income">Income only</option>
              </select>

              <button
                onClick={() => setQuickAddOpen(true)}
                className="bg-primary text-on-primary text-xs font-semibold px-3 py-2 rounded-lg hover:bg-primary-active transition-colors flex items-center space-x-1 whitespace-nowrap cursor-pointer ml-auto"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Transactions List Table / Cards */}
          <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden divide-y divide-hairline-soft">
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center text-muted text-sm">
                No transactions matched your search or filters.
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 hover:bg-canvas transition-colors group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        tx.isDraft
                          ? 'bg-error/10 text-error'
                          : tx.type === 'income'
                          ? 'bg-success/15 text-success'
                          : 'bg-surface-soft text-body'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {getCategoryIcon(tx.categoryId)}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-body-strong">{tx.merchant}</span>
                        {tx.isDraft && (
                          <span className="text-[10px] bg-warning/15 text-accent-amber border border-warning/40 px-1.5 py-0.2 rounded font-bold">
                            Draft
                          </span>
                        )}
                        {tx.isRecurring && (
                          <span className="text-[10px] bg-hairline text-muted px-1.5 py-0.2 rounded font-semibold">
                            Recurring
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted mt-0.5 flex items-center space-x-1.5">
                        <span>{getCategoryName(tx.categoryId)}</span>
                        <span>•</span>
                        <span>{tx.date}</span>
                        {tx.note && (
                          <>
                            <span>•</span>
                            <span className="italic text-body">"{tx.note}"</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-sm font-bold tracking-tight ${
                        tx.type === 'income' ? 'text-success' : 'text-ink'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </span>

                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      title="Delete"
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-soft hover:text-error rounded transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
