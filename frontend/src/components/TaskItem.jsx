import { format } from 'date-fns';
import { Check, SquarePen, Trash2 } from 'lucide-react';
import SwipeableRow from './SwipeableRow';
import PriorityBadge from './PriorityBadge';
import { useTaskUI } from './TaskUIProvider';
import { formatTaskTime } from '../lib/dates';

export default function TaskItem({ task, showDate = false, bg = 'bg-surface', showActions = true }) {
  const { toggleStatus, openView, openEdit, remove } = useTaskUI();
  const done = task.status === 'completed';

  return (
    <li>
      <SwipeableRow onDelete={() => remove(task)}>
        <div className={`flex items-center gap-4 ${bg}`}>
          <button
            type="button"
            role="checkbox"
            aria-checked={done}
            aria-label={done ? `Mark "${task.title}" as in progress` : `Mark "${task.title}" as completed`}
            onClick={() => toggleStatus(task)}
            className={`flex size-[18px] shrink-0 items-center justify-center rounded-[3px] border transition ${
              done ? 'border-primary/50 bg-primary/10 text-primary' : 'border-primary hover:bg-primary/5'
            }`}
          >
            {done && <Check size={13} strokeWidth={2.5} />}
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2 border-b border-line py-3.5">
            <button type="button" onClick={() => openView(task)} className="min-w-0 flex-1 text-left">
              <p className={`truncate text-sm ${done ? 'text-ink/70 line-through' : 'text-ink'}`}>{task.title}</p>
              <p className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                <span className="truncate">
                  {showDate && `${format(new Date(task.dueDate), 'EEE, d MMM')} · `}
                  {formatTaskTime(task)}
                </span>
                <PriorityBadge priority={task.priority} />
              </p>
            </button>

            {showActions && (
              <div className="flex shrink-0 items-center gap-1 text-[#c5c5cc]">
                <button
                  type="button"
                  onClick={() => remove(task)}
                  aria-label={`Delete "${task.title}"`}
                  className="rounded p-1.5 transition hover:bg-red-50 hover:text-danger"
                >
                  <Trash2 size={19} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(task)}
                  aria-label={`Edit "${task.title}"`}
                  className="rounded p-1.5 transition hover:bg-primary/10 hover:text-primary"
                >
                  <SquarePen size={19} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
        </div>
      </SwipeableRow>
    </li>
  );
}
