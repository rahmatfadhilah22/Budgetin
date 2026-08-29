import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { api, ApiError } from '../api';

export const PrivacyUnlockModal: React.FC = () => {
  const { privacyPromptOpen, setPrivacyPromptOpen, setPrivacyMode } = useBudget();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!privacyPromptOpen) return null;

  const close = () => {
    setPrivacyPromptOpen(false);
    setPassword('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await api<{ authenticated: boolean }>('/api/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setPrivacyMode(false);
      close();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Wrong password');
      setPassword('');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onMouseDown={close}
    >
      <div
        className="bg-surface-soft w-full max-w-[420px] rounded-2xl border border-hairline p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-2 border-b border-hairline">
          <h3 className="font-display text-lg font-medium text-ink">Show Balances</h3>
          <button onClick={close} className="text-muted-soft hover:text-ink p-1 rounded-full hover:bg-surface-card cursor-pointer">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <p className="text-xs text-muted">Enter your password to reveal your balances.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="unlock-password" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              id="unlock-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoFocus
              className="w-full bg-canvas border border-hairline rounded-lg p-2.5 text-sm text-ink placeholder:text-muted-soft focus:border-ink outline-none"
            />
          </div>

          {error && (
            <p role="alert" aria-live="polite" className="text-xs font-semibold text-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!password || submitting}
            className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
              !password || submitting
                ? 'bg-primary-disabled text-muted cursor-not-allowed'
                : 'bg-primary text-on-primary hover:bg-primary-active active:scale-98 shadow-sm'
            }`}
          >
            {submitting ? 'Checking…' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
};
