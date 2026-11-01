import {
  Children, forwardRef, isValidElement, useCallback, useEffect, useRef, useState,
  type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

// ---- Page container ----
// Every public page renders inside this width so content edges always align
// with the header. Text-heavy sections can still constrain themselves inside.
export function Container({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto max-w-7xl px-4 ${className}`}>{children}</div>;
}

// ---- Button ----
type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-ink-900 text-paper hover:bg-ink-950 disabled:bg-ink-400',
  outline: 'border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-paper',
  ghost: 'text-ink-700 hover:bg-paper-dark',
  danger: 'bg-red-700 text-white hover:bg-red-800',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className = '', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${buttonStyles[variant]} ${buttonSizes[size]} ${className}`}
      {...props}
    />
  );
});

// ---- Inputs ----
const fieldStyles =
  'w-full border border-rule-dark bg-white px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/10 disabled:bg-paper-dark';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = '', ...props },
  ref,
) {
  return <input ref={ref} className={`${fieldStyles} ${className}`} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = '', ...props }, ref) {
    return <textarea ref={ref} className={`${fieldStyles} ${className}`} {...props} />;
  },
);

// ---- Custom dropdown ----
// Drop-in replacement for <select> with the same controlled API
// (value + onChange(e.target.value)); <option> children become menu items.

interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

/** DOM semantics: an <option> without a value attribute uses its text content. */
function optionText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (isValidElement(node)) return optionText((node.props as { children?: ReactNode }).children);
  if (Array.isArray(node)) return node.map(optionText).join('');
  return '';
}

function optionsFromChildren(children: ReactNode): SelectOption[] {
  const out: SelectOption[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && (child.type === 'option' || (child.type as { name?: string })?.name === 'option')) {
      const props = child.props as { value?: string | number; children?: ReactNode; disabled?: boolean };
      out.push({
        value: String(props.value ?? optionText(props.children)),
        label: props.children,
        disabled: props.disabled,
      });
    }
  });
  return out;
}

export function Select({
  value, onChange, className = '', disabled, required, 'aria-label': ariaLabel, children,
}: {
  value: string | number;
  onChange: (e: { target: { value: string } }) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  'aria-label'?: string;
  children: ReactNode;
}) {
  const options = optionsFromChildren(children);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [coords, setCoords] = useState<{ left: number; top: number; width: number; maxH: number; openUp: boolean } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === String(value));
  const activeIndex = options.findIndex((o) => o.value === String(value));

  const MENU_GAP = 6;

  // Compute menu placement from the trigger's viewport rect so the menu can be
  // portaled to <body> — never clipped by tables, modals or scroll containers.
  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const menuH = Math.min(240, options.length * 40 + 8);
    const openUp = spaceBelow < menuH + MENU_GAP && r.top > spaceBelow;
    setCoords({
      left: r.left,
      top: openUp ? r.top - MENU_GAP : r.bottom + MENU_GAP,
      width: r.width,
      maxH: Math.max(120, (openUp ? r.top - MENU_GAP * 2 : spaceBelow - MENU_GAP * 2)),
      openUp,
    });
  }, [options.length]);

  useEffect(() => {
    if (!open) return;
    place();
    function onPointerDown(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    // capture: true — scroll in ANY ancestor (tables, modals) repositions the menu.
    document.addEventListener('mousedown', onPointerDown, true);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('mousedown', onPointerDown, true);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);

  useEffect(() => {
    if (open && menuRef.current) {
      menuRef.current.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
    }
  }, [open]);

  function commit(option: SelectOption) {
    if (option.disabled) return;
    onChange({ target: { value: option.value } });
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        setHighlight(activeIndex);
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlight((h) => {
          let next = h < 0 ? activeIndex : h;
          do { next = Math.min(next + 1, options.length - 1); } while (options[next]?.disabled && next < options.length - 1);
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlight((h) => {
          let next = h < 0 ? activeIndex : h;
          do { next = Math.max(next - 1, 0); } while (options[next]?.disabled && next > 0);
          return next;
        });
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlight >= 0 && options[highlight]) commit(options[highlight]);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`} data-required={required || undefined}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => { setHighlight(activeIndex); setOpen((v) => !v); }}
        onKeyDown={onKeyDown}
        className={`${fieldStyles} flex items-center justify-between gap-2 text-left ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <span className="truncate">{selected ? selected.label : <span className="text-ink-400">Select…</span>}</span>
        <ChevronDown className={`size-4 shrink-0 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && coords && createPortal(
        <motion.ul
          ref={menuRef}
          role="listbox"
          initial={{ opacity: 0, y: coords.openUp ? 4 : -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: coords.openUp ? 4 : -4 }}
          transition={{ duration: 0.12 }}
          style={{
            position: 'fixed',
            left: coords.left,
            width: coords.width,
            maxHeight: coords.maxH,
            ...(coords.openUp ? { bottom: window.innerHeight - coords.top } : { top: coords.top }),
          }}
          className="z-[100] overflow-y-auto border border-rule-dark bg-white py-1 shadow-lg scroll-thin"
        >
            {options.map((o, i) => {
              const isSelected = o.value === String(value);
              const isHighlighted = i === highlight;
              return (
                <li
                  key={o.value || i}
                  role="option"
                  aria-selected={isSelected}
                  data-active={isSelected || undefined}
                  className={`flex cursor-pointer items-center justify-between gap-2 px-3.5 py-2 text-sm ${
                    isSelected ? 'bg-ink-950 font-semibold text-paper' : isHighlighted ? 'bg-paper-dark text-ink-950' : 'text-ink-700'
                  } ${o.disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => commit(o)}
                >
                  <span className="truncate">{o.label}</span>
                  {isSelected && <Check className="size-3.5 shrink-0" aria-hidden />}
                </li>
              );
            })}
        </motion.ul>,
        document.body,
      )}
    </div>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-ink-500">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
    </label>
  );
}

// ---- Badge / category label ----
export function Badge({ children, tone = 'gold' }: { children: ReactNode; tone?: 'gold' | 'neutral' | 'green' | 'red' }) {
  const tones = {
    gold: 'bg-gold-100 text-gold-700',
    neutral: 'bg-paper-dark text-ink-700',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest ${tones[tone]}`}>
      {children}
    </span>
  );
}

// ---- Spinner / loading ----
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block size-5 animate-spin rounded-full border-2 border-rule-dark border-t-ink-900 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-paper-dark ${className}`} />;
}

export function EmptyState({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <div className="border border-dashed border-rule-dark px-8 py-14 text-center">
      <p className="font-serif text-2xl text-ink-900">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">{body}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

export function Alert({ tone = 'error', children }: { tone?: 'error' | 'success' | 'info'; children: ReactNode }) {
  const tones = {
    error: 'border-red-300 bg-red-50 text-red-800',
    success: 'border-green-300 bg-green-50 text-green-800',
    info: 'border-blue-300 bg-blue-50 text-blue-900',
  };
  return <div className={`border px-4 py-3 text-sm ${tones[tone]}`} role="alert">{children}</div>;
}

// ---- Pagination ----
/** Numbered pagination with ellipsis, prev/next arrows. Renders nothing for a single page. */
export function Pagination({
  page, pages, onPage, className = '', label = 'Items',
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
  className?: string;
  label?: string;
}) {
  if (pages <= 1) return null;

  const nums: (number | '…')[] = [];
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) nums.push(i);
  } else {
    nums.push(1);
    const lo = Math.max(2, page - 1);
    const hi = Math.min(pages - 1, page + 1);
    if (lo > 2) nums.push('…');
    for (let i = lo; i <= hi; i++) nums.push(i);
    if (hi < pages - 1) nums.push('…');
    nums.push(pages);
  }

  return (
    <nav className={`flex flex-wrap items-center justify-center gap-2 ${className}`} aria-label={`${label} pagination`}>
      <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">←</Button>
      {nums.map((n, i) =>
        n === '…' ? (
          <span key={`e${i}`} className="px-1 text-sm text-ink-400">…</span>
        ) : (
          <button
            key={n}
            onClick={() => onPage(n)}
            aria-label={`Go to page ${n}`}
            aria-current={n === page ? 'page' : undefined}
            className={`size-8 rounded text-sm font-semibold ${n === page ? 'bg-ink-900 text-paper' : 'border border-rule-dark text-ink-700 hover:border-ink-900'}`}
          >
            {n}
          </button>
        ),
      )}
      <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">→</Button>
    </nav>
  );
}

// ---- Section heading (editorial kicker style) ----
export function SectionHeading({ kicker, title, action }: { kicker: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4 border-b-2 border-ink-900 pb-3">
      <div>
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-gold-600">{kicker}</p>
        <h2 className="mt-1 font-serif text-3xl font-semibold text-ink-950 md:text-4xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function ConfirmDialog({
  open, title, body, confirmLabel = 'Delete', onConfirm, onCancel, busy,
}: {
  open: boolean; title: string; body: string; confirmLabel?: string;
  onConfirm: () => void; onCancel: () => void; busy?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-md bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h3 className="font-serif text-2xl font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-ink-500">{body}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
