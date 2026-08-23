import React from 'react';
import { useBudget } from '../context/BudgetContext';
import { ViewType } from '../types';

export const MobileTopNav: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    privacyMode,
    setPrivacyMode,
    draftCount,
    user,
  } = useBudget();

  const tabs: { id: ViewType; label: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'transactions', label: 'Transactions', badge: draftCount },
    { id: 'categories', label: 'Categories' },
    { id: 'recurring', label: 'Recurring' },
  ];

  return (
    <header className="md:hidden bg-white w-full top-0 sticky border-b border-[#c4c7c7] z-40">
      {/* Top Bar */}
      <div className="flex justify-between items-center h-16 px-4 max-w-[1200px] mx-auto">
        <h1 className="text-xl font-black text-black tracking-tight">Budget</h1>
        <div className="flex items-center space-x-3">
          {/* Privacy Toggle */}
          <button
            aria-label="Privacy Toggle"
            onClick={() => setPrivacyMode((prev) => !prev)}
            className="text-[#444748] hover:text-black transition-colors cursor-pointer p-1 active:opacity-70"
          >
            <span
              className={`material-symbols-outlined text-[24px] ${
                !privacyMode ? 'fill' : ''
              }`}
            >
              {privacyMode ? 'visibility_off' : 'visibility'}
            </span>
          </button>

          {/* Notifications button */}
          <button
            onClick={() => setCurrentView('transactions')}
            aria-label="Notifications"
            className="text-[#444748] hover:text-black transition-colors cursor-pointer p-1 active:opacity-70 relative"
          >
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            {draftCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#b45309] rounded-full" />
            )}
          </button>

          {/* User Avatar */}
          <button
            onClick={() => setCurrentView('settings')}
            className="w-8 h-8 rounded-full overflow-hidden bg-[#e1e3e4] border border-[#c4c7c7] flex-shrink-0 cursor-pointer"
          >
            <img
              src={user.avatarUrl}
              alt="User profile"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>

      {/* Horizontal Nav Tabs */}
      <nav className="flex space-x-6 px-4 overflow-x-auto no-scrollbar border-t border-[#f3f4f5]">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className={`py-2 whitespace-nowrap text-sm font-semibold transition-colors duration-150 cursor-pointer relative ${
                isActive
                  ? 'text-black border-b-2 border-black font-bold'
                  : 'text-[#444748] hover:text-black font-medium'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="text-[10px] px-1.5 py-0.2 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded-full font-bold">
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
