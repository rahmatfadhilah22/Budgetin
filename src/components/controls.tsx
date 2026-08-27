import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
        className={`inline-flex min-w-fit items-center border border-hairline bg-canvas font-medium text-ink transition-colors hover:border-muted-soft focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-50 ${size} ${className} ${
          open ? 'border-muted-soft' : ''
        }`}
      >
        <span className="whitespace-nowrap">{current?.label ?? 'Select…'}</span>
        <span
          className={`ml-1.5 flex shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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
