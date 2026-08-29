import React from 'react';
import { useBudget } from '../context/BudgetContext';

export const MobileTopNav: React.FC = () => {
  const { navigateView, privacyMode, setPrivacyMode, setPrivacyPromptOpen, draftCount, settings } = useBudget();

  return (
    <header className="md:hidden bg-canvas w-full top-0 sticky border-b border-hairline z-40">
      {/* Top Bar */}
      <div className="flex justify-between items-center h-16 px-4 max-w-[1200px] mx-auto">
        <h1 className="font-display text-2xl font-medium tracking-tight text-ink">Budget</h1>
        <div className="flex items-center space-x-3">
          {/* Privacy Toggle */}
          <button
            aria-label="Privacy Toggle"
            onClick={() => (privacyMode ? setPrivacyPromptOpen(true) : setPrivacyMode(true))}
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
            onClick={() => navigateView('transactions')}
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
            onClick={() => navigateView('settings')}
            className="w-8 h-8 rounded-full bg-surface-card border border-hairline text-body flex items-center justify-center font-semibold text-sm flex-shrink-0 cursor-pointer"
          >
            {settings.name.trim().slice(0, 1).toUpperCase() || 'U'}
          </button>
        </div>
      </div>

    </header>
  );
};
