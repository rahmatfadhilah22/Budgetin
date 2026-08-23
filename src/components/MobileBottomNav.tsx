import React from 'react';
import { useBudget } from '../context/BudgetContext';
import { ViewType } from '../types';

export const MobileBottomNav: React.FC = () => {
  const { currentView, setCurrentView, setQuickAddOpen, draftCount } = useBudget();

  const items: { id: ViewType; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'transactions', label: 'Transactions', icon: 'receipt_long', badge: draftCount },
    { id: 'categories', label: 'Categories', icon: 'category' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <>
      {/* Floating Action Button (Mobile Only) */}
      <button
        id="mobile-fab-quick-add"
        onClick={() => setQuickAddOpen(true)}
        aria-label="Quick Add"
        className="md:hidden fixed bottom-24 right-5 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg border-2 border-black z-40 active:scale-90 transition-transform cursor-pointer"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>

      {/* Mobile Bottom Nav Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-[#c4c7c7] z-40 h-18 flex items-center justify-around px-2 shadow-sm">
        {items.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex flex-col items-center justify-center w-16 h-full cursor-pointer transition-colors relative ${
                isActive ? 'text-black font-semibold' : 'text-[#444748] hover:text-black'
              }`}
            >
              <div className="relative">
                <span
                  className={`material-symbols-outlined text-[24px] ${
                    isActive ? 'fill' : ''
                  }`}
                >
                  {item.icon}
                </span>
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 text-[9px] px-1 bg-[#ba1a1a] text-white rounded-full font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
