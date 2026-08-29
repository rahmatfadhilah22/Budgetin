import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { Transaction } from '../../types';
import { formatDate } from '../../date';
import { Select, ConfirmDialog, DatePicker } from '../controls';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    drafts,
    categories,
    completeDraft,
    deleteTransaction,
    updateTransaction,
    formatCurrency,
    setQuickAddOpen,
    t,
  } = useBudget();

  const [activeTab, setActiveTab] = useState<'drafts' | 'all'>('drafts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'expense' | 'income'>('all');

  // Edit-transaction modal state
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editMerchant, setEditMerchant] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Draft review card internal draft selection states
  const [draftSelections, setDraftSelections] = useState<{
    [key: string]: { categoryId?: string; note: string; error?: boolean };
  }>({});

  // Per-card async states
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
      [draftId]: { ...(prev[draftId] || { note: '' }), categoryId: catId, error: false },
    }));
  };

  const handleDraftNoteChange = (draftId: string, note: string) => {
    setDraftSelections((prev) => ({
      ...prev,
      [draftId]: { ...(prev[draftId] || {}), note },
    }));
  };

  const handleCompleteDraft = async (draft: Transaction) => {
    if (busyId) return;
    const current = getDraftState(draft);
    if (!current.categoryId) {
      setDraftSelections((prev) => ({ ...prev, [draft.id]: { ...current, error: true } }));
      return;
    }
    setBusyId(draft.id);
    setActionError(null);
    try {
      await completeDraft(draft.id, current.categoryId, current.note);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('transactions.finalizeError'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteTransaction = async () => {
    if (deleteId || !confirmId) return;
    setDeleteId(confirmId);
    setActionError(null);
    try {
      await deleteTransaction(confirmId);
      setConfirmOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('transactions.deleteError'));
    } finally {
      setDeleteId(null);
    }
  };

  // Live thousands separator for the edit-amount field.
  const formatInt = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
  const handleEditAmountChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    setEditAmount(digits ? formatInt(parseInt(digits, 10)) : '');
  };

  const openEdit = (tx: Transaction) => {
    setEditing(tx);
    setEditMerchant(tx.merchant);
    setEditAmount(formatInt(tx.amount));
    setEditCategory(tx.categoryId ?? '');
    setEditDate(tx.date);
    setEditNote(tx.note ?? '');
    setActionError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingEdit || !editing) return;
    const amountVal = parseInt(editAmount.replace(/\D/g, ''), 10) || 0;
    if (amountVal <= 0) {
      setActionError(t('transactions.amountError'));
      return;
    }
    setSavingEdit(true);
    setActionError(null);
    try {
      await updateTransaction(editing.id, {
        merchant: editMerchant.trim() || t('common.unknownMerchant'),
        amount: amountVal,
        categoryId: editCategory || undefined,
        date: editDate,
        note: editNote.trim() || undefined,
      });
      setEditing(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('transactions.updateError'));
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (searchQuery.trim()) {
      const matchMerchant = t.merchant.toLowerCase().includes(searchQuery.toLowerCase());
      const matchNote = t.note?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchMerchant && !matchNote) return false;
    }
    if (selectedCategoryFilter !== 'all' && t.categoryId !== selectedCategoryFilter) return false;
    if (selectedTypeFilter !== 'all' && t.type !== selectedTypeFilter) return false;
    return true;
  });

  const getCategoryIcon = (categoryId?: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.icon : 'help';
  };

  const getCategoryName = (categoryId?: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : t('common.uncategorized');
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-medium tracking-tight text-ink">
            {activeTab === 'drafts' ? t('transactions.draftsTitle') : t('transactions.allTitle')}
          </h1>
          <p className="text-sm text-muted mt-1">
            {activeTab === 'drafts'
              ? t('transactions.draftsSub')
              : t('transactions.allSub')}
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-surface-soft p-1 rounded-xl self-start sm:self-auto border border-hairline">
          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'drafts' ? 'bg-surface-dark text-on-dark shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            <span>{t('transactions.reviewDrafts')}</span>
            {drafts.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'drafts' ? 'bg-on-dark text-ink' : 'bg-warning/15 text-accent-amber'}`}>
                {drafts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all' ? 'bg-surface-dark text-on-dark shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            {t('transactions.allCount', { n: transactions.length })}
          </button>
        </div>
      </div>

      {actionError && (
        <p role="alert" aria-live="polite" className="text-xs font-semibold text-error">{actionError}</p>
      )}

      {/* VIEW 1: DRAFTS REVIEW */}
      {activeTab === 'drafts' && (
        <div>
          {drafts.length === 0 ? (
            <div className="bg-surface-card border border-hairline rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-surface-soft text-body flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[28px]">check_circle</span>
              </div>
              <h3 className="font-display text-xl font-medium text-ink">{t('transactions.draftsDone')}</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                {t('transactions.draftsDoneSub')}
              </p>
              <button onClick={() => setActiveTab('all')} className="mt-2 text-xs font-bold text-ink underline cursor-pointer">
                {t('transactions.viewAll')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {drafts.map((draft) => {
                const state = getDraftState(draft);
                const hasError = state.error && !state.categoryId;
                const isBusy = busyId === draft.id;
                const isDeleting = deleteId === draft.id;
                const chips = expenseCategories.slice(0, 4);

                return (
                  <div
                    key={draft.id}
                    className={`bg-surface-card border p-5 rounded-xl flex flex-col justify-between transition-all relative ${
                      hasError ? 'border-error bg-error/5' : 'border-hairline hover:border-ink'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${hasError ? 'bg-error/15 text-error' : 'bg-surface-soft text-body'}`}>
                            <span className="material-symbols-outlined text-[18px]">
                              {state.categoryId ? getCategoryIcon(state.categoryId) : 'restaurant'}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-body-strong">{draft.merchant}</div>
                            <div className="text-xs text-muted-soft">{formatDate(draft.date)}</div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-ink tracking-tight">{formatCurrency(draft.amount)}</div>
                      </div>

                      <div className="mb-4">
                        <span className={`text-xs block mb-2 font-medium ${hasError ? 'text-error font-semibold flex items-center' : 'text-muted'}`}>
                          {hasError ? (
                            <>
                              <span className="material-symbols-outlined text-[14px] mr-1">error</span>
                              {t('transactions.selectCategoryError')}
                            </>
                          ) : (
                            t('transactions.selectCategory')
                          )}
                        </span>

                        {chips.length === 0 ? (
                          <p className="text-xs text-muted">{t('transactions.addCategoriesFirst')}</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {chips.map((sc) => {
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
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-hairline-soft space-y-3">
                      <input
                        type="text"
                        value={state.note}
                        onChange={(e) => handleDraftNoteChange(draft.id, e.target.value)}
                        placeholder={t('transactions.addNote')}
                        className="w-full bg-transparent border-0 border-b border-hairline focus:ring-0 focus:border-ink p-0 pb-1 text-sm text-ink placeholder:text-muted-soft transition-colors outline-none"
                      />

                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleCompleteDraft(draft)}
                          disabled={isBusy}
                          className={`w-full font-semibold text-xs py-2.5 rounded-lg active:scale-98 transition-all cursor-pointer shadow-sm disabled:opacity-60 ${
                            hasError ? 'bg-error text-on-primary hover:bg-[#a63a3a]' : 'bg-primary text-on-primary hover:bg-primary-active'
                          }`}
                        >
                          {isBusy ? t('common.saving') : t('transactions.done')}
                        </button>
                        <button
                          type="button"
                          title={t('transactions.deleteDraft')}
                          disabled={isDeleting}
                          onClick={() => { setConfirmId(draft.id); setConfirmOpen(true); }}
                          className="p-2 border border-hairline hover:bg-surface-soft text-muted-soft hover:text-error rounded-lg transition-colors cursor-pointer disabled:opacity-60"
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
          <div className="bg-surface-card p-4 rounded-xl border border-hairline flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="w-full md:w-72 flex items-center bg-canvas border border-hairline rounded-lg px-3 py-2">
              <span className="material-symbols-outlined text-muted-soft text-[18px] mr-2">search</span>
              <input
                type="text"
                placeholder={t('transactions.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none p-0 text-xs text-ink placeholder:text-muted-soft focus:ring-0 w-full outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
              <Select
                variant="sm"
                value={selectedCategoryFilter}
                onChange={setSelectedCategoryFilter}
                options={[
                  { value: 'all', label: t('transactions.allCategories') },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />

              <Select
                variant="sm"
                value={selectedTypeFilter}
                onChange={(v) => setSelectedTypeFilter(v as 'all' | 'expense' | 'income')}
                options={[
                  { value: 'all', label: t('transactions.allTypes') },
                  { value: 'expense', label: t('transactions.expensesOnly') },
                  { value: 'income', label: t('transactions.incomeOnly') },
                ]}
              />

              <button
                onClick={() => setQuickAddOpen(true)}
                className="bg-primary text-on-primary text-xs font-semibold px-3 py-2 rounded-lg hover:bg-primary-active transition-colors flex items-center space-x-1 whitespace-nowrap cursor-pointer ml-auto"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>{t('transactions.add')}</span>
              </button>
            </div>
          </div>

          <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden divide-y divide-hairline-soft">
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center text-muted text-sm">
                {t('transactions.noMatch')}
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-canvas transition-colors group">
                  <div className="flex items-center space-x-3.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      tx.isDraft ? 'bg-error/10 text-error' : tx.type === 'income' ? 'bg-success/15 text-success' : 'bg-surface-soft text-body'
                    }`}>
                      <span className="material-symbols-outlined text-[18px]">{getCategoryIcon(tx.categoryId)}</span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-body-strong">{tx.merchant}</span>
                        {tx.isDraft && (
                          <span className="text-[10px] bg-warning/15 text-accent-amber border border-warning/40 px-1.5 py-0.2 rounded font-bold">{t('common.draftBadge')}</span>
                        )}
                        {tx.isRecurring && (
                          <span className="text-[10px] bg-hairline text-muted px-1.5 py-0.2 rounded font-semibold">{t('common.recurringBadge')}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted mt-0.5 flex items-center space-x-1.5">
                        <span>{getCategoryName(tx.categoryId)}</span>
                        <span>•</span>
                        <span>{formatDate(tx.date)}</span>
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
                    <span className={`text-sm font-bold tracking-tight ${tx.type === 'income' ? 'text-success' : 'text-ink'}`}>
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </span>
                    <button
                      onClick={() => openEdit(tx)}
                      disabled={deleteId === tx.id}
                      title={t('common.edit')}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-soft hover:text-ink rounded transition-all cursor-pointer disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => { setConfirmId(tx.id); setConfirmOpen(true); }}
                      disabled={deleteId === tx.id}
                      title={t('common.delete')}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-soft hover:text-error rounded transition-all cursor-pointer disabled:opacity-40"
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

      <ConfirmDialog
        open={confirmOpen}
        title={t('transactions.deleteConfirmTitle')}
        message={t('transactions.deleteConfirmMsg')}
        busy={!!deleteId}
        onConfirm={handleDeleteTransaction}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Edit Transaction Modal */}
      {editing && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onMouseDown={() => setEditing(null)}
        >
          <div
            className="bg-surface-soft w-full max-w-[480px] rounded-2xl border border-hairline p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-hairline">
              <h3 className="font-display text-xl font-medium text-ink tracking-tight">{t('transactions.editTitle')}</h3>
              <button onClick={() => setEditing(null)} className="text-muted hover:text-ink p-1 rounded-full hover:bg-surface-card cursor-pointer">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {actionError && <p role="alert" aria-live="polite" className="text-xs font-semibold text-error">{actionError}</p>}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">{t('transactions.merchant')}</label>
                <input
                  type="text"
                  value={editMerchant}
                  onChange={(e) => setEditMerchant(e.target.value)}
                  className="w-full bg-canvas border border-hairline rounded-lg p-2.5 text-sm font-semibold text-ink focus:border-ink outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">{t('transactions.amount')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={editAmount}
                  onChange={(e) => handleEditAmountChange(e.target.value)}
                  className="w-full bg-canvas border border-hairline rounded-lg p-2.5 font-display text-xl font-semibold text-ink focus:border-ink outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">{t('transactions.category')}</label>
                  <Select
                    className="w-full"
                    value={editCategory}
                    onChange={setEditCategory}
                    options={[
                      { value: '', label: t('common.uncategorized') },
                      ...categories.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">{t('transactions.date')}</label>
                  <DatePicker value={editDate} onChange={setEditDate} className="w-full" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">{t('transactions.note')}</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder={t('transactions.optional')}
                  className="w-full bg-canvas border border-hairline rounded-lg p-2.5 text-sm font-semibold text-ink focus:border-ink outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingEdit}
                className={`w-full py-3 font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-sm ${
                  savingEdit ? 'bg-primary-disabled text-muted cursor-not-allowed' : 'bg-primary text-on-primary hover:bg-primary-active active:scale-98'
                }`}
              >
                {savingEdit ? t('common.saving') : t('common.saveChanges')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
