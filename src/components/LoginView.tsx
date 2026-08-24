import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';

export const LoginView: React.FC = () => {
  const { login } = useBudget();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setPassword('');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center p-4 antialiased">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center space-x-3 mb-8 justify-center">
          <div className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center font-display font-semibold text-2xl shadow-sm">
            B
          </div>
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight text-ink leading-tight">Budget</h1>
            <p className="text-xs text-muted">Personal Finance</p>
          </div>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-surface-card border border-hairline rounded-2xl p-6 space-y-5"
        >
          <div>
            <h2 className="font-display text-xl font-medium text-ink tracking-tight">Sign in</h2>
            <p className="text-sm text-muted mt-1">Enter your password to open your budget.</p>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              id="password"
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
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};
