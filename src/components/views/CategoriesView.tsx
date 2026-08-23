import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { Category } from '../../types';

const AVAILABLE_ICONS = [
  'shopping_cart',
  'restaurant',
  'local_cafe',
  'bolt',
  'water_drop',
  'home',
  'directions_car',
  'movie',
  'fitness_center',
  'payments',
  'subscriptions',
  'flight',
  'shopping_bag',
  'medical_services',
  'school',
];

export const CategoriesView: React.FC = () => {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    formatCurrency,
    currency,
  } = useBudget();

  // Drawer/Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [budgetStr, setBudgetStr] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('shopping_cart');

  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setName('');
    setType('expense');
    setBudgetStr('');
    setSelectedIcon('shopping_cart');
    setModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setBudgetStr(cat.budget.toString());
    setSelectedIcon(cat.icon);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a category name');
      return;
    }

    const budgetVal = parseFloat(budgetStr) || 0;

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: name.trim(),
        type,
        budget: budgetVal,
        icon: selectedIcon,
      });
    } else {
      addCategory({
        name: name.trim(),
        type,
        budget: budgetVal,
        icon: selectedIcon,
      });
    }

    setModalOpen(false);
  };

  const handleDelete = () => {
    if (editingCategory) {
      if (confirm(`Are you sure you want to delete "${editingCategory.name}"?`)) {
        deleteCategory(editingCategory.id);
        setModalOpen(false);
      }
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex justify-between items-end pb-2 border-b border-[#c4c7c7]">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-black">
            Categories
          </h1>
          <p className="text-sm text-[#444748] mt-1">
            Manage your budget categories and spending limits.
          </p>
        </div>
        <button
          onClick={openNewCategoryModal}
          className="bg-black text-white hover:bg-[#2e3132] px-4 py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Category</span>
        </button>
      </div>

      {/* Categories Bento Grid (Matching Image 9 & 10) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          return (
            <div
              key={cat.id}
              onClick={() => openEditCategoryModal(cat)}
              className="bg-white border border-[#c4c7c7] p-6 rounded-2xl flex flex-col justify-between hover:bg-[#f8f9fa] hover:border-[#191c1d] transition-all group cursor-pointer shadow-2xs relative"
            >
              {/* Top Row: Icon + Type Badge */}
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    cat.id === 'groceries'
                      ? 'bg-[#6cf8bb] text-[#00714d]'
                      : 'bg-[#edeeef] text-black group-hover:bg-black group-hover:text-white transition-colors'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {cat.icon}
                  </span>
                </div>
                <span className="text-xs px-2 py-0.5 border border-[#c4c7c7] rounded-md text-[#444748] capitalize font-medium">
                  {cat.type}
                </span>
              </div>

              {/* Category Name */}
              <h3 className="text-lg font-bold text-black mb-4">{cat.name}</h3>

              {/* Bottom: Budget amount + Edit button */}
              <div className="flex justify-between items-end pt-3 border-t border-[#f3f4f5] mt-auto">
                <div className="flex flex-col">
                  <span className="text-xs text-[#747878] mb-0.5">Budget</span>
                  <span className="text-xl font-bold text-black tracking-tight">
                    {formatCurrency(cat.budget)}
                  </span>
                </div>
                <button
                  type="button"
                  title="Edit category"
                  className="text-[#747878] group-hover:text-black p-1.5 hover:bg-[#e1e3e4] rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Category Dashed Placeholder Card */}
        <div
          onClick={openNewCategoryModal}
          className="bg-white border-2 border-dashed border-[#c4c7c7] p-6 rounded-2xl flex flex-col items-center justify-center text-[#444748] hover:bg-[#f8f9fa] hover:border-black hover:text-black transition-all cursor-pointer min-h-[190px] shadow-2xs group"
        >
          <div className="w-12 h-12 rounded-full bg-[#edeeef] group-hover:bg-black group-hover:text-white flex items-center justify-center mb-2 transition-colors">
            <span className="material-symbols-outlined text-[26px]">add</span>
          </div>
          <span className="text-sm font-bold">Add Category</span>
          <span className="text-xs text-[#747878] mt-0.5">Configure spending limit</span>
        </div>
      </div>

      {/* Slide-over / Modal for Category Editing (Image 10) */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-150"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white w-full md:w-[420px] h-full border-l border-[#c4c7c7] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[#c4c7c7] flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="text-xl font-bold text-black tracking-tight">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#444748] hover:text-black p-1 rounded-full hover:bg-[#f3f4f5] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-semibold text-[#444748] uppercase tracking-wider mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Groceries, Entertainment"
                  className="w-full bg-transparent border-0 border-b border-[#747878] focus:border-black focus:ring-0 px-0 py-2 text-xl font-semibold text-black transition-colors outline-none"
                />
              </div>

              {/* Type Toggle */}
              <div>
                <label className="block text-xs font-semibold text-[#444748] uppercase tracking-wider mb-2">
                  Type
                </label>
                <div className="flex p-1 bg-[#f3f4f5] rounded-xl border border-[#c4c7c7]">
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      type === 'income'
                        ? 'bg-black text-white shadow-xs'
                        : 'text-[#444748] hover:text-black'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      type === 'expense'
                        ? 'bg-black text-white shadow-xs'
                        : 'text-[#444748] hover:text-black'
                    }`}
                  >
                    Expense
                  </button>
                </div>
              </div>

              {/* Monthly Budget */}
              <div>
                <label className="block text-xs font-semibold text-[#444748] uppercase tracking-wider mb-2">
                  Monthly Budget
                </label>
                <div className="flex items-center border-b border-[#747878] focus-within:border-black transition-colors pb-1">
                  <span className="text-xl font-bold text-[#444748] mr-2">
                    {currency === 'IDR' ? 'Rp' : '$'}
                  </span>
                  <input
                    type="number"
                    step="1"
                    value={budgetStr}
                    onChange={(e) => setBudgetStr(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent border-0 focus:ring-0 px-0 py-1 text-xl font-bold text-black outline-none"
                  />
                </div>
              </div>

              {/* Icon Picker Grid */}
              <div>
                <label className="block text-xs font-semibold text-[#444748] uppercase tracking-wider mb-3">
                  Icon
                </label>
                <div className="grid grid-cols-5 gap-2.5">
                  {AVAILABLE_ICONS.map((iconName) => {
                    const isSelected = selectedIcon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setSelectedIcon(iconName)}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-black text-white ring-2 ring-black shadow-xs'
                            : 'bg-[#edeeef] text-black hover:bg-[#e1e3e4]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[22px]">
                          {iconName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Danger Zone: Delete Category */}
              {editingCategory && (
                <div className="pt-4 border-t border-[#f3f4f5]">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="text-xs text-[#ba1a1a] hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    <span>Delete this category</span>
                  </button>
                </div>
              )}
            </form>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#c4c7c7] bg-white sticky bottom-0">
              <button
                type="button"
                onClick={handleSave}
                className="w-full py-3.5 bg-black text-white font-semibold text-sm rounded-xl hover:bg-[#2e3132] active:scale-98 transition-all cursor-pointer shadow-sm"
              >
                {editingCategory ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
