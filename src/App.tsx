import React from 'react';
import { BudgetProvider, useBudget } from './context/BudgetContext';
import { Sidebar } from './components/Sidebar';
import { DesktopHeader } from './components/DesktopHeader';
import { MobileTopNav } from './components/MobileTopNav';
import { MobileBottomNav } from './components/MobileBottomNav';
import { QuickAddModal } from './components/QuickAddModal';
import { DashboardView } from './components/views/DashboardView';
import { TransactionsView } from './components/views/TransactionsView';
import { CategoriesView } from './components/views/CategoriesView';
import { RecurringView } from './components/views/RecurringView';
import { SettingsView } from './components/views/SettingsView';

const MainLayout: React.FC = () => {
  const { currentView } = useBudget();

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#191c1d] flex flex-col md:flex-row antialiased selection:bg-black selection:text-white">
      {/* Desktop Fixed Sidebar */}
      <Sidebar />

      {/* Main App Canvas */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen w-full">
        {/* Mobile Header with Tabs */}
        <MobileTopNav />

        {/* Desktop Header */}
        <DesktopHeader />

        {/* Content View Area */}
        <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 md:px-8 py-6 pb-24 md:pb-12">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'transactions' && <TransactionsView />}
          {currentView === 'categories' && <CategoriesView />}
          {currentView === 'recurring' && <RecurringView />}
          {currentView === 'settings' && <SettingsView />}
        </main>

        {/* Mobile Sticky Bottom Nav & Quick Add FAB */}
        <MobileBottomNav />
      </div>

      {/* Global Quick Add Modal */}
      <QuickAddModal />
    </div>
  );
};

export default function App() {
  return (
    <BudgetProvider>
      <MainLayout />
    </BudgetProvider>
  );
}
