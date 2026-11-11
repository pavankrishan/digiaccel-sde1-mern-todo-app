import { Check, X } from 'lucide-react';

export function StatCards({ completed, pending, loading }) {
  return (
    <div className="grid grid-cols-2 gap-3.5">
      <StatCard
        tone="done"
        label="Task Complete"
        value={completed}
        loading={loading}
        icon={<Check size={14} strokeWidth={2.5} />}
      />
      <StatCard tone="pending" label="Task Pending" value={pending} loading={loading} icon={<X size={14} strokeWidth={2.5} />} />
    </div>
  );
}

function StatCard({ tone, label, value, icon, loading }) {
  const done = tone === 'done';
  return (
    <div className={`px-3 py-3.5 ${done ? 'bg-done-bg' : 'bg-pending-bg'}`}>
      <div className="flex items-center gap-2">
        <span
          className={`flex size-[22px] items-center justify-center p-[3px] ${done ? 'bg-done-icon' : 'bg-pending-icon'}`}
        >
          <span
            className={`flex size-full items-center justify-center rounded-[2px] border ${
              done ? 'border-navy text-navy' : 'border-red-700 text-red-700'
            }`}
          >
            {icon}
          </span>
        </span>
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 pl-8">
        {loading ? (
          <span className="skeleton inline-block h-6 w-8 align-middle" aria-label="Loading" />
        ) : (
          <span key={value} className="animate-pop inline-block text-xl font-semibold tabular-nums">
            {String(value).padStart(2, '0')}
          </span>
        )}
        <span className="ml-1.5 text-[9px] text-ink/50">This Week</span>
      </p>
    </div>
  );
}

export function WeeklyProgress({ completed, total }) {
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-medium">Weekly Progress</h2>
        <span className="text-xs text-muted">
          {completed}/{total} done · {pct}%
        </span>
      </div>
      <div
        className="h-[18px] w-full bg-lavender"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Weekly progress"
      >
        <div className="h-full bg-navy transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </section>
  );
}
