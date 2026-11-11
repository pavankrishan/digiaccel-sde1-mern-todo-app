import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { isSameDay } from 'date-fns';
import { useTasks } from '../hooks/useTasks';
import { formatWeekLabel, weekStartOf } from '../lib/dates';
import TaskList from './TaskList';

/** Summary card for one Monday–Sunday week; expands to list its tasks. */
export default function WeekCard({ week, expanded, highlighted, onToggle }) {
  const panelId = useId();
  const query = useTasks({ from: week.weekStart, to: week.weekEnd }, { enabled: expanded });
  const isCurrent = isSameDay(new Date(week.weekStart), weekStartOf(new Date()));
  const pct = week.total ? Math.round((week.completed / week.total) * 100) : 0;

  return (
    <li className={`border bg-white transition ${
        expanded ? 'border-primary/40 shadow-sm' : highlighted ? 'border-primary/25' : 'border-line'
      }`}
    >
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="w-full px-4 py-3.5 text-left"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-medium">{formatWeekLabel(week.weekStart)}</span>
            {isCurrent && (
              <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] text-white">This week</span>
            )}
          </div>
          <ChevronDown
            size={18}
            className={`shrink-0 text-ink/50 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>

        <div className="mt-2.5 flex items-center gap-2 text-xs">
          <span className="rounded-sm bg-pending-bg px-2 py-1 text-red-700">
            <strong className="font-semibold">{week.open}</strong> Open
          </span>
          <span className="rounded-sm bg-done-bg px-2 py-1 text-navy">
            <strong className="font-semibold">{week.completed}</strong> Completed
          </span>
          <span className="ml-auto text-muted">{pct}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full bg-lavender">
          <div className="h-full bg-navy transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
      </button>

      {expanded && (
        <div id={panelId} className="border-t border-line px-4 pb-2 pt-1">
          <TaskList query={query} showDate bg="bg-white" empty="No tasks this week" />
        </div>
      )}
    </li>
  );
}
