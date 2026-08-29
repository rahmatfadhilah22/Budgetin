import React from 'react';
import { BudgetProvider, useBudget } from './context/BudgetContext';
import { Sidebar } from './components/Sidebar';
import { DesktopHeader } from './components/DesktopHeader';
import { MobileTopNav } from './components/MobileTopNav';
import { MobileBottomNav } from './components/MobileBottomNav';
import { QuickAddModal } from './components/QuickAddModal';
import { LoginView } from './components/LoginView';
import { PrivacyUnlockModal } from './components/PrivacyUnlockModal';
import { WelcomeModal } from './components/WelcomeModal';
import { DashboardView } from './components/views/DashboardView';
import { TransactionsView } from './components/views/TransactionsView';
import { CategoriesView } from './components/views/CategoriesView';
import { RecurringView } from './components/views/RecurringView';
import { SettingsView } from './components/views/SettingsView';

const BootLoading: React.FC = () => (
  <div className="min-h-screen bg-canvas text-ink flex items-center justify-center">
    <div className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center font-display font-semibold text-2xl animate-pulse">
      B
    </div>
  </div>
);

const BootError: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="min-h-screen bg-canvas text-ink flex items-center justify-center p-4">
    <div className="bg-surface-card border border-hairline rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
      <span className="material-symbols-outlined text-3xl text-error">error</span>
      <p className="text-sm text-body">{message}</p>
      <button
        onClick={onRetry}
        className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-semibold text-sm hover:bg-primary-active transition-colors cursor-pointer"
      >
        Retry
      </button>
    </div>
  </div>
);

const MainLayout: React.FC = () => {
  const { currentView, authStatus, bootError, retry, locked } = useBudget();

  if (authStatus === 'checking') return <BootLoading />;
  if (authStatus === 'anonymous' || locked) return <LoginView />;
  if (bootError) return <BootError message={bootError} onRetry={retry} />;

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col md:flex-row antialiased selection:bg-ink selection:text-canvas">
      <Sidebar />
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen w-full">
        <MobileTopNav />
        <DesktopHeader />
        <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 md:px-8 py-6 pb-24 md:pb-12">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'transactions' && <TransactionsView />}
          {currentView === 'categories' && <CategoriesView />}
          {currentView === 'recurring' && <RecurringView />}
          {currentView === 'settings' && <SettingsView />}
        </main>
        <MobileBottomNav />
      </div>
      <QuickAddModal />
      <PrivacyUnlockModal />
      <WelcomeModal />
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
