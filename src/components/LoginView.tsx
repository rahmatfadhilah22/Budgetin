import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { api, ApiError } from '../api';

export const LoginView: React.FC = () => {
  const { login, t } = useBudget();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetKey, setResetKey] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed'));
      setPassword('');
      setSubmitting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetSubmitting) return;
    setResetSubmitting(true);
    setResetError(null);
    setResetSuccess(false);
    try {
      await api<{ reset: boolean }>('/api/reset-password', {
        method: 'POST',
        body: JSON.stringify({ key: resetKey, new: newPwd }),
      });
      setResetKey('');
      setNewPwd('');
      setResetSuccess(true);
    } catch (err) {
      setResetError(err instanceof ApiError ? err.message : t('auth.resetFailed'));
    } finally {
      setResetSubmitting(false);
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
            <h1 className="font-display text-2xl font-medium tracking-tight text-ink leading-tight">{t('app.name')}</h1>
            <p className="text-xs text-muted">{t('app.tagline')}</p>
          </div>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-surface-card border border-hairline rounded-2xl p-6 space-y-5"
        >
          <div>
            <h2 className="font-display text-xl font-medium text-ink tracking-tight">{t('auth.signIn')}</h2>
            <p className="text-sm text-muted mt-1">{t('auth.signInSub')}</p>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              {t('auth.password')}
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
            {submitting ? t('auth.signingIn') : t('auth.signIn')}
          </button>

          <p className="text-center">
            <button
              type="button"
              onClick={() => { setResetOpen(true); setResetError(null); setResetSuccess(false); }}
              className="text-xs text-muted hover:text-ink underline underline-offset-2 cursor-pointer"
            >
              {t('auth.forgotPassword')}
            </button>
          </p>
        </form>
      </div>

      {/* Reset Password Modal */}
      {resetOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onMouseDown={() => setResetOpen(false)}
        >
          <div
            className="bg-surface-soft w-full max-w-[420px] rounded-2xl border border-hairline p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-hairline">
              <h3 className="font-display text-lg font-medium text-ink">{t('auth.resetTitle')}</h3>
              <button onClick={() => setResetOpen(false)} className="text-muted-soft hover:text-ink p-1 rounded-full hover:bg-surface-card cursor-pointer">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {resetSuccess && (
              <p className="text-xs font-semibold text-success bg-success/10 border border-success/30 px-3 py-2 rounded-lg">
                {t('auth.resetSuccess')}
              </p>
            )}

            <form onSubmit={handleReset} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-muted block mb-1">{t('auth.resetKey')}</label>
                <input
                  type="password"
                  value={resetKey}
                  onChange={(e) => setResetKey(e.target.value)}
                  autoComplete="off"
                  className="w-full bg-canvas border border-hairline rounded-lg p-2.5 text-sm font-medium text-ink focus:border-ink outline-none"
                />
                <p className="text-[10px] text-muted-soft mt-1">{t('auth.resetKeyHint')}</p>
              </div>
              <div>
                <label className="font-semibold text-muted block mb-1">{t('auth.newPassword')}</label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-canvas border border-hairline rounded-lg p-2.5 text-sm font-medium text-ink focus:border-ink outline-none"
                />
                <p className="text-[10px] text-muted-soft mt-1">{t('auth.minLength8')}</p>
              </div>

              {resetError && <p role="alert" aria-live="polite" className="text-xs font-semibold text-error">{resetError}</p>}

              <button
                type="submit"
                disabled={resetSubmitting || !resetKey || newPwd.length < 8}
                className={`w-full py-2.5 rounded-lg font-semibold cursor-pointer ${
                  resetSubmitting || !resetKey || newPwd.length < 8
                    ? 'bg-primary-disabled text-muted cursor-not-allowed'
                    : 'bg-primary text-on-primary hover:bg-primary-active'
                }`}
              >
                {resetSubmitting ? t('auth.resetting') : t('auth.resetTitle')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
