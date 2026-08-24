import React from 'react';
import { useBudget } from '../context/BudgetContext';
import { ViewType } from '../types';

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, setQuickAddOpen, draftCount, unpaidRecurring, currency, setCurrency } = useBudget();

  const navItems: { id: ViewType; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'transactions', label: 'Transactions', icon: 'receipt_long', badge: draftCount },
    { id: 'categories', label: 'Categories', icon: 'category' },
    { id: 'recurring', label: 'Recurring', icon: 'event_repeat', badge: unpaidRecurring.length },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-surface-dark text-on-dark flex-col p-4 space-y-2 z-40 border-r border-[#2a2823]">
      {/* Brand Header */}
      <div className="flex items-center space-x-3 mb-6 mt-1 px-2">
        <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-display font-semibold text-xl shadow-sm">
          B
        </div>
        <div>
          <h1 className="text-xl font-bold text-on-dark leading-tight tracking-tight">Budget</h1>
          <p className="text-xs text-on-dark-soft">Personal Finance</p>
        </div>
      </div>

      {/* Quick Add Button */}
      <button
        id="sidebar-quick-add-btn"
        onClick={() => setQuickAddOpen(true)}
        className="w-full bg-primary text-on-primary hover:bg-primary-active active:scale-95 transition-all duration-150 rounded-lg py-2.5 px-4 mb-4 flex items-center justify-center space-x-2 font-medium text-sm shadow-sm cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        <span>Quick Add</span>
      </button>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer active:scale-98 ${
                isActive
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-dark-soft hover:bg-surface-dark-elevated hover:text-on-dark'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    isActive ? 'fill' : ''
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-on-primary text-primary'
                      : 'bg-warning/20 text-accent-amber'
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Currency Switcher in Sidebar Footer */}
      <div className="pt-3 border-t border-[#2a2823] mt-auto">
        <div className="bg-surface-dark-elevated p-1 rounded-lg flex items-center justify-between text-xs">
          <span className="text-on-dark-soft px-2 font-medium">Currency</span>
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                currency === 'USD'
                  ? 'bg-primary text-on-primary'
                  : 'text-on-dark-soft hover:text-on-dark'
              }`}
            >
              $ USD
            </button>
            <button
              onClick={() => setCurrency('IDR')}
              className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                currency === 'IDR'
                  ? 'bg-primary text-on-primary'
                  : 'text-on-dark-soft hover:text-on-dark'
              }`}
            >
              Rp IDR
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
