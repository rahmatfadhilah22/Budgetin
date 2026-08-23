import React, { useState, useEffect } from 'react';
import { useBudget } from '../context/BudgetContext';

export const QuickAddModal: React.FC = () => {
  const {
    quickAddOpen,
    setQuickAddOpen,
    categories,
    addTransaction,
    currency,
  } = useBudget();

  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('coffee');
  const [merchant, setMerchant] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isDraft, setIsDraft] = useState<boolean>(false);
  const [type, setType] = useState<'expense' | 'income'>('expense');

  // Quick categories list with standard shortcuts
  const quickCategories = [
    { id: 'coffee', label: 'Coffee', icon: 'local_cafe', defaultMerchant: 'Coffee' },
    { id: 'food_dining', label: 'Lunch', icon: 'restaurant', defaultMerchant: 'Lunch' },
    { id: 'transport', label: 'Transport', icon: 'directions_subway', defaultMerchant: 'Transport' },
    { id: 'groceries', label: 'Groceries', icon: 'shopping_cart', defaultMerchant: 'Groceries' },
  ];

  useEffect(() => {
    if (quickAddOpen) {
      setAmountStr('');
      setMerchant('');
      setNote('');
      setIsDraft(false);
      setType('expense');
      setSelectedCategoryId('coffee');
    }
  }, [quickAddOpen]);

  if (!quickAddOpen) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedAmount = parseFloat(amountStr) || 0;
    if (parsedAmount <= 0 && !isDraft) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    const catObj = categories.find((c) => c.id === selectedCategoryId);
    const resolvedMerchant = merchant.trim() || (catObj ? catObj.name : 'Unknown Merchant');

    addTransaction({
      merchant: resolvedMerchant,
      amount: parsedAmount,
      categoryId: selectedCategoryId || undefined,
      date: 'Today',
      type: type,
      isDraft: isDraft,
      note: note.trim() || undefined,
    });

    setQuickAddOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-[480px] rounded-2xl border border-[#c4c7c7] p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-[#f3f4f5]">
          <h2 className="text-xl font-bold text-black tracking-tight">Quick Add</h2>
          <button
            aria-label="Close"
            onClick={() => setQuickAddOpen(false)}
            className="text-[#444748] hover:text-black transition-colors p-1.5 rounded-full hover:bg-[#f3f4f5] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Type selector toggle */}
        <div className="flex bg-[#f3f4f5] rounded-lg p-1 border border-[#c4c7c7]">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              type === 'expense'
                ? 'bg-black text-white shadow-xs'
                : 'text-[#444748] hover:text-black'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              type === 'income'
                ? 'bg-black text-white shadow-xs'
                : 'text-[#444748] hover:text-black'
            }`}
          >
            Income
          </button>
        </div>

        {/* Amount Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#444748] uppercase tracking-wider">
            Amount
          </label>
          <div className="flex items-baseline gap-2 border-b border-[#c4c7c7] focus-within:border-black pb-2 transition-colors">
            <span className="text-3xl font-bold text-[#444748]">
              {currency === 'IDR' ? 'Rp' : '$'}
            </span>
            <input
              autoFocus
              type="number"
              step="0.01"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0.00"
              className="bg-transparent border-none p-0 focus:ring-0 text-3xl font-bold text-black w-full outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>
        </div>

        {/* Quick-select Category Chips */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#444748] uppercase tracking-wider">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {quickCategories.map((qc) => {
              const isSelected = selectedCategoryId === qc.id;
              return (
                <button
                  key={qc.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(qc.id);
                    if (!merchant) setMerchant(qc.defaultMerchant);
                  }}
                  className={`px-3.5 py-2 rounded-full border text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'border-black bg-[#edeeef] border-2 text-black font-semibold shadow-xs'
                      : 'border-[#c4c7c7] text-[#444748] hover:bg-[#f3f4f5] hover:text-black'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{qc.icon}</span>
                  <span>{qc.label}</span>
                </button>
              );
            })}
          </div>

          {/* More categories dropdown if user wants specific category */}
          <div className="mt-1">
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full text-xs font-medium bg-[#f8f9fa] border border-[#c4c7c7] rounded-lg p-2 text-[#191c1d] outline-none focus:border-black cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Merchant & Optional Note */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-[#444748]">Merchant / Description (Optional)</label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Starbucks, Uber, Minimarket"
              className="w-full bg-[#f8f9fa] border border-[#c4c7c7] rounded-lg p-2 text-sm text-black placeholder:text-[#747878] focus:border-black outline-none mt-1"
            />
          </div>

          {/* Checkbox: Save as draft */}
          <label className="flex items-center space-x-2 text-xs text-[#444748] cursor-pointer">
            <input
              type="checkbox"
              checked={isDraft}
              onChange={(e) => setIsDraft(e.target.checked)}
              className="rounded border-[#c4c7c7] text-black focus:ring-black cursor-pointer"
            />
            <span>Mark as Incomplete Draft (review & finalize later)</span>
          </label>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => handleSave()}
          className="w-full bg-black text-white hover:bg-[#2e3132] font-semibold text-sm py-3.5 rounded-lg active:scale-98 transition-all cursor-pointer shadow-sm"
        >
          Save Transaction
        </button>
      </div>
    </div>
  );
};
