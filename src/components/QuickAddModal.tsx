import React, { useState, useEffect } from 'react';
import { useBudget } from '../context/BudgetContext';
import { Checkbox, Select, DatePicker } from './controls';

const todayISO = () => new Date().toISOString().slice(0, 10);

export const QuickAddModal: React.FC = () => {
  const {
    quickAddOpen,
    setQuickAddOpen,
    categories,
    addTransaction,
  } = useBudget();

  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(todayISO());
  const [isDraft, setIsDraft] = useState<boolean>(false);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Live thousands separator: store the formatted string ("1.500.000"), strip separators on save.
  const formatInt = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
  const handleAmountChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    setAmountStr(digits ? formatInt(parseInt(digits, 10)) : '');
  };

  // Reset when opening and when the category list arrives after boot.
  useEffect(() => {
    if (quickAddOpen) {
      setAmountStr('');
      setMerchant('');
      setNote('');
      setDate(todayISO());
      setIsDraft(false);
      setType('expense');
      setError(null);
      setSelectedCategoryId(expenseCategories[0]?.id ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickAddOpen, categories]);

  if (!quickAddOpen) return null;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submitting) return;
    const parsedAmount = parseInt(amountStr.replace(/\D/g, ''), 10) || 0;
    if (parsedAmount <= 0 && !isDraft) {
      setError('Please enter an amount greater than 0.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addTransaction({
        merchant: merchant.trim() || 'Unknown Merchant',
        amount: parsedAmount,
        categoryId: selectedCategoryId || undefined,
        date,
        type,
        isDraft,
        note: note.trim() || undefined,
      });
      setQuickAddOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in duration-150"
      onMouseDown={() => setQuickAddOpen(false)}
    >
      <div
        className="bg-surface-soft w-full max-w-[480px] rounded-2xl border border-hairline p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative animate-in zoom-in-95 duration-150"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-hairline">
          <h2 className="font-display text-xl font-medium text-ink tracking-tight">Quick Add</h2>
          <button
            aria-label="Close"
            onClick={() => setQuickAddOpen(false)}
            className="text-muted hover:text-ink transition-colors p-1.5 rounded-full hover:bg-surface-card cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Type selector toggle */}
        <div className="flex bg-surface-card rounded-lg p-1 border border-hairline">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              type === 'expense'
                ? 'bg-ink text-on-dark shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              type === 'income'
                ? 'bg-ink text-on-dark shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            Income
          </button>
        </div>

        {/* Amount Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">
            Amount (Rp)
          </label>
          <div className="flex items-baseline gap-2 border-b border-hairline focus-within:border-ink pb-2 transition-colors">
            <span className="text-3xl font-medium text-muted">Rp</span>
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={amountStr}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              className="bg-transparent border-none p-0 focus:ring-0 font-display text-4xl font-semibold text-ink w-full outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>
        </div>

        {/* Category selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">
            Category
          </label>
          {expenseCategories.length === 0 && type === 'expense' ? (
            <p className="text-xs text-muted">
              No expense categories yet — add one in Categories first.
            </p>
          ) : (
            <Select
              className="w-full"
              value={selectedCategoryId}
              onChange={setSelectedCategoryId}
              options={(type === 'expense' ? expenseCategories : categories.filter((c) => c.type === 'income')).map((c) => ({
                value: c.id,
                label: c.name,
              }))}
            />
          )}
        </div>

        {/* Merchant, Date & Note */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-muted">Merchant / Description</label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Minimarket, Transport"
                className="w-full bg-canvas border border-hairline rounded-lg p-2 text-sm text-ink placeholder:text-muted-soft focus:border-ink outline-none mt-1"
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-semibold text-muted">Date</label>
              <DatePicker value={date} onChange={setDate} className="w-full mt-1" />
            </div>
          </div>

          {/* Checkbox: Save as draft */}
          <Checkbox checked={isDraft} onChange={setIsDraft} label="Save as Incomplete Draft (categorize later)" />
        </div>

        {error && (
          <p role="alert" aria-live="polite" className="text-xs font-semibold text-error">
            {error}
          </p>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={submitting}
          className={`w-full font-semibold text-sm py-3.5 rounded-lg transition-all cursor-pointer shadow-sm ${
            submitting
              ? 'bg-primary-disabled text-muted cursor-not-allowed'
              : 'bg-primary text-on-primary hover:bg-primary-active active:scale-98'
          }`}
        >
          {submitting ? 'Saving…' : 'Save Transaction'}
        </button>
      </div>
    </div>
  );
};
