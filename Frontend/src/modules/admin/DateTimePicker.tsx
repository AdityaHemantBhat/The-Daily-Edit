import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Select } from '../../presentation/primitives';

interface DateTimePickerProps {
  value?: string;
  onChange: (iso: string | undefined) => void;
  placeholder?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const pad = (n: number) => String(n).padStart(2, '0');

function formatLabel(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}, ${pad(h)}:${pad(d.getMinutes())} ${ampm}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Editorial-styled replacement for the native datetime-local picker (whose
// blue chrome clashes with the design system). Portals its panel to body with
// viewport-relative positioning — overlays inside the admin layout must not
// rely on absolute positioning (same rule as the Select primitive).
export function DateTimePicker({ value, onChange, placeholder = 'Select date & time' }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => new Date());
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const selected = value ? new Date(value) : undefined;

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const panelH = panelRef.current?.offsetHeight ?? 360;
      const below = window.innerHeight - rect.bottom;
      const top = below < panelH + 12 ? Math.max(8, rect.top - panelH - 8) : rect.bottom + 8;
      setPos({ left: Math.min(rect.left, window.innerWidth - 320), top });
    };
    place();
    const reposition = () => place();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node) || triggerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openPanel = () => {
    const base = selected ?? new Date();
    setView(new Date(base.getFullYear(), base.getMonth(), 1));
    setOpen(true);
  };

  // Commit a Y/M/D + h/m combination back to the payload.
  const commit = (year: number, month: number, day: number, minutesOfDay: number) => {
    const d = new Date(year, month, day, 0, minutesOfDay);
    onChange(d.toISOString());
  };

  const pickDay = (day: Date) => {
    const timeSrc = selected ?? new Date(0, 0, 0, 9, 0); // default 09:00 when unset
    commit(day.getFullYear(), day.getMonth(), day.getDate(), timeSrc.getHours() * 60 + timeSrc.getMinutes());
  };

  const setTime = (hours24: number, minute: number) => {
    const base = selected ?? new Date();
    commit(base.getFullYear(), base.getMonth(), base.getDate(), hours24 * 60 + minute);
  };

  const setTimeParts = (hour12: number, minute: number, ampm: 'AM' | 'PM') => {
    const h24 = hour12 % 12 + (ampm === 'PM' ? 12 : 0);
    setTime(h24, minute);
  };

  const grid: Date[] = [];
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  for (let i = 0; i < 42; i++) {
    grid.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }

  const now = new Date();
  const hour12 = selected ? (selected.getHours() % 12 || 12) : 9;
  const minute = selected ? selected.getMinutes() : 0;
  const ampm: 'AM' | 'PM' = selected && selected.getHours() >= 12 ? 'PM' : 'AM';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        className={`flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-left text-sm ${open ? 'border-ink-900' : 'border-rule-dark'} ${value ? 'text-ink-900' : 'text-ink-400'}`}
      >
        <span>{value ? formatLabel(value) : placeholder}</span>
        {value ? (
          <span
            role="button"
            aria-label="Clear date"
            className="ml-2 rounded p-0.5 text-ink-400 hover:bg-stone-100 hover:text-ink-800"
            onClick={(e) => {
              e.stopPropagation();
              onChange(undefined);
            }}
          ><X className="size-3.5" /></span>
        ) : null}
      </button>
      {open && pos && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', left: pos.left, top: pos.top, zIndex: 60 }}
          className="w-80 rounded-2xl border border-rule-dark bg-white p-4 shadow-xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
              className="rounded-lg p-1.5 text-ink-500 hover:bg-stone-100 hover:text-ink-900"
              aria-label="Previous month"
            ><ChevronLeft className="size-4" /></button>
            <p className="font-serif text-xl font-semibold text-ink-950">
              {MONTHS[view.getMonth()]} <span className="text-gold-700">{view.getFullYear()}</span>
            </p>
            <button
              type="button"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
              className="rounded-lg p-1.5 text-ink-500 hover:bg-stone-100 hover:text-ink-900"
              aria-label="Next month"
            ><ChevronRight className="size-4" /></button>
          </div>
          <div className="mb-1 grid grid-cols-7">
            {WEEKDAYS.map((wd) => (
              <span key={wd} className="py-1 text-center text-[0.65rem] font-bold uppercase tracking-wider text-ink-400">{wd}</span>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((day) => {
              const outside = day.getMonth() !== view.getMonth();
              const isSelected = !!selected && sameDay(day, selected);
              const isToday = sameDay(day, now);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => pickDay(day)}
                  className={[
                    'mx-auto flex size-8 items-center justify-center rounded-full text-sm',
                    isSelected ? 'bg-gold-600 font-semibold text-white' :
                      isToday ? 'border border-gold-600 text-gold-700' :
                        outside ? 'text-ink-300 hover:bg-stone-100' : 'text-ink-800 hover:bg-stone-100',
                  ].join(' ')}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-rule pt-3">
            <div className="w-20">
              <Select
                value={hour12}
                aria-label="Hour"
                onChange={(e) => setTimeParts(Number(e.target.value), minute, ampm)}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h}>{pad(h)}</option>
                ))}
              </Select>
            </div>
            <span className="text-ink-400">:</span>
            <div className="w-20">
              <Select
                value={minute}
                aria-label="Minute"
                onChange={(e) => setTimeParts(hour12, Number(e.target.value), ampm)}
              >
                {(() => {
                  // 5-minute grid, plus the selected minute when it falls
                  // off-grid (e.g. 07 from an older value) so the trigger
                  // never shows an empty selection.
                  const steps = Array.from({ length: 12 }, (_, i) => i * 5);
                  return steps.includes(minute) ? steps : [...steps, minute].sort((a, b) => a - b);
                })().map((m) => (
                  <option key={m} value={m}>{pad(m)}</option>
                ))}
              </Select>
            </div>
            <div className="w-24">
              <Select
                value={ampm}
                aria-label="AM or PM"
                onChange={(e) => setTimeParts(hour12, minute, e.target.value as 'AM' | 'PM')}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </Select>
            </div>
            <button
              type="button"
              onClick={() => {
                const t = new Date();
                t.setSeconds(0, 0); // seconds aren't editable here — keep the value inside the picker's granularity
                onChange(t.toISOString());
                setView(new Date(t.getFullYear(), t.getMonth(), 1));
              }}
              className="ml-auto text-xs font-semibold text-gold-700 hover:text-gold-600"
            >
              Now
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
