import React from 'react';
import { useBudget } from '../context/BudgetContext';
import { ViewType } from '../types';

export const Sidebar: React.FC = () => {
  const { currentView, navigateView, setQuickAddOpen, draftCount, unpaidRecurring, settings, t } = useBudget();

  const navItems: { id: ViewType; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: 'dashboard' },
    { id: 'transactions', label: t('nav.transactions'), icon: 'receipt_long', badge: draftCount },
    { id: 'recurring', label: t('nav.recurring'), icon: 'event_repeat', badge: unpaidRecurring.length },
    { id: 'categories', label: t('nav.categories'), icon: 'category' },
    { id: 'settings', label: t('nav.settings'), icon: 'settings' },
  ];

  const initials = settings.name.trim().slice(0, 1).toUpperCase() || 'U';

  return (
    <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-surface-dark text-on-dark flex-col p-4 space-y-2 z-40 border-r border-[#2a2823]">
      {/* Brand Header */}
      <div className="flex items-center space-x-3 mb-6 mt-1 px-2">
        <img src="/logo.svg" alt={t('app.name')} className="w-10 h-10 shrink-0" />
        <div>
          <h1 className="text-xl font-bold text-on-dark leading-tight tracking-tight">{t('app.name')}</h1>
          <p className="text-xs text-on-dark-soft">{t('app.tagline')}</p>
        </div>
      </div>

      {/* Quick Add Button */}
      <button
        id="sidebar-quick-add-btn"
        onClick={() => setQuickAddOpen(true)}
        className="w-full bg-primary text-on-primary hover:bg-primary-active active:scale-95 transition-all duration-150 rounded-lg py-2.5 px-4 mb-4 flex items-center justify-center space-x-2 font-medium text-sm shadow-sm cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        <span>{t('common.quickAdd')}</span>
      </button>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => navigateView(item.id)}
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

      {/* User footer */}
      <div className="pt-3 border-t border-[#2a2823] mt-auto">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-8 h-8 rounded-full bg-surface-dark-elevated text-on-dark flex items-center justify-center font-semibold text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-on-dark truncate">{settings.name || t('common.user')}</p>
            <p className="text-[11px] text-on-dark-soft truncate">{settings.email || t('common.localAccount')}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
