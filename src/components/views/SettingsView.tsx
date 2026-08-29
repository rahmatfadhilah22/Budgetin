import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { Select, Toggle } from '../controls';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    changePassword,
    setPeriod,
    period,
    cycleDateRange,
    exportCSV,
    exportJSON,
    setWelcomeOpen,
  } = useBudget();

  const [profileOpen, setProfileOpen] = useState(false);
  const [nameInput, setNameInput] = useState(settings.name);
  const [emailInput, setEmailInput] = useState(settings.email);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pwdOpen, setPwdOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [nextPwd, setNextPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingPwd) return;
    setError(null);
    setPwdSuccess(false);
    if (nextPwd.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (nextPwd !== confirmPwd) {
      setError('New password and confirmation do not match.');
      return;
    }
    setSavingPwd(true);
    try {
      await changePassword(currentPwd, nextPwd);
      setCurrentPwd('');
      setNextPwd('');
      setConfirmPwd('');
      setPwdSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change password');
    } finally {
      setSavingPwd(false);
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
            <Toggle
              checked={settings.notificationsEnabled}
              onChange={handleToggleNotifications}
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
            <Select
              variant="sm"
              value={period}
              onChange={(v) => setPeriod(v as 'monthly' | 'weekly')}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'weekly', label: 'Weekly' },
              ]}
            />
          </div>

          {period === 'monthly' && (
            <div className="flex items-center justify-between p-4 hover:bg-canvas transition-colors cursor-pointer group">
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-full bg-surface-soft text-body flex items-center justify-center group-hover:bg-ink group-hover:text-canvas transition-colors">
                  <span className="material-symbols-outlined text-[20px]">flag</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-body-strong block">Cycle start day</span>
                  <span className="text-xs text-muted-soft">Hari mulai siklus; membatasi angka Dashboard (mis. 25 = 25 → 24)</span>
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

      {/* SECURITY SECTION */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Security</h3>
        <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden divide-y divide-hairline-soft">
          <div
            onClick={() => { setPwdOpen(true); setPwdSuccess(false); setError(null); }}
            className="flex items-center justify-between p-4 hover:bg-canvas transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-surface-soft text-body flex items-center justify-center group-hover:bg-ink group-hover:text-canvas transition-colors">
                <span className="material-symbols-outlined text-[20px]">key</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-body-strong block">Change Password</span>
                <span className="text-xs text-muted-soft">Update your app login password</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-muted-soft">chevron_right</span>
          </div>
        </div>
      </section>

      {/* HELP SECTION */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Help</h3>
        <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden divide-y divide-hairline-soft">
          <div
            onClick={() => setWelcomeOpen(true)}
            className="flex items-center justify-between p-4 hover:bg-canvas transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-surface-soft text-body flex items-center justify-center group-hover:bg-ink group-hover:text-canvas transition-colors">
                <span className="material-symbols-outlined text-[20px]">help</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-body-strong block">Welcome Guide</span>
                <span className="text-xs text-muted-soft">Replay the intro to budget cycles, drafts & recurring</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-muted-soft">chevron_right</span>
          </div>
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

      {/* Profile Modal */}
      {profileOpen && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onMouseDown={() => setProfileOpen(false)}
        >
          <div
            className="bg-surface-soft w-full max-w-[420px] rounded-2xl border border-hairline p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onMouseDown={(e) => e.stopPropagation()}
          >
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

      {/* Change Password Modal */}
      {pwdOpen && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onMouseDown={() => setPwdOpen(false)}
        >
          <div
            className="bg-surface-soft w-full max-w-[420px] rounded-2xl border border-hairline p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-hairline">
              <h3 className="font-display text-lg font-medium text-ink">Change Password</h3>
              <button onClick={() => setPwdOpen(false)} className="text-muted-soft hover:text-ink p-1 rounded-full hover:bg-surface-card cursor-pointer">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {pwdSuccess && (
              <p className="text-xs font-semibold text-success bg-success/10 border border-success/30 px-3 py-2 rounded-lg">
                Password changed successfully.
              </p>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-muted block mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-canvas border border-hairline rounded-lg p-2.5 text-sm font-medium text-ink focus:border-ink outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-muted block mb-1">New Password</label>
                <input
                  type="password"
                  value={nextPwd}
                  onChange={(e) => setNextPwd(e.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-canvas border border-hairline rounded-lg p-2.5 text-sm font-medium text-ink focus:border-ink outline-none"
                />
                <p className="text-[10px] text-muted-soft mt-1">At least 8 characters.</p>
              </div>
              <div>
                <label className="font-semibold text-muted block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-canvas border border-hairline rounded-lg p-2.5 text-sm font-medium text-ink focus:border-ink outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={savingPwd}
                className={`w-full py-2.5 rounded-lg font-semibold cursor-pointer mt-2 ${
                  savingPwd ? 'bg-primary-disabled text-muted' : 'bg-primary text-on-primary hover:bg-primary-active'
                }`}
              >
                {savingPwd ? 'Saving…' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
