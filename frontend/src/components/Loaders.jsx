import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useDelayedFlag } from '../hooks/useDelayedFlag';

export function Spinner({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Thin indeterminate bar at the top of the screen while any request is in flight. */
export function TopProgressBar() {
  const busy = useIsFetching() + useIsMutating() > 0;
  // Small delay so instant responses don't flash the bar.
  const visible = useDelayedFlag(busy, 150);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[80] h-[3px] overflow-hidden transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      role="progressbar"
      aria-hidden={!visible}
      aria-label="Loading"
    >
      <div className="animate-indeterminate h-full w-full origin-left bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
    </div>
  );
}

/** Skeleton rows shaped like task items. */
export function TaskListSkeleton({ rows = 3 }) {
  return (
    <ul aria-busy="true" aria-label="Loading tasks">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-4">
          <span className="skeleton size-[18px] shrink-0" />
          <div className="flex flex-1 items-center gap-3 border-b border-line py-3.5">
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3" style={{ width: `${70 - i * 12}%` }} />
              <div className="skeleton h-2 w-24" />
            </div>
            <span className="skeleton size-5" />
            <span className="skeleton size-5" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function WeekCardSkeleton() {
  return (
    <li className="border border-line bg-white px-4 py-3.5" aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="skeleton h-3.5 w-36" />
        <div className="skeleton size-4" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="skeleton h-6 w-16" />
        <div className="skeleton h-6 w-24" />
      </div>
      <div className="skeleton mt-2.5 h-1.5 w-full" />
    </li>
  );
}

/**
 * The API runs on a free tier that sleeps when idle; the first request can take
 * ~30s. Explain that instead of leaving the user staring at skeletons.
 */
export function SlowServerNotice({ loading }) {
  const show = useDelayedFlag(loading, 4000);
  if (!show) return null;
  return (
    <div className="animate-fade-in mb-3 flex items-start gap-3 rounded-sm border border-primary/20 bg-primary/5 px-3.5 py-3 text-xs text-ink/80">
      <Spinner size={16} className="mt-0.5 shrink-0 text-primary" />
      <p>
        <span className="font-medium text-ink">Waking up the server…</span>
        <br />
        The free-tier API sleeps when idle, so the first load can take up to 30 seconds.
      </p>
    </div>
  );
}
