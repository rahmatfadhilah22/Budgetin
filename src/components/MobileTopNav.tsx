import React from 'react';
import { useBudget } from '../context/BudgetContext';
import { ViewType } from '../types';

export const MobileTopNav: React.FC = () => {
  const { currentView, setCurrentView, privacyMode, setPrivacyMode, draftCount, settings } = useBudget();

  const tabs: { id: ViewType; label: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'transactions', label: 'Transactions', badge: draftCount },
    { id: 'categories', label: 'Categories' },
    { id: 'recurring', label: 'Recurring' },
  ];

  return (
    <header className="md:hidden bg-canvas w-full top-0 sticky border-b border-hairline z-40">
      {/* Top Bar */}
      <div className="flex justify-between items-center h-16 px-4 max-w-[1200px] mx-auto">
        <h1 className="font-display text-2xl font-medium tracking-tight text-ink">Budget</h1>
        <div className="flex items-center space-x-3">
          {/* Privacy Toggle */}
          <button
            aria-label="Privacy Toggle"
            onClick={() => setPrivacyMode((prev) => !prev)}
            className="text-muted hover:text-ink transition-colors cursor-pointer p-1 active:opacity-70"
          >
            <span
              className={`material-symbols-outlined text-[24px] ${
                !privacyMode ? 'fill' : ''
              }`}
            >
              {privacyMode ? 'visibility_off' : 'visibility'}
            </span>
          </button>

          {/* Alerts button */}
          <button
            onClick={() => setCurrentView('transactions')}
            aria-label="Notifications"
            className="text-muted hover:text-ink transition-colors cursor-pointer p-1 active:opacity-70 relative"
          >
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            {draftCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
            )}
          </button>

          {/* User Avatar */}
          <button
            onClick={() => setCurrentView('settings')}
            className="w-8 h-8 rounded-full bg-surface-card border border-hairline text-body flex items-center justify-center font-semibold text-sm flex-shrink-0 cursor-pointer"
          >
            {settings.name.trim().slice(0, 1).toUpperCase() || 'U'}
          </button>
        </div>
      </div>

      {/* Horizontal Nav Tabs */}
      <nav className="flex space-x-6 px-4 overflow-x-auto no-scrollbar border-t border-hairline-soft">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className={`py-2 whitespace-nowrap text-sm font-semibold transition-colors duration-150 cursor-pointer relative ${
                isActive
                  ? 'text-ink border-b-2 border-primary font-bold'
                  : 'text-muted hover:text-ink font-medium'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="text-[10px] px-1.5 py-0.2 bg-warning/15 text-accent-amber border border-warning/40 rounded-full font-bold">
                    {tab.badge}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
