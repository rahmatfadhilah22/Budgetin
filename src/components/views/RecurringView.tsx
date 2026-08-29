import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { RecurringTemplate, Transaction } from '../../types';
import { Select, ConfirmDialog } from '../controls';

export const RecurringView: React.FC = () => {
  const {
    recurring,
    categories,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    logRecurringPayment,
    syncRecurring,
    updateTransaction,
    deleteTransaction,
    transactions,
    unpaidRecurring,
    formatCurrency,
    t,
  } = useBudget();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);

  // History panel: which template is open + its linked transactions.
  const [historyFor, setHistoryFor] = useState<RecurringTemplate | null>(null);
  const [historyCat, setHistoryCat] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState(false);
  const [txBusyId, setTxBusyId] = useState<string | null>(null);
  const [txDeleteId, setTxDeleteId] = useState<string | null>(null);
  const [txConfirmOpen, setTxConfirmOpen] = useState(false);
  const [txConfirmId, setTxConfirmId] = useState<string | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDay, setDueDay] = useState(1);
  const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [icon, setIcon] = useState('home');

  const [submitting, setSubmitting] = useState(false);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Live thousands separator: store the formatted string ("1.500.000"), strip separators on save.
  const formatInt = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
  const handleAmountChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    setAmountStr(digits ? formatInt(parseInt(digits, 10)) : '');
  };
  const handleDueDayChange = (raw: string) => {
    const day = parseInt(raw.replace(/\D/g, ''), 10) || 0;
    setDueDay(Math.min(Math.max(day, 1), 31));
  };

  const openNewModal = () => {
    setEditingTemplate(null);
    setName('');
    setCategoryId(expenseCategories[0]?.id ?? '');
    setAmountStr('');
    setDueDay(1);
    setFrequency('monthly');
    setIcon('home');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (rec: RecurringTemplate) => {
    setEditingTemplate(rec);
    setName(rec.name);
    setCategoryId(rec.categoryId);
    setAmountStr(rec.defaultAmount ? formatInt(rec.defaultAmount) : '');
    setDueDay(rec.dueDay);
    setFrequency(rec.frequency);
    setIcon(rec.icon);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!name.trim()) {
      setError(t('recurring.nameError'));
      return;
    }
    const amountVal = parseInt(amountStr.replace(/\D/g, ''), 10) || 0;
    if (amountVal <= 0) {
      setError(t('recurring.amountError'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (editingTemplate) {
        await updateRecurring(editingTemplate.id, { name: name.trim(), categoryId, defaultAmount: amountVal, dueDay, frequency, icon });
      } else {
        await addRecurring({ name: name.trim(), categoryId, defaultAmount: amountVal, dueDay, frequency, icon });
      }
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('recurring.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLog = async (id: string) => {
    if (loggingId) return;
    setLoggingId(id);
    setError(null);
    try {
      await logRecurringPayment(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('recurring.logError'));
    } finally {
      setLoggingId(null);
    }
  };

  const handleDelete = async () => {
    if (deletingId) return;
    setDeletingId(confirmId);

    setError(null);
    try {
      await deleteRecurring(confirmId);
      setConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('recurring.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : t('common.uncategorized');
  };

  const openHistory = (rec: RecurringTemplate) => {
    setHistoryFor(rec);
    setHistoryCat({});
    setPanelError(null);
    setTxConfirmOpen(false);
    setTxConfirmId(null);
  };

  const historyTransactions = historyFor
    ? transactions.filter((t) => t.templateId === historyFor.id)
    : [];

  const handleTxCategoryChange = async (tx: Transaction, catId: string) => {
    if (txBusyId) return;
    setTxBusyId(tx.id);
    setPanelError(null);
    try {
      await updateTransaction(tx.id, { categoryId: catId || undefined });
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : t('recurring.updateCatError'));
    } finally {
      setTxBusyId(null);
    }
  };

  const handleTxDelete = async () => {
    if (!txDeleteId || !txConfirmId) return;
    setTxDeleteId(txConfirmId);
    setPanelError(null);
    try {
      await deleteTransaction(txConfirmId);
      setTxConfirmOpen(false);
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : t('recurring.deleteTxError'));
    } finally {
      setTxDeleteId(null);
    }
  };

  const handleSync = async () => {
    if (!historyFor || syncing) return;
    setSyncing(true);
    setPanelError(null);
    try {
      await syncRecurring(historyFor.id);
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : t('recurring.syncError'));
    } finally {
      setSyncing(false);
    }
  };

  const ordinal = (n: number) => (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex justify-between items-end pb-2 border-b border-hairline">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-medium tracking-tight text-ink">{t('nav.recurring')}</h1>
          <p className="text-sm text-muted mt-1">{t('recurring.subtitle')}</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-primary text-on-primary hover:bg-primary-active px-4 py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center justify-center space-x-1.5 min-w-[140px] whitespace-nowrap transition-colors cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>{t('recurring.new')}</span>
        </button>
      </div>

      {/* Warning Banner */}
      {unpaidRecurring.length > 0 && (
        <div className="w-full bg-warning/10 border border-warning/50 rounded-xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="material-symbols-outlined text-[#b5790f] text-[24px]">warning</span>
            <span className="text-sm md:text-base font-semibold text-body-strong">
              {t('recurring.paidYet', { name: unpaidRecurring[0].name, amount: formatCurrency(unpaidRecurring[0].defaultAmount) })}
            </span>
          </div>
          <button
            onClick={() => handleLog(unpaidRecurring[0].id)}
            disabled={loggingId === unpaidRecurring[0].id}
            className="bg-ink text-canvas hover:bg-body-strong disabled:opacity-60 px-4 py-2 rounded-lg transition-colors font-semibold text-xs md:text-sm cursor-pointer self-end sm:self-auto"
          >
            {loggingId === unpaidRecurring[0].id ? t('recurring.logging') : t('recurring.logNow')}
          </button>
        </div>
      )}

      {error && <p role="alert" aria-live="polite" className="text-xs font-semibold text-error">{error}</p>}

      {/* Template List */}
      {recurring.length === 0 ? (
        <p className="text-sm text-muted">{t('recurring.empty')}</p>
      ) : (
        <div className="bg-surface-card rounded-2xl border border-hairline overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-hairline bg-surface-soft text-xs font-semibold text-muted uppercase tracking-wider">
            <div className="col-span-4 pl-14">{t('recurring.colName')}</div>
            <div className="col-span-2">{t('recurring.colCategory')}</div>
            <div className="col-span-2 text-right">{t('recurring.colAmount')}</div>
            <div className="col-span-4 pl-8">{t('recurring.colDue')}</div>
          </div>

          <div className="divide-y divide-hairline-soft">
            {recurring.map((rec) => {
              const isPaid = !!rec.lastPaidDate;
              return (
                <div key={rec.id} className="group flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 p-4 hover:bg-surface-soft transition-colors items-start md:items-center">
                  <div className="col-span-4 flex items-center w-full pl-1 space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-surface-soft text-body flex items-center justify-center shrink-0 group-hover:bg-ink group-hover:text-canvas transition-colors">
                      <span className="material-symbols-outlined text-[20px]">{rec.icon}</span>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-body-strong">{rec.name}</div>
                      <div className="md:hidden text-xs text-muted-soft mt-0.5">{getCategoryName(rec.categoryId)}</div>
                    </div>
                  </div>

                  <div className="hidden md:block col-span-2">
                    <span className="inline-block px-2.5 py-1 bg-surface-soft rounded-md text-muted text-xs font-semibold">{getCategoryName(rec.categoryId)}</span>
                  </div>

                  <div className="col-span-2 w-full text-left md:text-right font-display text-lg md:text-xl font-semibold text-ink tracking-tight">
                    {formatCurrency(rec.defaultAmount)}
                  </div>

                  <div className="col-span-4 w-full pl-8 text-left text-xs text-muted flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{t('recurring.dueOn', { day: rec.dueDay, ord: ordinal(rec.dueDay) })}</span>
                      {isPaid && (
                        <span className="text-[10px] bg-success/15 text-success font-bold px-1.5 py-0.2 rounded">{t('recurring.paid')}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {!isPaid && (
                        <button
                          onClick={() => handleLog(rec.id)}
                          disabled={loggingId === rec.id}
                          className="text-xs bg-primary text-on-primary hover:bg-primary-active disabled:opacity-60 px-2 py-1 rounded font-medium cursor-pointer"
                        >
                          {loggingId === rec.id ? '…' : t('recurring.log')}
                        </button>
                      )}
                      <button
                        onClick={() => openHistory(rec)}
                        title={t('recurring.viewHistory')}
                        className="text-xs border border-hairline bg-surface-soft hover:bg-hairline px-2 py-1 rounded font-medium cursor-pointer"
                      >
                        {t('recurring.history')}{transactions.filter((t) => t.templateId === rec.id).length > 0 ? ` (${transactions.filter((t) => t.templateId === rec.id).length})` : ''}
                      </button>
                      <button
                        onClick={() => openEditModal(rec)}
                        className="text-muted-soft hover:text-ink p-1 hover:bg-hairline rounded transition-colors cursor-pointer"
                        title={t('recurring.editTitle')}
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => { setConfirmId(rec.id); setConfirmOpen(true); }}
                        disabled={deletingId === rec.id}
                        className="text-muted-soft hover:text-error p-1 hover:bg-hairline rounded transition-colors cursor-pointer disabled:opacity-60"
                        title={t('recurring.deleteTitle')}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal for Recurring Template */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onMouseDown={() => setModalOpen(false)}
        >
          <div
            className="bg-surface-soft w-full max-w-[480px] rounded-2xl border border-hairline p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-hairline">
              <h3 className="font-display text-xl font-medium text-ink tracking-tight">
                {editingTemplate ? t('recurring.edit') : t('recurring.newFull')}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-muted hover:text-ink p-1 rounded-full hover:bg-surface-card cursor-pointer">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">{t('recurring.name')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('recurring.namePh')}
                  className="w-full bg-canvas border border-hairline rounded-lg p-2.5 text-sm font-semibold text-ink focus:border-ink outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">{t('recurring.colCategory')}</label>
                <Select
                  className="w-full"
                  value={categoryId}
                  onChange={setCategoryId}
                  options={
                    expenseCategories.length === 0
                      ? [{ value: '', label: t('recurring.noExpenseCategories') }]
                      : expenseCategories.map((c) => ({ value: c.id, label: c.name }))
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">{t('recurring.amount')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    value={amountStr}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    className="w-full bg-canvas border border-hairline rounded-lg p-2.5 font-display text-base font-semibold text-ink focus:border-ink outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">{t('recurring.dueDay')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    value={dueDay}
                    onChange={(e) => handleDueDayChange(e.target.value)}
                    placeholder="1"
                    className="w-full bg-canvas border border-hairline rounded-lg p-2.5 font-display text-base font-semibold text-ink focus:border-ink outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">{t('recurring.frequency')}</label>
                  <Select
                    variant="lg"
                    className="w-full"
                    value={frequency}
                    onChange={(v) => setFrequency(v as 'monthly' | 'weekly' | 'yearly')}
                    options={[
                      { value: 'monthly', label: t('period.monthly') },
                      { value: 'weekly', label: t('period.weekly') },
                      { value: 'yearly', label: t('period.yearly') },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">{t('recurring.icon')}</label>
                <div className="grid grid-cols-6 gap-2 pt-1">
                  {['home', 'subscriptions', 'fitness_center', 'wifi', 'bolt', 'movie'].map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      title={ic.replace(/_/g, ' ')}
                      onClick={() => setIcon(ic)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer ${
                        icon === ic ? 'bg-primary text-on-primary' : 'bg-surface-card text-body hover:bg-hairline'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{ic}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && <p role="alert" aria-live="polite" className="text-xs font-semibold text-error">{error}</p>}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-3 font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-sm ${
                    submitting ? 'bg-primary-disabled text-muted cursor-not-allowed' : 'bg-primary text-on-primary hover:bg-primary-active active:scale-98'
                  }`}
                >
                  {submitting ? t('common.saving') : editingTemplate ? t('recurring.save') : t('recurring.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History panel for a template */}
      {historyFor && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onMouseDown={() => setHistoryFor(null)}
        >
          <div
            className="bg-surface-soft w-full max-w-[520px] rounded-2xl border border-hairline p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-150"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-hairline">
              <h3 className="font-display text-xl font-medium text-ink tracking-tight">
                {t('recurring.historyTitle', { name: historyFor.name })}
              </h3>
              <button onClick={() => setHistoryFor(null)} className="text-muted hover:text-ink p-1 rounded-full hover:bg-surface-card cursor-pointer">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {panelError && <p role="alert" aria-live="polite" className="text-xs font-semibold text-error">{panelError}</p>}

            {historyTransactions.length === 0 ? (
              <p className="text-sm text-muted">{t('recurring.historyEmpty')}</p>
            ) : (
              <div className="divide-y divide-hairline-soft">
                {historyTransactions.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-body-strong truncate">{tx.merchant}</span>
                        {tx.categoryId && <span className="text-[10px] bg-surface-card border border-hairline px-1.5 py-0.2 rounded text-muted font-semibold whitespace-nowrap">{getCategoryName(tx.categoryId)}</span>}
                      </div>
                      <div className="text-xs text-muted mt-0.5">{tx.date}</div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-sm font-bold text-ink">{formatCurrency(tx.amount)}</span>
                      <Select
                        variant="sm"
                        value={historyCat[tx.id] ?? tx.categoryId ?? ''}
                        onChange={(v) => { setHistoryCat((p) => ({ ...p, [tx.id]: v })); handleTxCategoryChange(tx, v); }}
                        disabled={txBusyId === tx.id}
                        options={expenseCategories.map((c) => ({ value: c.id, label: c.name }))}
                      />
                      <button
                        onClick={() => { setTxConfirmId(tx.id); setTxConfirmOpen(true); }}
                        disabled={txBusyId === tx.id || txDeleteId === tx.id}
                        className="text-muted-soft hover:text-error p-1 hover:bg-hairline rounded transition-colors cursor-pointer disabled:opacity-60"
                        title={t('recurring.deleteTxTitle')}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {historyTransactions.length > 0 && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="w-full py-2.5 rounded-xl border border-primary/40 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-60"
              >
                {syncing ? t('recurring.updating') : t('recurring.align', { n: historyTransactions.length })}
              </button>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={txConfirmOpen}
        title={t('transactions.deleteConfirmTitle')}
        message={t('recurring.deleteTxMsg')}
        busy={!!txDeleteId}
        onConfirm={handleTxDelete}
        onCancel={() => setTxConfirmOpen(false)}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={t('recurring.deleteConfirmTitle')}
        message={t('recurring.deleteConfirmMsg')}
        busy={!!deletingId}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};
