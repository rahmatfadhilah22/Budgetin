import React, { useState, useRef } from 'react';
import { useBudget } from '../../context/BudgetContext';

export const SettingsView: React.FC = () => {
  const {
    user,
    updateUser,
    currency,
    setCurrency,
    exportCSV,
    exportJSON,
    importJSON,
    resetToSampleData,
  } = useBudget();

  const [activeModal, setActiveModal] = useState<
    'profile' | 'security' | 'billing' | 'language' | 'appearance' | 'delete' | null
  >(null);

  // Form states for modals
  const [nameInput, setNameInput] = useState(user.name);
  const [emailInput, setEmailInput] = useState(user.email);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name: nameInput, email: emailInput });
    setActiveModal(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importJSON(content);
        if (ok) {
          setImportStatus('Data successfully imported!');
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          alert('Invalid backup file format. Please provide a valid Budget JSON backup.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-3xl animate-in fade-in duration-200">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-medium tracking-tight text-ink">
          Settings
        </h1>
        <p className="text-sm text-muted mt-1">
          Manage your account preferences and personal finance data.
        </p>
      </div>

      {importStatus && (
        <div className="bg-success/15 border border-success/40 p-3 rounded-xl text-success text-xs font-semibold">
          {importStatus}
        </div>
      )}

      {/* ACCOUNT SECTION */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
          Account
        </h3>
        <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden divide-y divide-hairline-soft">
          <div
            onClick={() => setActiveModal('profile')}
            className="flex items-center justify-between p-4 hover:bg-canvas transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-surface-soft text-body flex items-center justify-center group-hover:bg-ink group-hover:text-canvas transition-colors">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-body-strong block">
                  Profile Information
                </span>
                <span className="text-xs text-muted-soft">{user.name} • {user.email}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-muted-soft">chevron_right</span>
          </div>

          <div
            onClick={() => setActiveModal('security')}
            className="flex items-center justify-between p-4 hover:bg-canvas transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-surface-soft text-body flex items-center justify-center group-hover:bg-ink group-hover:text-canvas transition-colors">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <span className="text-sm font-semibold text-body-strong">Security & Password</span>
            </div>
            <span className="material-symbols-outlined text-muted-soft">chevron_right</span>
          </div>

          <div
            onClick={() => setActiveModal('billing')}
            className="flex items-center justify-between p-4 hover:bg-canvas transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-surface-soft text-body flex items-center justify-center group-hover:bg-ink group-hover:text-canvas transition-colors">
                <span className="material-symbols-outlined text-[20px]">payments</span>
              </div>
              <span className="text-sm font-semibold text-body-strong">Billing</span>
            </div>
            <span className="material-symbols-outlined text-muted-soft">chevron_right</span>
          </div>
        </div>
      </section>

      {/* PREFERENCES SECTION */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
          Preferences
        </h3>
        <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden divide-y divide-hairline-soft">
          {/* Notifications Toggle */}
          <div className="flex items-center justify-between p-4 hover:bg-canvas transition-colors cursor-pointer group">
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-surface-soft text-body flex items-center justify-center group-hover:bg-ink group-hover:text-canvas transition-colors">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
              </div>
              <span className="text-sm font-semibold text-body-strong">Notifications</span>
            </div>
            <input
              type="checkbox"
              checked={user.notificationsEnabled}
              onChange={(e) => updateUser({ notificationsEnabled: e.target.checked })}
              className="rounded border-hairline text-primary focus:ring-primary cursor-pointer w-4 h-4"
            />
          </div>

          {/* Language & Region / Currency */}
          <div
            onClick={() => setActiveModal('language')}
            className="flex items-center justify-between p-4 hover:bg-canvas transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-surface-soft text-body flex items-center justify-center group-hover:bg-ink group-hover:text-canvas transition-colors">
                <span className="material-symbols-outlined text-[20px]">language</span>
              </div>
              <span className="text-sm font-semibold text-body-strong">Language & Region</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-soft font-medium">
                {currency === 'USD' ? 'English (USD $)' : 'Indonesian (IDR Rp)'}
              </span>
              <span className="material-symbols-outlined text-muted-soft">chevron_right</span>
            </div>
          </div>

          {/* Appearance */}
          <div
            onClick={() => setActiveModal('appearance')}
            className="flex items-center justify-between p-4 hover:bg-canvas transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-surface-soft text-body flex items-center justify-center group-hover:bg-ink group-hover:text-canvas transition-colors">
                <span className="material-symbols-outlined text-[20px]">contrast</span>
              </div>
              <span className="text-sm font-semibold text-body-strong">Appearance</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-soft font-medium capitalize">
                {user.theme}
              </span>
              <span className="material-symbols-outlined text-muted-soft">chevron_right</span>
            </div>
          </div>
        </div>
      </section>

      {/* DATA MANAGEMENT SECTION */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
          Data Management
        </h3>
        <div className="bg-surface-card border border-hairline rounded-xl p-6 space-y-4">
          <div>
            <h4 className="text-base font-bold text-body-strong tracking-tight mb-1">
              Export Data
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Download a copy of your transaction history and account data for personal records or use in other software.
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

          <div className="pt-2 border-t border-hairline-soft flex flex-wrap items-center justify-between gap-2 text-xs">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-muted hover:text-ink font-semibold underline cursor-pointer"
            >
              Import JSON Backup
            </button>
            <button
              onClick={() => {
                if (confirm('Reset transactions and categories to default sample data?')) {
                  resetToSampleData();
                }
              }}
              className="text-muted hover:text-ink font-semibold underline cursor-pointer"
            >
              Reset to Sample Data
            </button>
          </div>
        </div>
      </section>

      {/* DANGER ZONE (Delete Account) */}
      <section className="pt-4 border-t border-hairline">
        <button
          onClick={() => setActiveModal('delete')}
          className="flex items-center space-x-2 text-error hover:text-[#a63a3a] transition-colors text-xs font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
          <span>Delete Account</span>
        </button>
      </section>

      {/* MODALS */}
      {/* Profile Modal */}
      {activeModal === 'profile' && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-soft w-full max-w-[420px] rounded-2xl border border-hairline p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-hairline">
              <h3 className="font-display text-lg font-medium text-ink">Profile Information</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-muted-soft hover:text-ink"
              >
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
                className="w-full bg-primary text-on-primary font-semibold py-2.5 rounded-lg hover:bg-primary-active cursor-pointer mt-2"
              >
                Save Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Language & Region Modal */}
      {activeModal === 'language' && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-soft w-full max-w-[420px] rounded-2xl border border-hairline p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-hairline">
              <h3 className="font-display text-lg font-medium text-ink">Language & Currency</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-muted-soft hover:text-ink"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <label className="font-semibold text-muted block">Select Currency</label>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setCurrency('USD');
                    setActiveModal(null);
                  }}
                  className={`w-full text-left p-3 rounded-lg border flex items-center justify-between cursor-pointer ${
                    currency === 'USD' ? 'border-ink bg-surface-card font-bold' : 'border-hairline'
                  }`}
                >
                  <span>United States Dollar ($ USD)</span>
                  {currency === 'USD' && <span className="material-symbols-outlined text-sm text-primary">check</span>}
                </button>
                <button
                  onClick={() => {
                    setCurrency('IDR');
                    setActiveModal(null);
                  }}
                  className={`w-full text-left p-3 rounded-lg border flex items-center justify-between cursor-pointer ${
                    currency === 'IDR' ? 'border-ink bg-surface-card font-bold' : 'border-hairline'
                  }`}
                >
                  <span>Indonesian Rupiah (Rp IDR)</span>
                  {currency === 'IDR' && <span className="material-symbols-outlined text-sm text-primary">check</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appearance Modal */}
      {activeModal === 'appearance' && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-soft w-full max-w-[420px] rounded-2xl border border-hairline p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-hairline">
              <h3 className="font-display text-lg font-medium text-ink">Theme Appearance</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-muted-soft hover:text-ink"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {['light', 'dark', 'system'].map((th) => (
                <button
                  key={th}
                  onClick={() => {
                    updateUser({ theme: th as any });
                    setActiveModal(null);
                  }}
                  className={`w-full text-left p-3 rounded-lg border capitalize flex items-center justify-between cursor-pointer ${
                    user.theme === th ? 'border-ink bg-surface-card font-bold' : 'border-hairline'
                  }`}
                >
                  <span>{th} Mode</span>
                  {user.theme === th && <span className="material-symbols-outlined text-sm text-primary">check</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete / Clear Modal */}
      {activeModal === 'delete' && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-soft w-full max-w-[420px] rounded-2xl border border-error p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-error">
              <span className="material-symbols-outlined">warning</span>
              <h3 className="font-display text-lg font-medium">Reset & Clear Data</h3>
            </div>
            <p className="text-xs text-body">
              This action will reset your transactions and preferences. Are you sure you want to proceed?
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2 rounded-lg border border-hairline text-xs font-semibold text-ink cursor-pointer hover:bg-surface-card"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToSampleData();
                  setActiveModal(null);
                }}
                className="flex-1 py-2 rounded-lg bg-error text-on-primary text-xs font-semibold hover:bg-[#a63a3a] cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security & Billing placeholders */}
      {['security', 'billing'].includes(activeModal || '') && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-soft w-full max-w-[420px] rounded-2xl border border-hairline p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-hairline">
              <h3 className="font-display text-lg font-medium text-ink capitalize">{activeModal}</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-muted-soft hover:text-ink"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="text-xs text-body">
              {activeModal === 'security'
                ? 'Your local session is secured with standard encryption and offline local storage.'
                : 'Current Tier: Personal Budget (Free & Unlimited). No active subscription charges.'}
            </p>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2 bg-ink text-on-dark font-semibold text-xs rounded-lg hover:bg-body-strong cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
