import { useEffect, useId, useState } from 'react';
import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  isSameYear,
  isToday,
  parseISO,
  startOfMonth,
} from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { weekStartOf } from '../lib/dates';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** "Friday 14, January" (year appended when it isn't the current year), as in the Figma. */
function formatDisplay(date) {
  const label = format(date, 'EEEE d, MMMM');
  return isSameYear(date, new Date()) ? label : `${label} ${format(date, 'yyyy')}`;
}

/**
 * Date field that shows the date as "Friday 14, January" and opens a
 * Monday-first month calendar. `value` / `onChange` use "yyyy-MM-dd".
 */
export default function DateField({ id, value, onChange, error, min, max }) {
  const [open, setOpen] = useState(false);
  const date = value ? parseISO(value) : null;

  return (
    <div>
      <button
        id={id}
        type="button"
        onClick={() => setOpen(true)}
        className={`input-base flex items-center justify-between gap-2 text-left ${error ? 'border-danger' : ''}`}
      >
        <span className={`truncate ${date ? 'text-ink' : 'text-ink/50'}`}>{date ? formatDisplay(date) : 'Select date'}</span>
        <CalendarDays size={17} strokeWidth={1.5} className="shrink-0 text-ink/80" />
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}

      {open && (
        <CalendarDialog
          value={date}
          min={min && parseISO(min)}
          max={max && parseISO(max)}
          onCancel={() => setOpen(false)}
          onSelect={(d) => {
            onChange(format(d, 'yyyy-MM-dd'));
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function CalendarDialog({ value, min, max, onCancel, onSelect }) {
  const titleId = useId();
  const [month, setMonth] = useState(() => startOfMonth(value ?? new Date()));
  const [selected, setSelected] = useState(value ?? new Date());

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onCancel]);

  // 6 rows × 7 days, Monday first (consistent with the app's weeks).
  const gridStart = weekStartOf(month);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const outOfRange = (d) => (min && d < min) || (max && d > max);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="animate-fade-in absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-fade-in relative w-full max-w-[340px] bg-white p-5 shadow-2xl"
      >
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wide text-ink/60">Set date</h3>
          <button type="button" onClick={onCancel} aria-label="Close" className="rounded-full p-1 hover:bg-line">
            <X size={18} />
          </button>
        </div>
        <p className="mb-4 text-xl font-medium">{formatDisplay(selected)}</p>

        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            aria-label="Previous month"
            className="rounded-full p-1.5 text-ink/70 hover:bg-line"
          >
            <ChevronLeft size={18} />
          </button>
          <span id={titleId} className="text-sm font-medium" aria-live="polite">
            {format(month, 'MMMM yyyy')}
          </span>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
            className="rounded-full p-1.5 text-ink/70 hover:bg-line"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[11px] text-muted">
          {WEEKDAYS.map((d) => (
            <span key={d} className="py-1">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1" role="grid">
          {days.map((d) => {
            const active = isSameDay(d, selected);
            const disabled = outOfRange(d);
            return (
              <button
                key={d.toISOString()}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setSelected(d);
                  if (!isSameMonth(d, month)) setMonth(startOfMonth(d));
                }}
                aria-pressed={active}
                aria-label={format(d, 'EEEE, d MMMM yyyy')}
                className={`mx-auto flex size-9 items-center justify-center rounded-full text-sm transition disabled:opacity-30 ${
                  active
                    ? 'bg-primary font-medium text-white'
                    : isToday(d)
                      ? 'font-semibold text-primary ring-1 ring-primary/40'
                      : isSameMonth(d, month)
                        ? 'text-ink hover:bg-primary/10'
                        : 'text-ink/30 hover:bg-line'
                }`}
              >
                {format(d, 'd')}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              setSelected(today);
              setMonth(startOfMonth(today));
            }}
            className="mr-auto px-3 py-2 text-sm text-primary hover:bg-primary/10"
          >
            Today
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-ink/70 hover:bg-surface">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSelect(selected)}
            className="bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
