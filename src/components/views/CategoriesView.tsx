import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { Category } from '../../types';
import { ConfirmDialog } from '../controls';

const EXPENSE_ICONS = [
  'shopping_cart', 'restaurant', 'local_cafe', 'bolt', 'water_drop',
  'home', 'directions_car', 'movie', 'fitness_center', 'payments',
  'subscriptions', 'flight', 'local_mall', 'medical_services', 'school',
];

const INCOME_ICONS = [
  'payments', 'account_balance', 'work', 'work_history', 'redeem',
  'loyalty', 'savings', 'trending_up', 'account_balance_wallet', 'monetization_on',
  'attach_money', 'card_giftcard', 'paid', 'stacks', 'school',
];

export const CategoriesView: React.FC = () => {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    formatCurrency,
  } = useBudget();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [budgetStr, setBudgetStr] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('shopping_cart');

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live thousands separator: store the formatted string ("2.000"), strip separators on save.
  const formatInt = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
  const handleBudgetChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    setBudgetStr(digits ? formatInt(parseInt(digits, 10)) : '');
  };

  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setName('');
    setType('expense');
    setBudgetStr('');
    setSelectedIcon('shopping_cart');
    setError(null);
    setModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setBudgetStr(cat.budget ? formatInt(cat.budget) : '');
    setSelectedIcon(cat.icon);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!name.trim()) {
      setError('Please enter a category name.');
      return;
    }
    const budgetVal = parseInt(budgetStr.replace(/\D/g, ''), 10) || 0;
    if (budgetVal < 0) {
      setError('Budget cannot be negative.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name: name.trim(), type, budget: budgetVal, icon: selectedIcon });
      } else {
        await addCategory({ name: name.trim(), type, budget: budgetVal, icon: selectedIcon });
      }
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save category');
    } finally {
      setSubmitting(false);
    }
  };

  const performDelete = async () => {
    if (!editingCategory || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteCategory(editingCategory.id);
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete category');
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex justify-between items-end pb-2 border-b border-hairline">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-medium tracking-tight text-ink">Categories</h1>
          <p className="text-sm text-muted mt-1">Manage your budget categories and spending limits.</p>
        </div>
        <button
          onClick={openNewCategoryModal}
          className="bg-primary text-on-primary hover:bg-primary-active px-4 py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Category</span>
        </button>
      </div>

      {/* Categories Bento Grid */}
      {categories.length === 0 ? (
        <p className="text-sm text-muted">No categories yet — create your first one.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => openEditCategoryModal(cat)}
              className="bg-surface-card border border-hairline p-6 rounded-2xl flex flex-col justify-between hover:bg-surface-soft hover:border-ink transition-all group cursor-pointer relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-soft text-body flex items-center justify-center group-hover:bg-ink group-hover:text-canvas transition-colors">
                  <span className="material-symbols-outlined text-[24px]">{cat.icon}</span>
                </div>
                <span className="text-xs px-2 py-0.5 border border-hairline rounded-md text-muted capitalize font-medium">{cat.type}</span>
              </div>
              <h3 className="font-display text-xl font-medium text-ink tracking-tight mb-4">{cat.name}</h3>
              <div className="flex justify-between items-end pt-3 border-t border-hairline-soft mt-auto">
                <div className="flex flex-col">
                  {cat.type === 'expense' && (
                    <>
                      <span className="text-xs text-muted-soft mb-0.5">Budget</span>
                      <span className="font-display text-2xl font-semibold text-ink tracking-tight">{formatCurrency(cat.budget)}</span>
                    </>
                  )}
                </div>
                <button type="button" title="Edit category" className="text-muted-soft group-hover:text-ink p-1.5 hover:bg-hairline rounded-full transition-colors">
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
              </div>
            </div>
          ))}

          {/* Add Category Dashed Placeholder Card */}
          <div
            onClick={openNewCategoryModal}
            className="bg-surface-card border-2 border-dashed border-hairline p-6 rounded-2xl flex flex-col items-center justify-center text-muted hover:bg-surface-soft hover:border-ink hover:text-ink transition-all cursor-pointer min-h-[190px] group"
          >
            <div className="w-12 h-12 rounded-full bg-surface-soft group-hover:bg-ink group-hover:text-canvas flex items-center justify-center mb-2 transition-colors">
              <span className="material-symbols-outlined text-[26px]">add</span>
            </div>
            <span className="text-sm font-bold">Add Category</span>
            <span className="text-xs text-muted-soft mt-0.5">Configure spending limit</span>
          </div>
        </div>
      )}

      {/* Modal for Category Editing */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-surface-soft w-full max-w-[480px] rounded-2xl border border-hairline p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-hairline">
              <h3 className="font-display text-xl font-medium text-ink tracking-tight">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-muted hover:text-ink p-1 rounded-full hover:bg-surface-card cursor-pointer">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Category Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Groceries, Entertainment"
                  className="w-full bg-transparent border-0 border-b border-muted-soft focus:border-ink focus:ring-0 px-0 py-2 text-xl font-semibold text-ink transition-colors outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Type</label>
                <div className="flex p-1 bg-surface-card rounded-xl border border-hairline">
                  <button
                    type="button"
                    onClick={() => { setType('income'); setSelectedIcon(INCOME_ICONS[0]); }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${type === 'income' ? 'bg-ink text-on-dark shadow-sm' : 'text-muted hover:text-ink'}`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => { setType('expense'); setSelectedIcon(EXPENSE_ICONS[0]); }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${type === 'expense' ? 'bg-ink text-on-dark shadow-sm' : 'text-muted hover:text-ink'}`}
                  >
                    Expense
                  </button>
                </div>
              </div>

              {type === 'expense' && (
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Monthly Budget (Rp)</label>
                  <div className="flex items-center border-b border-muted-soft focus-within:border-ink transition-colors pb-1">
                    <span className="text-xl font-medium text-muted mr-2">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={budgetStr}
                      onChange={(e) => handleBudgetChange(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent border-0 focus:ring-0 px-0 py-1 font-display text-3xl font-semibold text-ink tracking-tight outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-3">Icon</label>
                <div className="grid grid-cols-5 gap-2.5">
                  {(type === 'income' ? INCOME_ICONS : EXPENSE_ICONS).map((iconName) => {
                    const isSelected = selectedIcon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        title={iconName.replace(/_/g, ' ')}
                        onClick={() => setSelectedIcon(iconName)}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isSelected ? 'bg-primary text-on-primary ring-2 ring-primary shadow-sm' : 'bg-surface-card text-body hover:bg-hairline'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[22px]">{iconName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {editingCategory && (
                <div className="pt-4 mt-1 border-t border-hairline-soft">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(true)}
                    disabled={deleting}
                    className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl border border-error/40 text-error text-sm font-semibold hover:bg-error/10 hover:border-error transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    <span>{deleting ? 'Deleting…' : 'Delete this category'}</span>
                  </button>
                </div>
              )}

              {error && (
                <p role="alert" aria-live="polite" className="text-xs font-semibold text-error">{error}</p>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-3 font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-sm ${
                    submitting ? 'bg-primary-disabled text-muted cursor-not-allowed' : 'bg-primary text-on-primary hover:bg-primary-active active:scale-98'
                  }`}
                >
                  {submitting ? 'Saving…' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete category?"
        message={`Delete "${editingCategory?.name ?? ''}"? Transactions using it must be recategorized first.`}
        busy={deleting}
        onConfirm={performDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};
