import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';

const WELCOME_KEY = 'budget_welcome_seen';

const STEPS = [
  {
    icon: 'calendar_month',
    title: 'Budget cycles',
    body: 'Your budget runs in cycles — monthly or weekly. Use the ◀ ▶ arrows in the header to browse past and future periods, and set the start day in Settings.',
  },
  {
    icon: 'bolt',
    title: 'Quick Add & drafts',
    body: 'Quick Add logs a transaction in seconds. Skip choosing a category and it is saved as a draft — the bell icon shows how many drafts need attention.',
  },
  {
    icon: 'event_repeat',
    title: 'Recurring templates',
    body: 'Recurring templates remind you of scheduled bills each cycle. When you pay one, mark it as paid so your balance stays accurate.',
  },
];

export const WelcomeModal: React.FC = () => {
  const { welcomeOpen, setWelcomeOpen } = useBudget();
  const [step, setStep] = useState(0);

  if (!welcomeOpen) return null;

  const close = () => {
    localStorage.setItem(WELCOME_KEY, '1');
    setWelcomeOpen(false);
    setStep(0);
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-surface-soft w-full max-w-[420px] rounded-2xl border border-hairline p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-2 border-b border-hairline">
          <h3 className="font-display text-lg font-medium text-ink">Welcome to Budget</h3>
          <button onClick={close} className="text-muted-soft hover:text-ink p-1 rounded-full hover:bg-surface-card cursor-pointer">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="flex flex-col items-center text-center space-y-3 py-2">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">{current.icon}</span>
          </div>
          <h4 className="font-display text-xl font-medium text-ink tracking-tight">{current.title}</h4>
          <p className="text-sm text-muted leading-relaxed">{current.body}</p>
        </div>

        <div className="flex justify-center space-x-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${i === step ? 'bg-primary' : 'bg-hairline'}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <button onClick={close} className="text-xs text-muted hover:text-ink underline underline-offset-2 cursor-pointer">
            Skip
          </button>
          <button
            onClick={() => (isLast ? close() : setStep((s) => s + 1))}
            className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-semibold text-sm hover:bg-primary-active active:scale-98 transition-all cursor-pointer shadow-sm"
          >
            {isLast ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
