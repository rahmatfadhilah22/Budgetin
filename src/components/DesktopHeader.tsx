import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { ViewType } from '../types';

export const DesktopHeader: React.FC = () => {
  const {
    currentView,
    navigateView,
    period,
    setPeriod,
    cycleDateRange,
    privacyMode,
    setPrivacyMode,
    settings,
    setQuickAddOpen,
    logout,
    draftCount,
    unpaidRecurring,
  } = useBudget();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const getPageTitle = (view: ViewType) => {
    switch (view) {
      case 'dashboard':
        return 'Dashboard';
      case 'transactions':
        return 'Transactions';
      case 'categories':
        return 'Categories';
      case 'recurring':
        return 'Recurring';
      case 'settings':
        return 'Settings';
      default:
        return 'Budget';
    }
  };

  const initials = settings.name.trim().slice(0, 1).toUpperCase() || 'U';
  const alertCount = draftCount + unpaidRecurring.length;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="hidden md:flex justify-between items-center h-16 px-8 max-w-[1200px] mx-auto w-full top-0 sticky bg-canvas text-ink border-b border-hairline z-30">
      {/* Left: View title or breadcrumb */}
      <div className="flex items-center space-x-6">
        <h2 className="font-display text-2xl font-medium tracking-tight text-ink">{getPageTitle(currentView)}</h2>

        {/* Cycle Switcher (visible on dashboard & transactions) */}
        {['dashboard', 'transactions'].includes(currentView) && (
          <div className="flex items-center bg-surface-soft rounded-full p-0.5 border border-hairline">
            <button
              id="period-toggle-monthly"
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                period === 'monthly'
                  ? 'bg-surface-dark text-on-dark'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Monthly
            </button>
            <button
              id="period-toggle-weekly"
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                period === 'weekly'
                  ? 'bg-surface-dark text-on-dark'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Weekly
            </button>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Date range display */}
        {['dashboard', 'transactions'].includes(currentView) && (
          <span className="text-sm font-medium text-body mr-2">
            {cycleDateRange}
          </span>
        )}

        {/* Privacy eye toggle */}
        <button
          id="privacy-toggle-btn"
          onClick={() => setPrivacyMode((prev) => !prev)}
          title={privacyMode ? 'Show Balances' : 'Hide Balances (Privacy Mode)'}
          className="text-muted hover:text-ink p-1.5 rounded-full hover:bg-surface-soft transition-colors cursor-pointer"
        >
          <span
            className={`material-symbols-outlined text-[22px] ${
              !privacyMode ? 'fill' : ''
            }`}
          >
            {privacyMode ? 'visibility_off' : 'visibility'}
          </span>
        </button>

        {/* Derived alerts */}
        <div className="relative">
          <button
            onClick={() => navigateView('transactions')}
            className="text-muted hover:text-ink p-1.5 rounded-full hover:bg-surface-soft transition-colors relative cursor-pointer"
            title="Pending items"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full ring-2 ring-canvas" />
            )}
          </button>
        </div>

        {/* Settings button */}
        <button
          onClick={() => navigateView('settings')}
          className={`p-1.5 rounded-full hover:bg-surface-soft transition-colors cursor-pointer ${
            currentView === 'settings' ? 'text-ink bg-surface-soft' : 'text-muted hover:text-ink'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">settings</span>
        </button>

        {/* User Profile Avatar */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-8 h-8 rounded-full bg-surface-card border border-hairline text-body flex items-center justify-center font-semibold text-sm cursor-pointer hover:ring-2 hover:ring-primary transition-all flex-shrink-0"
          >
            {initials}
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface-soft border border-hairline rounded-xl shadow-lg p-2 z-50">
              <div className="p-2 border-b border-hairline-soft">
                <p className="font-semibold text-sm text-ink">{settings.name || 'User'}</p>
                <p className="text-xs text-muted-soft truncate">{settings.email || 'Local account'}</p>
              </div>
              <div className="py-1 space-y-1 text-xs">
                <button
                  onClick={() => {
                    navigateView('settings');
                    setProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-card text-ink font-medium flex items-center space-x-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  <span>Profile Settings</span>
                </button>
                <button
                  onClick={() => {
                    setQuickAddOpen(true);
                    setProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-card text-ink font-medium flex items-center space-x-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Quick Add Transaction</span>
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-card text-error font-medium flex items-center space-x-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>{loggingOut ? 'Signing out…' : 'Sign out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
