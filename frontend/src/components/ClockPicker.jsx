import { useEffect, useId, useRef, useState } from 'react';
import { Clock, X } from 'lucide-react';

const SIZE = 248; // dial diameter (px)
const R = SIZE / 2;
const LABEL_R = R - 26; // radius at which numbers sit

const pad = (n) => String(n).padStart(2, '0');

/** "HH:mm" (24h) <-> { h12, m, pm } */
function parse(value) {
  if (!value) return { h12: 12, m: 0, pm: false };
  const [h, m] = value.split(':').map(Number);
  return { h12: h % 12 || 12, m, pm: h >= 12 };
}
function serialize({ h12, m, pm }) {
  const h = (h12 % 12) + (pm ? 12 : 0);
  return `${pad(h)}:${pad(m)}`;
}
function formatTime12(value) {
  if (!value) return '';
  const { h12, m, pm } = parse(value);
  return `${h12}:${pad(m)} ${pm ? 'PM' : 'AM'}`;
}

/** Position on the dial for a step out of `total` (0 = 12 o'clock). */
function polar(step, total, radius = LABEL_R) {
  const angle = (step / total) * 2 * Math.PI - Math.PI / 2;
  return { x: R + radius * Math.cos(angle), y: R + radius * Math.sin(angle) };
}

/**
 * Field that opens an analog clock dial: pick the hour, then the minutes
 * (labels every 5, drag for any minute), and AM / PM.
 */
export default function ClockTimeField({ label, value, fallback, onChange, error, clearable = false }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${label} time${value ? `: ${formatTime12(value)}` : ''}`}
        className={`input-base flex items-center gap-2 text-left ${error ? 'border-danger' : ''}`}
      >
        <Clock size={15} className="shrink-0 text-ink/70" />
        <span className={`truncate ${value ? 'text-ink' : 'text-ink/80'}`}>{value ? formatTime12(value) : label}</span>
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}

      {open && (
        <ClockDialog
          title={`${label} time`}
          value={value || fallback}
          clearable={clearable && !!value}
          onCancel={() => setOpen(false)}
          onConfirm={(v) => {
            onChange(v);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ClockDialog({ title, value, clearable, onCancel, onConfirm }) {
  const titleId = useId();
  const [time, setTime] = useState(() => parse(value));
  const [mode, setMode] = useState('hour'); // 'hour' | 'minute'
  const dialRef = useRef(null);
  const dragging = useRef(false);

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

  const total = mode === 'hour' ? 12 : 60;
  const current = mode === 'hour' ? time.h12 % 12 : time.m;

  const setFromPointer = (e) => {
    const rect = dialRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Angle measured clockwise from 12 o'clock, in [0, 1).
    const turn = ((Math.atan2(y, x) + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI);
    if (mode === 'hour') {
      const step = Math.round(turn * 12) % 12;
      setTime((t) => ({ ...t, h12: step === 0 ? 12 : step }));
    } else {
      setTime((t) => ({ ...t, m: Math.round(turn * 60) % 60 }));
    }
  };

  const onPointerDown = (e) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setFromPointer(e);
  };
  const onPointerMove = (e) => dragging.current && setFromPointer(e);
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (mode === 'hour') setMode('minute'); // auto-advance like native clock pickers
  };

  const onDialKey = (e) => {
    const delta = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    if (mode === 'hour') setTime((t) => ({ ...t, h12: ((t.h12 % 12) + delta + 12) % 12 || 12 }));
    else setTime((t) => ({ ...t, m: (t.m + delta + 60) % 60 }));
  };

  const hand = polar(current, total);
  const labels =
    mode === 'hour'
      ? Array.from({ length: 12 }, (_, i) => ({ step: i, text: String(i === 0 ? 12 : i) }))
      : Array.from({ length: 12 }, (_, i) => ({ step: i * 5, text: pad(i * 5) }));
  const onLabel = mode === 'hour' || time.m % 5 === 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="animate-fade-in absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-fade-in relative w-full max-w-[320px] bg-white p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id={titleId} className="text-xs uppercase tracking-wide text-ink/60">
            {title}
          </h3>
          <button type="button" onClick={onCancel} aria-label="Close" className="rounded-full p-1 hover:bg-line">
            <X size={18} />
          </button>
        </div>

        {/* Digital readout: tap hour / minute to switch dial mode */}
        <div className="mb-5 flex items-center justify-center gap-3">
          <div className="flex items-center text-[40px] font-medium leading-none tabular-nums">
            <Segment active={mode === 'hour'} onClick={() => setMode('hour')} label="Hours">
              {pad(time.h12)}
            </Segment>
            <span className="px-1 text-ink/40">:</span>
            <Segment active={mode === 'minute'} onClick={() => setMode('minute')} label="Minutes">
              {pad(time.m)}
            </Segment>
          </div>
          <div className="flex flex-col overflow-hidden rounded-sm border border-line text-xs font-medium">
            {['AM', 'PM'].map((p) => {
              const active = (p === 'PM') === time.pm;
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTime((t) => ({ ...t, pm: p === 'PM' }))}
                  className={`px-2.5 py-1.5 transition ${active ? 'bg-primary text-white' : 'text-ink/60 hover:bg-surface'}`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dial */}
        <div
          ref={dialRef}
          role="slider"
          tabIndex={0}
          aria-label={mode === 'hour' ? 'Hour' : 'Minute'}
          aria-valuemin={mode === 'hour' ? 1 : 0}
          aria-valuemax={mode === 'hour' ? 12 : 59}
          aria-valuenow={mode === 'hour' ? time.h12 : time.m}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onDialKey}
          className="relative mx-auto touch-none select-none rounded-full bg-done-bg outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          style={{ width: SIZE, height: SIZE }}
        >
          <svg width={SIZE} height={SIZE} className="pointer-events-none absolute inset-0">
            <line x1={R} y1={R} x2={hand.x} y2={hand.y} stroke="var(--color-primary)" strokeWidth="2" />
            <circle cx={R} cy={R} r="4" fill="var(--color-primary)" />
            <circle cx={hand.x} cy={hand.y} r="18" fill="var(--color-primary)" />
            {!onLabel && <circle cx={hand.x} cy={hand.y} r="3" fill="#fff" />}
          </svg>
          {labels.map(({ step, text }) => {
            const p = polar(step, total);
            const selected = onLabel && step === current;
            return (
              <span
                key={text}
                className={`pointer-events-none absolute flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-sm ${
                  selected ? 'font-medium text-white' : 'text-ink/80'
                }`}
                style={{ left: p.x, top: p.y }}
              >
                {text}
              </span>
            );
          })}
        </div>

        <p className="mt-3 text-center text-[11px] text-muted">
          {mode === 'hour' ? 'Select hour' : 'Select minutes (drag for any minute)'}
        </p>

        <div className="mt-4 flex items-center gap-2">
          {clearable && (
            <button type="button" onClick={() => onConfirm('')} className="mr-auto px-3 py-2 text-sm text-danger hover:bg-red-50">
              Clear
            </button>
          )}
          <button type="button" onClick={onCancel} className="ml-auto px-4 py-2 text-sm text-ink/70 hover:bg-surface">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(serialize(time))}
            className="bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function Segment({ active, onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`rounded-sm px-2 py-1 transition ${active ? 'bg-primary/10 text-primary' : 'text-ink hover:bg-surface'}`}
    >
      {children}
    </button>
  );
}
