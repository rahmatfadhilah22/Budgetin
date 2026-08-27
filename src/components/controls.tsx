import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatDate } from '../date';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  variant?: 'md' | 'sm';
  className?: string;
  disabled?: boolean;
}

/** Fully custom dropdown: styled button + portal menu, no native select chrome. */
export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  variant = 'md',
  className = '',
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({ left: rect.left, top: rect.bottom + 4, width: rect.width });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      const node = buttonRef.current;
      const menu = menuRef.current;
      // Keep the menu open when the click lands inside it (portal is outside the button).
      if (node?.contains(e.target as Node) || menu?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const size =
    variant === 'sm'
      ? 'pl-2.5 pr-2 py-1.5 text-xs rounded-lg'
      : variant === 'lg'
      ? 'pl-3 pr-2.5 py-2.5 font-display text-base rounded-lg'
      : 'pl-3 pr-2.5 py-2 text-sm rounded-lg';

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex min-w-fit items-center justify-between border border-hairline bg-canvas font-medium text-ink transition-colors hover:border-muted-soft focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-50 ${size} ${className} ${
          open ? 'border-muted-soft' : ''
        }`}
      >
        <span className="whitespace-nowrap">{current?.label ?? 'Select…'}</span>
        <span
          className={`ml-1 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <span className="material-symbols-outlined text-[16px]">expand_more</span>
        </span>
      </button>

      {open && coords &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            className="fixed z-50 overflow-hidden rounded-lg border border-hairline bg-surface-soft shadow-lg animate-in fade-in zoom-in-95 duration-100"
            style={{ left: coords.left, top: coords.top, width: Math.max(coords.width, 168) }}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 whitespace-nowrap px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-surface-card ${
                    isSelected ? 'text-primary' : 'text-ink'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
};

interface DatePickerProps {
  value: string; // ISO YYYY-MM-DD
  onChange: (iso: string) => void;
  className?: string;
  disabled?: boolean;
}

const isoOf = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** Custom calendar popover — replaces the native date input (portal + outside-click, like Select). */
export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, className = '', disabled }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);
  const [view, setView] = useState(() => {
    const d = new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Reset the visible month to the selected date whenever the popover opens.
    const d = new Date(`${value}T00:00:00`);
    setView(Number.isNaN(d.getTime()) ? new Date() : d);
    setCoords({ left: rect.left, top: rect.bottom + 4 });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node) || panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const y = view.getFullYear();
  const m = view.getMonth();
  const monthName = view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstWeekday = (new Date(y, m, 1).getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const now = new Date();
  const todayISO = isoOf(now.getFullYear(), now.getMonth(), now.getDate());
  const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={`inline-flex items-center gap-1.5 border border-hairline bg-canvas rounded-lg p-2 text-sm text-ink font-medium hover:border-muted-soft focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-50 ${className}`}
      >
        <span className="material-symbols-outlined text-[18px] text-muted">calendar_today</span>
        <span>{Number.isNaN(new Date(`${value}T00:00:00`).getTime()) ? 'Select date' : formatDate(value)}</span>
      </button>

      {open && coords &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-50 rounded-xl border border-hairline bg-surface-soft shadow-lg animate-in fade-in zoom-in-95 duration-100"
            style={{ left: coords.left, top: coords.top }}
          >
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setView(new Date(y, m - 1, 1))} className="p-1 text-muted hover:text-ink rounded hover:bg-surface-card cursor-pointer" aria-label="Previous month">
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <span className="text-sm font-semibold text-ink">{monthName}</span>
                <button type="button" onClick={() => setView(new Date(y, m + 1, 1))} className="p-1 text-muted hover:text-ink rounded hover:bg-surface-card cursor-pointer" aria-label="Next month">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-muted uppercase">
                {weekdays.map((wd) => <div key={wd} className="py-1">{wd}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((day, i) =>
                  day === null ? <div key={`e${i}`} /> : (
                    <button
                      key={day}
                      type="button"
                      onClick={() => { onChange(isoOf(y, m, day)); setOpen(false); }}
                      className={`h-8 w-8 text-xs rounded-lg cursor-pointer transition-colors ${
                        isoOf(y, m, day) === value
                          ? 'bg-primary text-on-primary font-semibold'
                          : isoOf(y, m, day) === todayISO
                          ? 'text-primary font-semibold ring-1 ring-primary/40 hover:bg-surface-card'
                          : 'text-ink hover:bg-surface-card'
                      }`}
                    >
                      {day}
                    </button>
                  )
                )}
              </div>
              <div className="pt-1 border-t border-hairline-soft flex justify-end">
                <button
                  type="button"
                  onClick={() => { onChange(todayISO); setOpen(false); }}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Today
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

/** Elegant on/off switch (pill) for boolean settings. */
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-10 flex-shrink-0 items-center rounded-full border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50 ${
      checked ? 'border-primary bg-primary' : 'border-hairline bg-surface-card'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0.5'
      }`}
    />
  </button>
);

/** Styled square checkbox with a coral check. */
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  className?: string;
}

/** Shared confirmation dialog — in-app replacement for window.confirm. */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = true,
  busy = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-surface-soft rounded-2xl border border-hairline p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-5"
      >
        <div className="flex items-start space-x-3">
          <span className={`material-symbols-outlined text-[22px] ${destructive ? 'text-error' : 'text-primary'}`}>
            {destructive ? 'warning' : 'help'}
          </span>
          <div>
            <h3 className="font-display text-lg font-medium text-ink tracking-tight">{title}</h3>
            <p className="text-sm text-body mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-body bg-surface-card border border-hairline hover:bg-surface-soft transition-colors cursor-pointer disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 shadow-sm ${
              destructive ? 'bg-error text-white hover:bg-error/90' : 'bg-primary text-on-primary hover:bg-primary-active'
            }`}
          >
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, label, className = '' }) => (
  <label className={`flex items-center space-x-2 text-xs text-body cursor-pointer select-none ${className}`}>
    <span
      className={`inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[4px] border transition-colors focus-within:ring-2 focus-within:ring-primary/30 ${
        checked ? 'border-primary bg-primary' : 'border-hairline bg-canvas'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      {checked && <span className="material-symbols-outlined text-[14px] text-white">check</span>}
    </span>
    <span>{label}</span>
  </label>
);
