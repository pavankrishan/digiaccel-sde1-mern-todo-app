import { CircleAlert, CircleCheck, PencilLine, Trash2, X } from 'lucide-react';

export const TOAST_DURATION = 3200;

const TONES = {
  created: { icon: CircleCheck, iconClass: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500' },
  updated: { icon: PencilLine, iconClass: 'bg-primary/10 text-primary', bar: 'bg-primary' },
  deleted: { icon: Trash2, iconClass: 'bg-red-50 text-danger', bar: 'bg-danger' },
  error: { icon: CircleAlert, iconClass: 'bg-red-50 text-danger', bar: 'bg-danger' },
};

/**
 * Notification card that slides in from the top with an icon, a title, an
 * optional detail line and a bar counting down until it disappears.
 */
export default function Toast({ toast, leaving, onClose, onPause, onResume }) {
  if (!toast) return null;
  const tone = TONES[toast.tone] ?? TONES.updated;
  const Icon = tone.icon;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[90] flex justify-center px-4">
      <div
        key={toast.key}
        role={toast.tone === 'error' ? 'alert' : 'status'}
        aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
        onMouseEnter={onPause}
        onMouseLeave={onResume}
        className={`group pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-lg border border-line bg-white shadow-[0_12px_32px_-8px_rgba(27,27,31,0.25)] ${
          leaving ? 'animate-toast-out' : 'animate-toast-in'
        }`}
      >
        <div className="flex items-start gap-3 p-3.5 pr-10">
          <span className={`animate-pop flex size-9 shrink-0 items-center justify-center rounded-full ${tone.iconClass}`}>
            <Icon size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-medium text-ink">{toast.title}</p>
            {toast.description && <p className="mt-0.5 truncate text-xs text-ink/60">{toast.description}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="absolute right-2 top-2 rounded-full p-1.5 text-ink/40 transition hover:bg-line hover:text-ink"
        >
          <X size={15} />
        </button>
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-line/60">
          <div
            className={`animate-shrink h-full origin-left group-hover:[animation-play-state:paused] ${tone.bar}`}
            style={{ animationDuration: `${TOAST_DURATION}ms` }}
          />
        </div>
      </div>
    </div>
  );
}
