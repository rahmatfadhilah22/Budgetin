import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';

export const MobileTopNav: React.FC = () => {
  const { navigateView, privacyMode, setPrivacyMode, setPrivacyPromptOpen, draftCount, settings, logout, t } = useBudget();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  const initials = settings.name.trim().slice(0, 1).toUpperCase() || 'U';

  return (
    <header className="md:hidden bg-canvas w-full top-0 sticky border-b border-hairline z-40">
      {/* Top Bar */}
      <div className="flex justify-between items-center h-16 px-4 max-w-[1200px] mx-auto">
        <h1 className="font-display text-2xl font-medium tracking-tight text-ink">{t('app.name')}</h1>
        <div className="flex items-center space-x-3">
          {/* Privacy Toggle */}
          <button
            aria-label={t('header.privacyToggle')}
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
            aria-label={t('header.notifications')}
            className="text-muted hover:text-ink transition-colors cursor-pointer p-1 active:opacity-70 relative"
          >
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            {draftCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
            )}
          </button>

          {/* User Avatar with account menu */}
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen((o) => !o)}
              aria-label={t('header.accountMenu')}
              aria-expanded={profileMenuOpen}
              className="w-8 h-8 rounded-full bg-surface-card border border-hairline text-body flex items-center justify-center font-semibold text-sm flex-shrink-0 cursor-pointer"
            >
              {initials}
            </button>

            {profileMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-surface-soft border border-hairline rounded-xl shadow-lg p-2 z-50">
                  <div className="p-2 border-b border-hairline-soft">
                    <p className="font-semibold text-sm text-ink">{settings.name || t('common.user')}</p>
                    <p className="text-xs text-muted-soft truncate">{settings.email || t('common.localAccount')}</p>
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
                      <span>{t('header.profileSettings')}</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-card text-error font-medium flex items-center space-x-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      <span>{loggingOut ? t('auth.signingOut') : t('auth.signOut')}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

    </header>
  );
};
