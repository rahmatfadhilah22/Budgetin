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
      <div className="flex justify-between items-end pb-2 border-b border-hairline">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-medium tracking-tight text-ink">
            Recurring
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage your scheduled transactions.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-primary text-on-primary hover:bg-primary-active px-4 py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Template</span>
        </button>
      </div>

      {/* Warning Banner */}
      {unpaidRecurring.length > 0 && (
        <div className="w-full bg-warning/10 border border-warning/50 rounded-xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="material-symbols-outlined text-[#b5790f] text-[24px]">
              warning
            </span>
            <span className="text-sm md:text-base font-semibold text-body-strong">
              {unpaidRecurring[0].name} {formatCurrency(unpaidRecurring[0].defaultAmount)} - paid yet?
            </span>
          </div>
          <button
            onClick={() => logRecurringPayment(unpaidRecurring[0].id)}
            className="bg-ink text-canvas hover:bg-body-strong px-4 py-2 rounded-lg transition-colors font-semibold text-xs md:text-sm cursor-pointer self-end sm:self-auto"
          >
            Log it now
          </button>
        </div>
      )}

      {/* Template List Table / Bento List */}
      <div className="bg-surface-card rounded-2xl border border-hairline overflow-hidden">
        {/* Desktop Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-hairline bg-surface-soft text-xs font-semibold text-muted uppercase tracking-wider">
          <div className="col-span-4">Name</div>
          <div className="col-span-3">Category</div>
          <div className="col-span-3 text-right">Default Amount</div>
          <div className="col-span-2 text-right">Due Day</div>
        </div>

        {/* Templates Items */}
        <div className="divide-y divide-hairline-soft">
          {recurring.map((rec) => {
            const isPaid = !!rec.lastPaidDate;
            return (
              <div
                key={rec.id}
                className="group flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 p-4 hover:bg-surface-soft transition-colors items-start md:items-center"
              >
                {/* Column 1: Icon + Name */}
                <div className="col-span-4 flex items-center w-full space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-surface-soft text-body flex items-center justify-center shrink-0 group-hover:bg-ink group-hover:text-canvas transition-colors">
                    <span className="material-symbols-outlined text-[20px]">
                      {rec.icon}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-body-strong">{rec.name}</div>
                    <div className="md:hidden text-xs text-muted-soft mt-0.5">
                      {getCategoryName(rec.categoryId)}
                    </div>
                  </div>
                </div>

                {/* Column 2: Category Badge (Desktop) */}
                <div className="hidden md:block col-span-3">
                  <span className="inline-block px-2.5 py-1 bg-surface-soft rounded-md text-muted text-xs font-semibold">
                    {getCategoryName(rec.categoryId)}
                  </span>
                </div>

                {/* Column 3: Amount */}
                <div className="col-span-3 w-full text-left md:text-right font-display text-lg md:text-xl font-semibold text-ink tracking-tight">
                  {formatCurrency(rec.defaultAmount)}
                </div>

                {/* Column 4: Due Day & Actions */}
                <div className="col-span-2 w-full text-left md:text-right text-xs text-muted flex items-center justify-between md:justify-end space-x-2">
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
                      <span className="text-[10px] bg-success/15 text-success font-bold px-1.5 py-0.2 rounded">
                        Paid
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    {!isPaid && (
                      <button
                        onClick={() => logRecurringPayment(rec.id)}
                        className="text-xs bg-primary text-on-primary hover:bg-primary-active px-2 py-1 rounded font-medium cursor-pointer"
                      >
                        Log
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(rec)}
                      className="text-muted-soft hover:text-ink p-1 hover:bg-hairline rounded transition-colors cursor-pointer"
                      title="Edit template"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => deleteRecurring(rec.id)}
                      className="text-muted-soft hover:text-error p-1 hover:bg-hairline rounded transition-colors cursor-pointer"
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
          className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-surface-soft w-full max-w-[480px] rounded-2xl border border-hairline p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-hairline">
              <h3 className="font-display text-xl font-medium text-ink tracking-tight">
                {editingTemplate ? 'Edit Recurring Template' : 'New Recurring Template'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted hover:text-ink p-1 rounded-full hover:bg-surface-card cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rent, Netflix, Gym Membership"
                  className="w-full bg-canvas border border-hairline rounded-lg p-2.5 text-sm font-semibold text-ink focus:border-ink outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-canvas border border-hairline rounded-lg p-2.5 text-sm font-medium text-ink focus:border-ink outline-none cursor-pointer"
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
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Amount ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-canvas border border-hairline rounded-lg p-2.5 text-sm font-semibold text-ink focus:border-ink outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Due Day of Month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dueDay}
                    onChange={(e) => setDueDay(parseInt(e.target.value) || 1)}
                    className="w-full bg-canvas border border-hairline rounded-lg p-2.5 text-sm font-semibold text-ink focus:border-ink outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
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
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-card text-body hover:bg-hairline'
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
                  className="w-full py-3 bg-primary text-on-primary font-semibold text-sm rounded-xl hover:bg-primary-active active:scale-98 transition-all cursor-pointer shadow-sm"
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
