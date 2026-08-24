import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    setPeriod,
    period,
    cycleDateRange,
    exportCSV,
    exportJSON,
    logout,
  } = useBudget();

  const [profileOpen, setProfileOpen] = useState(false);
  const [nameInput, setNameInput] = useState(settings.name);
  const [emailInput, setEmailInput] = useState(settings.email);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingProfile) return;
    setSavingProfile(true);
    setError(null);
    try {
      await updateSettings({ name: nameInput.trim(), email: emailInput.trim() });
      setProfileOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setError(null);
    try {
      await updateSettings({ notificationsEnabled: enabled });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update setting');
    }
  };

  const handleChangeCycleDay = async (value: string) => {
    const day = parseInt(value, 10);
    if (Number.isNaN(day) || day < 1 || day > 31) return;
    setError(null);
    try {
      await updateSettings({ cycleStartDay: day });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update setting');
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl animate-in fade-in duration-200">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-medium tracking-tight text-ink">Settings</h1>
        <p className="text-sm text-muted mt-1">Manage your preferences and personal finance data.</p>
      </div>

      {error && <p role="alert" aria-live="polite" className="text-xs font-semibold text-error">{error}</p>}

      {/* PROFILE SECTION */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Profile</h3>
        <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden divide-y divide-hairline-soft">
          <div
            onClick={() => {
              setNameInput(settings.name);
              setEmailInput(settings.email);
              setProfileOpen(true);
            }}
            className="flex items-center justify-between p-4 hover:bg-canvas transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-surface-soft text-body flex items-center justify-center group-hover:bg-ink group-hover:text-canvas transition-colors">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-body-strong block">Profile Information</span>
                <span className="text-xs text-muted-soft">{settings.name || '—'} • {settings.email || '—'}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-muted-soft">chevron_right</span>
          </div>

          <div className="flex items-center justify-between p-4 hover:bg-canvas transition-colors cursor-pointer group">
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-surface-soft text-body flex items-center justify-center group-hover:bg-ink group-hover:text-canvas transition-colors">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-body-strong block">Recurring reminders</span>
                <span className="text-xs text-muted-soft">Show unpaid recurring alerts</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => handleToggleNotifications(e.target.checked)}
              className="rounded border-hairline text-primary focus:ring-primary cursor-pointer w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between p-4 hover:bg-canvas transition-colors cursor-pointer group">
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-surface-soft text-body flex items-center justify-center group-hover:bg-ink group-hover:text-canvas transition-colors">
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-body-strong block">Budget cycle</span>
                <span className="text-xs text-muted-soft">{cycleDateRange}</span>
              </div>
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'monthly' | 'weekly')}
              className="text-xs bg-canvas border border-hairline rounded-lg px-2.5 py-2 font-medium text-ink outline-none cursor-pointer"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          {period === 'monthly' && (
            <div className="flex items-center justify-between p-4 hover:bg-canvas transition-colors cursor-pointer group">
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-full bg-surface-soft text-body flex items-center justify-center group-hover:bg-ink group-hover:text-canvas transition-colors">
                  <span className="material-symbols-outlined text-[20px]">flag</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-body-strong block">Cycle start day</span>
                  <span className="text-xs text-muted-soft">Day of month your cycle begins</span>
                </div>
              </div>
              <input
                type="number"
                min="1"
                max="31"
                value={settings.cycleStartDay}
                onChange={(e) => handleChangeCycleDay(e.target.value)}
                className="text-xs bg-canvas border border-hairline rounded-lg px-2.5 py-2 font-medium text-ink outline-none w-20 text-right cursor-pointer"
              />
            </div>
          )}
        </div>
      </section>

      {/* DATA MANAGEMENT SECTION */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Data Management</h3>
        <div className="bg-surface-card border border-hairline rounded-xl p-6 space-y-4">
          <div>
            <h4 className="text-base font-bold text-body-strong tracking-tight mb-1">Export Data</h4>
            <p className="text-xs text-muted leading-relaxed">
              Download a copy of your transaction history for backup or use in other software.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={exportCSV}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 border border-ink text-ink font-semibold text-xs rounded-lg hover:bg-surface-soft transition-colors active:scale-98 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Export as CSV</span>
            </button>
            <button
              onClick={exportJSON}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 border border-ink text-ink font-semibold text-xs rounded-lg hover:bg-surface-soft transition-colors active:scale-98 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">code</span>
              <span>Export as JSON</span>
            </button>
          </div>
        </div>
      </section>

      {/* SESSION SECTION */}
      <section className="pt-4 border-t border-hairline">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center space-x-2 text-error hover:text-[#a63a3a] transition-colors text-xs font-bold cursor-pointer disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>{loggingOut ? 'Signing out…' : 'Sign out'}</span>
        </button>
      </section>

      {/* Profile Modal */}
      {profileOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-soft w-full max-w-[420px] rounded-2xl border border-hairline p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-hairline">
              <h3 className="font-display text-lg font-medium text-ink">Profile Information</h3>
              <button onClick={() => setProfileOpen(false)} className="text-muted-soft hover:text-ink">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-muted block mb-1">Full Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-canvas border border-hairline rounded-lg p-2.5 text-sm font-medium text-ink focus:border-ink outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-muted block mb-1">Email Address</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-canvas border border-hairline rounded-lg p-2.5 text-sm font-medium text-ink focus:border-ink outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className={`w-full py-2.5 rounded-lg font-semibold cursor-pointer mt-2 ${
                  savingProfile ? 'bg-primary-disabled text-muted' : 'bg-primary text-on-primary hover:bg-primary-active'
                }`}
              >
                {savingProfile ? 'Saving…' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
