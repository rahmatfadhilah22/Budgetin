import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { RecurringTemplate } from '../../types';

export const RecurringView: React.FC = () => {
  const {
    recurring,
    categories,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    logRecurringPayment,
    unpaidRecurring,
    formatCurrency,
    currency,
  } = useBudget();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'housing');
  const [amountStr, setAmountStr] = useState('');
  const [dueDay, setDueDay] = useState(1);
  const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [icon, setIcon] = useState('home');

  const openNewModal = () => {
    setEditingTemplate(null);
    setName('');
    setCategoryId(categories[0]?.id || 'housing');
    setAmountStr('');
    setDueDay(1);
    setFrequency('monthly');
    setIcon('home');
    setModalOpen(true);
  };

  const openEditModal = (rec: RecurringTemplate) => {
    setEditingTemplate(rec);
    setName(rec.name);
    setCategoryId(rec.categoryId);
    setAmountStr(rec.defaultAmount.toString());
    setDueDay(rec.dueDay);
    setFrequency(rec.frequency);
    setIcon(rec.icon);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a template name');
      return;
    }
    const amountVal = parseFloat(amountStr) || 0;

    if (editingTemplate) {
      updateRecurring(editingTemplate.id, {
        name: name.trim(),
        categoryId,
        defaultAmount: amountVal,
        dueDay,
        frequency,
        icon,
      });
    } else {
      addRecurring({
        name: name.trim(),
        categoryId,
        defaultAmount: amountVal,
        dueDay,
        frequency,
        icon,
      });
    }

    setModalOpen(false);
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : 'Housing';
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex justify-between items-end pb-2 border-b border-[#c4c7c7]">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-black">
            Recurring
          </h1>
          <p className="text-sm text-[#444748] mt-1">
            Manage your scheduled transactions.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-black text-white hover:bg-[#2e3132] px-4 py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Template</span>
        </button>
      </div>

      {/* Warning Banner (Image 11: Rent Rp 5,000,000 - paid yet? [Log it now]) */}
      {unpaidRecurring.length > 0 && (
        <div className="w-full bg-[#FEF3C7] border border-[#F59E0B] rounded-xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-3">
            <span className="material-symbols-outlined text-[#B45309] text-[24px]">
              warning
            </span>
            <span className="text-sm md:text-base font-semibold text-[#92400E]">
              {unpaidRecurring[0].name} {formatCurrency(unpaidRecurring[0].defaultAmount)} - paid yet?
            </span>
          </div>
          <button
            onClick={() => logRecurringPayment(unpaidRecurring[0].id)}
            className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg transition-colors font-semibold text-xs md:text-sm cursor-pointer self-end sm:self-auto shadow-xs"
          >
            Log it now
          </button>
        </div>
      )}

      {/* Template List Table / Bento List */}
      <div className="bg-white rounded-2xl border border-[#c4c7c7] overflow-hidden shadow-2xs">
        {/* Desktop Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-[#c4c7c7] bg-[#f3f4f5] text-xs font-semibold text-[#444748] uppercase tracking-wider">
          <div className="col-span-4">Name</div>
          <div className="col-span-3">Category</div>
          <div className="col-span-3 text-right">Default Amount</div>
          <div className="col-span-2 text-right">Due Day</div>
        </div>

        {/* Templates Items */}
        <div className="divide-y divide-[#f3f4f5]">
          {recurring.map((rec) => {
            const isPaid = !!rec.lastPaidDate;
            return (
              <div
                key={rec.id}
                className="group flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 p-4 hover:bg-[#f8f9fa] transition-colors items-start md:items-center"
              >
                {/* Column 1: Icon + Name */}
                <div className="col-span-4 flex items-center w-full space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#edeeef] text-black flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[20px]">
                      {rec.icon}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-black">{rec.name}</div>
                    <div className="md:hidden text-xs text-[#747878] mt-0.5">
                      {getCategoryName(rec.categoryId)}
                    </div>
                  </div>
                </div>

                {/* Column 2: Category Badge (Desktop) */}
                <div className="hidden md:block col-span-3">
                  <span className="inline-block px-2.5 py-1 bg-[#edeeef] rounded-md text-[#444748] text-xs font-semibold">
                    {getCategoryName(rec.categoryId)}
                  </span>
                </div>

                {/* Column 3: Amount */}
                <div className="col-span-3 w-full text-left md:text-right font-bold text-base md:text-lg text-black tracking-tight">
                  {formatCurrency(rec.defaultAmount)}
                </div>

                {/* Column 4: Due Day & Actions */}
                <div className="col-span-2 w-full text-left md:text-right text-xs text-[#444748] flex items-center justify-between md:justify-end space-x-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      Due on the {rec.dueDay}
                      {rec.dueDay === 1
                        ? 'st'
                        : rec.dueDay === 2
                        ? 'nd'
                        : rec.dueDay === 3
                        ? 'rd'
                        : 'th'}
                    </span>
                    {isPaid && (
                      <span className="text-[10px] bg-[#6cf8bb]/50 text-[#006c49] font-bold px-1.5 py-0.2 rounded">
                        Paid
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    {!isPaid && (
                      <button
                        onClick={() => logRecurringPayment(rec.id)}
                        className="text-xs bg-black text-white hover:bg-[#2e3132] px-2 py-1 rounded font-medium cursor-pointer"
                      >
                        Log
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(rec)}
                      className="text-[#747878] hover:text-black p-1 hover:bg-[#e1e3e4] rounded transition-colors cursor-pointer"
                      title="Edit template"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => deleteRecurring(rec.id)}
                      className="text-[#747878] hover:text-[#ba1a1a] p-1 hover:bg-[#e1e3e4] rounded transition-colors cursor-pointer"
                      title="Delete template"
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

      {/* Modal for Recurring Template */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-[480px] rounded-2xl border border-[#c4c7c7] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#f3f4f5]">
              <h3 className="text-xl font-bold text-black tracking-tight">
                {editingTemplate ? 'Edit Recurring Template' : 'New Recurring Template'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#444748] hover:text-black p-1 rounded-full hover:bg-[#f3f4f5] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#444748] uppercase tracking-wider mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rent, Netflix, Gym Membership"
                  className="w-full bg-[#f8f9fa] border border-[#c4c7c7] rounded-lg p-2.5 text-sm font-semibold text-black focus:border-black outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444748] uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-[#c4c7c7] rounded-lg p-2.5 text-sm font-medium text-black focus:border-black outline-none cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#444748] uppercase tracking-wider mb-1">
                    Amount ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#f8f9fa] border border-[#c4c7c7] rounded-lg p-2.5 text-sm font-semibold text-black focus:border-black outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#444748] uppercase tracking-wider mb-1">
                    Due Day of Month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dueDay}
                    onChange={(e) => setDueDay(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#f8f9fa] border border-[#c4c7c7] rounded-lg p-2.5 text-sm font-semibold text-black focus:border-black outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444748] uppercase tracking-wider mb-1">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-2 pt-1">
                  {['home', 'subscriptions', 'fitness_center', 'wifi', 'bolt', 'movie'].map(
                    (ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setIcon(ic)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer ${
                          icon === ic
                            ? 'bg-black text-white'
                            : 'bg-[#edeeef] text-black hover:bg-[#e1e3e4]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{ic}</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-black text-white font-semibold text-sm rounded-xl hover:bg-[#2e3132] active:scale-98 transition-all cursor-pointer shadow-sm"
                >
                  {editingTemplate ? 'Save Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
