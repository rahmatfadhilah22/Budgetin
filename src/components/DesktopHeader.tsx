import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { ViewType } from '../types';

export const DesktopHeader: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    period,
    setPeriod,
    cycleDateRange,
    privacyMode,
    setPrivacyMode,
    notifications,
    markNotificationRead,
    clearNotifications,
    user,
    setQuickAddOpen,
  } = useBudget();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

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

  return (
    <header className="hidden md:flex justify-between items-center h-16 px-8 max-w-[1200px] mx-auto w-full top-0 sticky bg-[#ffffff] text-black border-b border-[#c4c7c7] z-30">
      {/* Left: View title or breadcrumb */}
      <div className="flex items-center space-x-6">
        <h2 className="text-xl font-bold tracking-tight text-black">{getPageTitle(currentView)}</h2>

        {/* Cycle Switcher (visible on dashboard & transactions) */}
        {['dashboard', 'transactions'].includes(currentView) && (
          <div className="flex items-center bg-[#edeeef] rounded-full p-0.5 border border-[#c4c7c7]">
            <button
              id="period-toggle-monthly"
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                period === 'monthly'
                  ? 'bg-black text-white'
                  : 'text-[#444748] hover:text-black'
              }`}
            >
              Monthly
            </button>
            <button
              id="period-toggle-weekly"
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                period === 'weekly'
                  ? 'bg-black text-white'
                  : 'text-[#444748] hover:text-black'
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
          <span className="text-sm font-semibold text-[#191c1d] mr-2">
            {cycleDateRange}
          </span>
        )}

        {/* Privacy eye toggle */}
        <button
          id="privacy-toggle-btn"
          onClick={() => setPrivacyMode((prev) => !prev)}
          title={privacyMode ? 'Show Balances' : 'Hide Balances (Privacy Mode)'}
          className="text-[#444748] hover:text-black p-1.5 rounded-full hover:bg-[#f3f4f5] transition-colors cursor-pointer"
        >
          <span
            className={`material-symbols-outlined text-[22px] ${
              !privacyMode ? 'fill' : ''
            }`}
          >
            {privacyMode ? 'visibility_off' : 'visibility'}
          </span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            id="notifications-btn"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="text-[#444748] hover:text-black p-1.5 rounded-full hover:bg-[#f3f4f5] transition-colors relative cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#ba1a1a] rounded-full ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#c4c7c7] rounded-xl shadow-lg p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-[#c4c7c7]">
                <span className="font-semibold text-sm">Notifications</span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-xs text-[#444748] hover:text-black underline cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[#f3f4f5] py-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-[#444748] py-4 text-center">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.actionUrl) {
                          setCurrentView(n.actionUrl);
                          setNotificationsOpen(false);
                        }
                      }}
                      className={`p-2.5 text-xs rounded-lg transition-colors cursor-pointer ${
                        !n.read ? 'bg-[#FEF3C7]/40 font-medium' : 'hover:bg-[#f3f4f5]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-black">{n.title}</span>
                        <span className="text-[10px] text-[#747878]">{n.date}</span>
                      </div>
                      <p className="text-[#444748] mt-1">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings button */}
        <button
          onClick={() => setCurrentView('settings')}
          className={`p-1.5 rounded-full hover:bg-[#f3f4f5] transition-colors cursor-pointer ${
            currentView === 'settings' ? 'text-black bg-[#f3f4f5]' : 'text-[#444748] hover:text-black'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">settings</span>
        </button>

        {/* User Profile Avatar */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-8 h-8 rounded-full overflow-hidden border border-[#c4c7c7] cursor-pointer hover:ring-2 hover:ring-black transition-all flex-shrink-0"
          >
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#c4c7c7] rounded-xl shadow-lg p-2 z-50">
              <div className="p-2 border-b border-[#f3f4f5]">
                <p className="font-semibold text-sm text-black">{user.name}</p>
                <p className="text-xs text-[#747878] truncate">{user.email}</p>
              </div>
              <div className="py-1 space-y-1 text-xs">
                <button
                  onClick={() => {
                    setCurrentView('settings');
                    setProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-[#f3f4f5] text-black font-medium flex items-center space-x-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  <span>Profile Settings</span>
                </button>
                <button
                  onClick={() => {
                    setQuickAddOpen(true);
                    setProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-[#f3f4f5] text-black font-medium flex items-center space-x-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Quick Add Transaction</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
