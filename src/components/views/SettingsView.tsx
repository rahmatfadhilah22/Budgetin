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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-black">
          Settings
        </h1>
        <p className="text-sm text-[#444748] mt-1">
          Manage your account preferences and personal finance data.
        </p>
      </div>

      {importStatus && (
        <div className="bg-[#6cf8bb]/40 border border-[#006c49] p-3 rounded-xl text-[#006c49] text-xs font-semibold">
          {importStatus}
        </div>
      )}

      {/* ACCOUNT SECTION (Image 13 & 14) */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-[#444748] uppercase tracking-wider">
          Account
        </h3>
        <div className="bg-white border border-[#c4c7c7] rounded-xl overflow-hidden divide-y divide-[#f3f4f5] shadow-2xs">
          <div
            onClick={() => setActiveModal('profile')}
            className="flex items-center justify-between p-4 hover:bg-[#f8f9fa] transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-[#edeeef] text-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-black block">
                  Profile Information
                </span>
                <span className="text-xs text-[#747878]">{user.name} • {user.email}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#747878]">chevron_right</span>
          </div>

          <div
            onClick={() => setActiveModal('security')}
            className="flex items-center justify-between p-4 hover:bg-[#f8f9fa] transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-[#edeeef] text-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <span className="text-sm font-semibold text-black">Security & Password</span>
            </div>
            <span className="material-symbols-outlined text-[#747878]">chevron_right</span>
          </div>

          <div
            onClick={() => setActiveModal('billing')}
            className="flex items-center justify-between p-4 hover:bg-[#f8f9fa] transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-[#edeeef] text-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[20px]">payments</span>
              </div>
              <span className="text-sm font-semibold text-black">Billing</span>
            </div>
            <span className="material-symbols-outlined text-[#747878]">chevron_right</span>
          </div>
        </div>
      </section>

      {/* PREFERENCES SECTION */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-[#444748] uppercase tracking-wider">
          Preferences
        </h3>
        <div className="bg-white border border-[#c4c7c7] rounded-xl overflow-hidden divide-y divide-[#f3f4f5] shadow-2xs">
          {/* Notifications Toggle */}
          <div className="flex items-center justify-between p-4 hover:bg-[#f8f9fa] transition-colors cursor-pointer group">
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-[#edeeef] text-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
              </div>
              <span className="text-sm font-semibold text-black">Notifications</span>
            </div>
            <input
              type="checkbox"
              checked={user.notificationsEnabled}
              onChange={(e) => updateUser({ notificationsEnabled: e.target.checked })}
              className="rounded border-[#c4c7c7] text-black focus:ring-black cursor-pointer w-4 h-4"
            />
          </div>

          {/* Language & Region / Currency */}
          <div
            onClick={() => setActiveModal('language')}
            className="flex items-center justify-between p-4 hover:bg-[#f8f9fa] transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-[#edeeef] text-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[20px]">language</span>
              </div>
              <span className="text-sm font-semibold text-black">Language & Region</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#747878] font-medium">
                {currency === 'USD' ? 'English (USD $)' : 'Indonesian (IDR Rp)'}
              </span>
              <span className="material-symbols-outlined text-[#747878]">chevron_right</span>
            </div>
          </div>

          {/* Appearance */}
          <div
            onClick={() => setActiveModal('appearance')}
            className="flex items-center justify-between p-4 hover:bg-[#f8f9fa] transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-[#edeeef] text-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[20px]">contrast</span>
              </div>
              <span className="text-sm font-semibold text-black">Appearance</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#747878] font-medium capitalize">
                {user.theme}
              </span>
              <span className="material-symbols-outlined text-[#747878]">chevron_right</span>
            </div>
          </div>
        </div>
      </section>

      {/* DATA MANAGEMENT SECTION (Image 13 & 14) */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-[#444748] uppercase tracking-wider">
          Data Management
        </h3>
        <div className="bg-white border border-[#c4c7c7] rounded-xl p-6 shadow-2xs space-y-4">
          <div>
            <h4 className="text-base font-bold text-black tracking-tight mb-1">
              Export Data
            </h4>
            <p className="text-xs text-[#444748] leading-relaxed">
              Download a copy of your transaction history and account data for personal records or use in other software.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={exportCSV}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 border border-black text-black font-semibold text-xs rounded-lg hover:bg-[#f3f4f5] transition-colors active:scale-98 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Export as CSV</span>
            </button>
            <button
              onClick={exportJSON}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 border border-black text-black font-semibold text-xs rounded-lg hover:bg-[#f3f4f5] transition-colors active:scale-98 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">code</span>
              <span>Export as JSON</span>
            </button>
          </div>

          <div className="pt-2 border-t border-[#f3f4f5] flex flex-wrap items-center justify-between gap-2 text-xs">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[#444748] hover:text-black font-semibold underline cursor-pointer"
            >
              Import JSON Backup
            </button>
            <button
              onClick={() => {
                if (confirm('Reset transactions and categories to default sample data?')) {
                  resetToSampleData();
                }
              }}
              className="text-[#444748] hover:text-black font-semibold underline cursor-pointer"
            >
              Reset to Sample Data
            </button>
          </div>
        </div>
      </section>

      {/* DANGER ZONE (Delete Account) */}
      <section className="pt-4 border-t border-[#c4c7c7]">
        <button
          onClick={() => setActiveModal('delete')}
          className="flex items-center space-x-2 text-[#ba1a1a] hover:text-[#93000a] transition-colors text-xs font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
          <span>Delete Account</span>
        </button>
      </section>

      {/* MODALS */}
      {/* Profile Modal */}
      {activeModal === 'profile' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[420px] rounded-2xl border border-[#c4c7c7] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#f3f4f5]">
              <h3 className="font-bold text-lg text-black">Profile Information</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[#747878] hover:text-black"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#444748] block mb-1">Full Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full border border-[#c4c7c7] rounded-lg p-2.5 text-sm font-medium"
                />
              </div>
              <div>
                <label className="font-semibold text-[#444748] block mb-1">Email Address</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full border border-[#c4c7c7] rounded-lg p-2.5 text-sm font-medium"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-black text-white font-semibold py-2.5 rounded-lg hover:bg-[#2e3132] cursor-pointer mt-2"
              >
                Save Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Language & Region Modal */}
      {activeModal === 'language' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[420px] rounded-2xl border border-[#c4c7c7] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#f3f4f5]">
              <h3 className="font-bold text-lg text-black">Language & Currency</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[#747878] hover:text-black"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <label className="font-semibold text-[#444748] block">Select Currency</label>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setCurrency('USD');
                    setActiveModal(null);
                  }}
                  className={`w-full text-left p-3 rounded-lg border flex items-center justify-between cursor-pointer ${
                    currency === 'USD' ? 'border-black bg-[#edeeef] font-bold' : 'border-[#c4c7c7]'
                  }`}
                >
                  <span>United States Dollar ($ USD)</span>
                  {currency === 'USD' && <span className="material-symbols-outlined text-sm">check</span>}
                </button>
                <button
                  onClick={() => {
                    setCurrency('IDR');
                    setActiveModal(null);
                  }}
                  className={`w-full text-left p-3 rounded-lg border flex items-center justify-between cursor-pointer ${
                    currency === 'IDR' ? 'border-black bg-[#edeeef] font-bold' : 'border-[#c4c7c7]'
                  }`}
                >
                  <span>Indonesian Rupiah (Rp IDR)</span>
                  {currency === 'IDR' && <span className="material-symbols-outlined text-sm">check</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appearance Modal */}
      {activeModal === 'appearance' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[420px] rounded-2xl border border-[#c4c7c7] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#f3f4f5]">
              <h3 className="font-bold text-lg text-black">Theme Appearance</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[#747878] hover:text-black"
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
                    user.theme === th ? 'border-black bg-[#edeeef] font-bold' : 'border-[#c4c7c7]'
                  }`}
                >
                  <span>{th} Mode</span>
                  {user.theme === th && <span className="material-symbols-outlined text-sm">check</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete / Clear Modal */}
      {activeModal === 'delete' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[420px] rounded-2xl border border-[#ba1a1a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-[#ba1a1a]">
              <span className="material-symbols-outlined">warning</span>
              <h3 className="font-bold text-lg">Reset & Clear Data</h3>
            </div>
            <p className="text-xs text-[#444748]">
              This action will reset your transactions and preferences. Are you sure you want to proceed?
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2 rounded-lg border border-[#c4c7c7] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToSampleData();
                  setActiveModal(null);
                }}
                className="flex-1 py-2 rounded-lg bg-[#ba1a1a] text-white text-xs font-semibold hover:bg-[#93000a] cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security & Billing placeholders */}
      {['security', 'billing'].includes(activeModal || '') && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[420px] rounded-2xl border border-[#c4c7c7] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#f3f4f5]">
              <h3 className="font-bold text-lg text-black capitalize">{activeModal}</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[#747878] hover:text-black"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="text-xs text-[#444748]">
              {activeModal === 'security'
                ? 'Your local session is secured with standard encryption and offline local storage.'
                : 'Current Tier: Personal Budget (Free & Unlimited). No active subscription charges.'}
            </p>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2 bg-black text-white font-semibold text-xs rounded-lg cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
